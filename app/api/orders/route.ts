import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'
import Razorpay from 'razorpay'
import {
  getOrdersCollection,
  getUsersCollection,
  getCheckoutIntentsCollection,
} from '@/lib/mongodb'
import { Order, ServerOrder, ShippingAddress } from '@/types/order'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

const SHIPPING_FIELDS: (keyof ShippingAddress)[] = [
  'firstName', 'lastName', 'email', 'phone',
  'address', 'city', 'state', 'zipCode', 'country',
]

function sanitizeShippingAddress(input: any): ShippingAddress | null {
  if (!input || typeof input !== 'object') return null
  const address = {} as ShippingAddress
  for (const field of SHIPPING_FIELDS) {
    const value = input[field]
    if (typeof value !== 'string' || value.trim() === '') return null
    if (value.length > 200) return null
    address[field] = value.trim()
  }
  return address
}

// Constant-time comparison so signature verification cannot be probed by timing.
function signatureMatches(expected: string, provided: unknown): boolean {
  if (typeof provided !== 'string') return false
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(provided, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json().catch(() => ({}))
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      shippingAddress: rawShippingAddress,
    } = body

    if (
      typeof razorpay_order_id !== 'string' ||
      typeof razorpay_payment_id !== 'string' ||
      typeof razorpay_signature !== 'string'
    ) {
      return NextResponse.json({ error: 'Missing payment details' }, { status: 400 })
    }

    const shippingAddress = sanitizeShippingAddress(rawShippingAddress)
    if (!shippingAddress) {
      return NextResponse.json({ error: 'Invalid shipping address' }, { status: 400 })
    }

    // 1. The signature proves Razorpay produced this payment for this order.
    const expectedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    if (!signatureMatches(expectedSignature, razorpay_signature)) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    // 2. Read the server-computed price snapshot for this Razorpay order.
    const intents = await getCheckoutIntentsCollection()
    const intent = await intents.findOne({
      razorpayOrderId: razorpay_order_id,
      userEmail: session.user.email,
    })

    if (!intent) {
      return NextResponse.json({ error: 'Unknown or expired checkout session' }, { status: 409 })
    }

    // 3. Confirm with Razorpay that the money actually arrived, in full. This
    //    runs before the intent is claimed so a transient Razorpay outage
    //    leaves the customer able to retry rather than stranding their payment.
    let payment
    try {
      payment = await razorpay.payments.fetch(razorpay_payment_id)
    } catch (lookupError) {
      console.error(`Could not verify payment ${razorpay_payment_id}:`, lookupError)
      return NextResponse.json(
        { error: 'Could not verify this payment. Please contact support before paying again.' },
        { status: 402 }
      )
    }

    if (payment.order_id !== razorpay_order_id) {
      return NextResponse.json({ error: 'Payment does not match order' }, { status: 400 })
    }
    if (payment.status !== 'captured' && payment.status !== 'authorized') {
      return NextResponse.json({ error: 'Payment was not completed' }, { status: 400 })
    }
    if (Number(payment.amount) !== Number(intent.amountPaise)) {
      console.error(
        `Payment amount mismatch for ${razorpay_payment_id}: charged ${payment.amount}, expected ${intent.amountPaise}`
      )
      return NextResponse.json({ error: 'Payment amount mismatch' }, { status: 400 })
    }

    // 4. Claim the intent. Whichever concurrent request wins this transition is
    //    the only one that may write an order; the unique index on
    //    paymentDetails.razorpay_payment_id is the backstop behind it.
    const claim = await intents.updateOne(
      { razorpayOrderId: razorpay_order_id, userEmail: session.user.email, status: 'created' },
      { $set: { status: 'consumed', consumedAt: new Date() } }
    )

    if (claim.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'This payment has already been processed' },
        { status: 409 }
      )
    }

    const claimed = intent

    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Calculate estimated delivery (7-10 business days from now)
    const estimatedDelivery = new Date()
    estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 4) + 7)

    // Items and totals come from the claimed intent, never from the request body.
    const serverOrder: ServerOrder = {
      orderId,
      userId: session.user.email,
      userEmail: session.user.email,
      items: claimed.items,
      shippingAddress,
      paymentDetails: {
        razorpay_payment_id,
        razorpay_order_id,
        razorpay_signature,
        amount: claimed.orderSummary.total,
        currency: 'INR',
        status: 'success',
        created_at: new Date(),
      },
      orderSummary: claimed.orderSummary,
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedDelivery
    }

    // Save to database
    const collection = await getOrdersCollection()
    const result = await collection.insertOne(serverOrder)

    if (!result.insertedId) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    await intents.updateOne(
      { razorpayOrderId: razorpay_order_id },
      { $set: { orderId } }
    )

    // If a discount code was used, register it for the user
    if (serverOrder.orderSummary.discountCode) {
      const usersCollection = await getUsersCollection()
      await usersCollection.updateOne(
        { email: session.user.email },
        { $addToSet: { usedCoupons: serverOrder.orderSummary.discountCode } as any }
      )
    }

    // Convert server order to client order for response
    const clientOrder: Order = {
      ...serverOrder,
      _id: result.insertedId.toString()
    }

    return NextResponse.json({
      success: true,
      orderId: serverOrder.orderId,
      order: clientOrder
    })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10) || 10, 1), 50)
    const skip = (page - 1) * limit

    const collection = await getOrdersCollection()
    
    // Get orders for the user
    const orders = await collection
      .find({ userId: session.user.email })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count for pagination
    const totalOrders = await collection.countDocuments({ userId: session.user.email })

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        ...order,
        _id: order._id.toString()
      })),
      pagination: {
        page,
        limit,
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        hasNext: page * limit < totalOrders,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import {
  getOrdersCollection,
  getUsersCollection,
  getCheckoutIntentsCollection,
} from '@/lib/mongodb'
import { Order, ServerOrder, ShippingAddress } from '@/types/order'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { reserveStock, releaseStock } from '@/lib/stock'
import { razorpay, checkoutSignatureMatches } from '@/lib/razorpay'

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await enforceRateLimit(request, RATE_LIMITS.orderCreate, session.user.id)
    if (limited) return limited

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
    if (!checkoutSignatureMatches(razorpay_order_id, razorpay_payment_id, razorpay_signature)) {
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

    // 3b. An authorized payment is only a hold on the customer's funds. Razorpay
    //     releases it back to them after five days if nobody captures it, and an
    //     uncaptured payment never enters the settlement balance. Confirming an
    //     order on `authorized` therefore ships goods against money that later
    //     disappears and never reaches the merchant's bank, so capture it here
    //     and refuse the order if the capture does not stick. Whether checkout
    //     auto-captures is a dashboard setting we do not control from code; this
    //     makes the outcome the same either way.
    if (payment.status === 'authorized') {
      try {
        payment = await razorpay.payments.capture(
          razorpay_payment_id,
          Number(payment.amount),
          String(payment.currency)
        )
      } catch (captureError) {
        // A concurrent retry may have captured it moments ago, and Razorpay
        // rejects the second capture outright. Re-read before giving up.
        const recheck = await razorpay.payments.fetch(razorpay_payment_id).catch(() => null)
        if (recheck?.status !== 'captured') {
          console.error(`Could not capture payment ${razorpay_payment_id}:`, captureError)
          return NextResponse.json(
            {
              error:
                'Your payment could not be completed. Any amount held will be released by your bank. Please contact support before paying again.',
            },
            { status: 402 }
          )
        }
        payment = recheck
      }
    }

    // Everything past this point — the order, the stock reservation, the refund
    // on the out-of-stock path — assumes real money has changed hands.
    if (payment.status !== 'captured') {
      console.error(
        `Payment ${razorpay_payment_id} is '${payment.status}' after capture; refusing to confirm the order`
      )
      return NextResponse.json({ error: 'Payment was not completed' }, { status: 400 })
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

    // 5. Reserve inventory. Stock was checked during pricing, but that was
    //    before the customer paid — another buyer may have taken the last unit
    //    since. If the guarded decrement fails we hold money for goods we
    //    cannot ship, so refund immediately rather than confirm the order.
    const reservation = await reserveStock(claimed.items)
    if (!reservation.ok) {
      let refunded = false
      try {
        await razorpay.payments.refund(razorpay_payment_id, {
          amount: Number(claimed.amountPaise),
          speed: 'normal' as const,
          notes: { reason: 'Out of stock at order confirmation', razorpay_order_id },
          receipt: `oos_${razorpay_order_id}`,
        })
        refunded = true
      } catch (refundError) {
        console.error(
          `URGENT: payment ${razorpay_payment_id} captured but stock reservation failed and the automatic refund errored. Manual refund required.`,
          refundError
        )
      }

      await intents.updateOne(
        { razorpayOrderId: razorpay_order_id },
        {
          $set: {
            status: 'failed_out_of_stock',
            failedAt: new Date(),
            refunded,
            requiresManualRefund: !refunded,
          },
        }
      )

      return NextResponse.json(
        {
          error: refunded
            ? `Sorry — "${reservation.failure?.productName}" sold out while your payment was processing. You have been refunded in full.`
            : `Sorry — "${reservation.failure?.productName}" sold out while your payment was processing. Our team will refund you shortly.`,
        },
        { status: 409 }
      )
    }

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
    let result
    try {
      result = await collection.insertOne(serverOrder)
    } catch (insertError) {
      // Put the reserved units back rather than leaking them out of inventory.
      await releaseStock(claimed.items)
      throw insertError
    }

    if (!result.insertedId) {
      await releaseStock(claimed.items)
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
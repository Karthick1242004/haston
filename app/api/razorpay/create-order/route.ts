import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getCheckoutIntentsCollection } from '@/lib/mongodb'
import { priceUserCart, PricingError } from '@/lib/pricing-server'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const limited = await enforceRateLimit(request, RATE_LIMITS.paymentCreate, session.user.id)
    if (limited) return limited

    const body = await request.json().catch(() => ({}))
    const { discountCode } = body

    // The amount is derived from the user's stored cart priced against the
    // products collection. Anything the client sent about price is ignored.
    const { items, orderSummary, amountPaise } = await priceUserCart(
      session.user.email,
      discountCode
    )

    const order = await razorpay.orders.create({
      amount: amountPaise,
      currency: 'INR',
      receipt: `rcpt_${Date.now()}`,
      notes: {
        userEmail: session.user.email,
      },
    })

    // Persist the price snapshot so /api/orders can write the order from server
    // figures rather than trusting whatever the browser posts back.
    const intents = await getCheckoutIntentsCollection()
    await intents.insertOne({
      razorpayOrderId: order.id,
      userEmail: session.user.email,
      items,
      orderSummary,
      amountPaise,
      status: 'created',
      createdAt: new Date(),
    })

    return NextResponse.json({
      success: true,
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      key_id: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      orderSummary,
    })
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json({ error: error.message }, { status: error.status })
    }
    console.error('Error creating Razorpay order:', error)
    return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
  }
}

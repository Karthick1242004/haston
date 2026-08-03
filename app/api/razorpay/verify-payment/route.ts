import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

// Advisory check only — it lets the browser show a success state early. The
// authoritative verification (signature + Razorpay payment lookup + amount
// match against the server-computed price) happens in POST /api/orders, which
// is the only place an order is ever created.
export async function POST(request: NextRequest) {
  try {
    const body = await request.json().catch(() => ({}))
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    if (
      typeof razorpay_order_id !== 'string' ||
      typeof razorpay_payment_id !== 'string' ||
      typeof razorpay_signature !== 'string'
    ) {
      return NextResponse.json(
        { error: 'Missing required payment verification parameters' },
        { status: 400 }
      )
    }

    const expected = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET!)
      .update(`${razorpay_order_id}|${razorpay_payment_id}`)
      .digest('hex')

    const expectedBuf = Buffer.from(expected, 'utf8')
    const providedBuf = Buffer.from(razorpay_signature, 'utf8')
    const isAuthentic =
      expectedBuf.length === providedBuf.length &&
      crypto.timingSafeEqual(expectedBuf, providedBuf)

    if (!isAuthentic) {
      return NextResponse.json({ error: 'Invalid payment signature' }, { status: 400 })
    }

    return NextResponse.json({
      success: true,
      message: 'Payment verified successfully',
      payment_id: razorpay_payment_id,
      order_id: razorpay_order_id,
    })
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 })
  }
}

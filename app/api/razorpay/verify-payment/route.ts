import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = body

    // Validate required fields
    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json(
        { error: 'Missing required payment verification parameters' },
        { status: 400 }
      )
    }

    // Create expected signature
    const secret = process.env.RAZORPAY_KEY_SECRET!
    const body_string = razorpay_order_id + "|" + razorpay_payment_id
    const expected_signature = crypto
      .createHmac('sha256', secret)
      .update(body_string.toString())
      .digest('hex')

    // Verify signature
    const is_authentic = expected_signature === razorpay_signature

    if (is_authentic) {
      // TODO: Update order status in database
      // TODO: Send confirmation email
      // TODO: Clear cart
      
      return NextResponse.json({
        success: true,
        message: 'Payment verified successfully',
        payment_id: razorpay_payment_id,
        order_id: razorpay_order_id,
      })
    } else {
      return NextResponse.json(
        { error: 'Invalid payment signature' },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Error verifying payment:', error)
    return NextResponse.json(
      { error: 'Payment verification failed' },
      { status: 500 }
    )
  }
} 
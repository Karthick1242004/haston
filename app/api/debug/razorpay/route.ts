import { NextRequest, NextResponse } from 'next/server'
import Razorpay from 'razorpay'

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('payment_id')

    // Basic Razorpay connection test
    console.log('Testing Razorpay connection...')
    console.log('API Key ID:', process.env.RAZORPAY_KEY_ID)
    console.log('API Key Secret exists:', !!process.env.RAZORPAY_KEY_SECRET)

    const response: any = {
      razorpay_connection: 'testing...',
      api_key_id: process.env.RAZORPAY_KEY_ID,
      api_key_secret_exists: !!process.env.RAZORPAY_KEY_SECRET,
      test_mode: process.env.RAZORPAY_KEY_ID?.startsWith('rzp_test_'),
    }

    // Test basic API connectivity by fetching payments
    try {
      const payments = await razorpay.payments.all({ count: 1 })
      response.api_connectivity = 'success'
      response.sample_payment_count = payments.count
    } catch (apiError: any) {
      response.api_connectivity = 'failed'
      response.api_error = {
        statusCode: apiError.statusCode,
        error: apiError.error,
        message: apiError.message
      }
    }

    // If payment ID provided, fetch specific payment
    if (paymentId) {
      try {
        const payment = await razorpay.payments.fetch(paymentId)
        response.payment_details = {
          id: payment.id,
          status: payment.status,
          amount: payment.amount,
          captured: payment.captured,
          method: payment.method,
          order_id: payment.order_id,
          created_at: payment.created_at
        }
        response.payment_fetch = 'success'
      } catch (paymentError: any) {
        response.payment_fetch = 'failed'
        response.payment_error = {
          statusCode: paymentError.statusCode,
          error: paymentError.error,
          message: paymentError.message
        }
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Debug endpoint error:', error)
    return NextResponse.json({
      error: 'Debug endpoint failed',
      details: error.message
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { payment_id, test_refund = false } = await request.json()

    if (!payment_id) {
      return NextResponse.json({ error: 'payment_id is required' }, { status: 400 })
    }

    const response: any = {
      payment_id,
      test_refund,
    }

    // Fetch payment first
    try {
      const payment = await razorpay.payments.fetch(payment_id)
      response.payment_status = payment.status
      response.payment_captured = payment.captured
      response.payment_amount = payment.amount
      response.payment_method = payment.method

      // Check if eligible for refund
      if (payment.status === 'captured' && payment.captured) {
        response.refund_eligible = true

        if (test_refund) {
          // Test with a small amount (1 rupee = 100 paise)
          try {
            const refund = await razorpay.payments.refund(payment_id, {
              amount: 100, // 1 rupee in paise
              speed: 'normal',
              notes: {
                test: 'debug_refund_test',
                timestamp: new Date().toISOString()
              },
              receipt: `debug_refund_${Date.now()}`
            })

            response.test_refund_result = 'success'
            response.refund_details = {
              id: refund.id,
              amount: refund.amount,
              status: refund.status
            }
          } catch (refundError: any) {
            response.test_refund_result = 'failed'
            response.refund_error = {
              statusCode: refundError.statusCode,
              error: refundError.error,
              message: refundError.message
            }
          }
        }
      } else {
        response.refund_eligible = false
        response.refund_ineligible_reason = `Payment status: ${payment.status}, captured: ${payment.captured}`
      }

    } catch (fetchError: any) {
      response.payment_fetch_error = {
        statusCode: fetchError.statusCode,
        error: fetchError.error,
        message: fetchError.message
      }
    }

    return NextResponse.json(response)

  } catch (error: any) {
    console.error('Debug POST error:', error)
    return NextResponse.json({
      error: 'Debug POST failed',
      details: error.message
    }, { status: 500 })
  }
}
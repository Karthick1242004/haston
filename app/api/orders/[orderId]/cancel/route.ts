import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getOrdersCollection } from '@/lib/mongodb'
import { Order, ServerOrder } from '@/types/order'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'
import { releaseStock } from '@/lib/stock'
import { razorpay } from '@/lib/razorpay'

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const limited = await enforceRateLimit(request, RATE_LIMITS.orderMutation, session.user.id)
    if (limited) return limited

    const { orderId } = params
    const { reason } = await request.json()

    const collection = await getOrdersCollection()

    // Find the order
    const order = await collection.findOne({ 
      orderId,
      userEmail: session.user.email 
    }) as ServerOrder | null

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      )
    }

    // Check if order can be cancelled
    if (order.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Order is already cancelled' },
        { status: 400 }
      )
    }

    if (['delivered', 'shipped'].includes(order.status)) {
      return NextResponse.json(
        { error: 'Cannot cancel order that has been shipped or delivered' },
        { status: 400 }
      )
    }

    // Check delivery date - must be 3+ days ahead
    if (order.estimatedDelivery) {
      const today = new Date()
      const deliveryDate = new Date(order.estimatedDelivery)
      const daysDifference = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))

      if (daysDifference < 3) {
        return NextResponse.json(
          { error: 'Cannot cancel order with delivery date less than 3 days away' },
          { status: 400 }
        )
      }
    }

    // Claim the cancellation before any money moves. Two concurrent requests
    // both pass the checks above off the same stale document, so without this
    // atomic transition each would fire its own refund for the full total.
    const previousStatus = order.status
    const claim = await collection.updateOne(
      { orderId, userEmail: session.user.email, status: { $nin: ['cancelled', 'cancelling'] } },
      { $set: { status: 'cancelling', updatedAt: new Date() } }
    )

    if (claim.modifiedCount === 0) {
      return NextResponse.json(
        { error: 'This order is already being cancelled' },
        { status: 409 }
      )
    }

    // Process refund with Razorpay
    let refundDetails = null
    if (order.paymentDetails?.razorpay_payment_id && order.paymentDetails?.status === 'success') {
      try {
        // Log payment details for debugging
        console.log('Processing refund for order:', orderId)
        console.log('Payment ID:', order.paymentDetails.razorpay_payment_id)
        console.log('Order total:', order.orderSummary.total)
        console.log('Payment status:', order.paymentDetails.status)

        // Validate payment ID format
        if (!order.paymentDetails.razorpay_payment_id.startsWith('pay_')) {
          throw new Error('Invalid payment ID format')
        }

        // First, fetch the payment to verify it exists and its status
        console.log('Fetching payment details from Razorpay...')
        let payment
        try {
          payment = await razorpay.payments.fetch(order.paymentDetails.razorpay_payment_id)
          console.log('Payment details from Razorpay:', {
            id: payment.id,
            status: payment.status,
            amount: payment.amount,
            captured: payment.captured,
            method: payment.method,
            order_id: payment.order_id
          })
        } catch (fetchError: any) {
          console.error('Failed to fetch payment:', fetchError)
          throw new Error(`Payment not found or invalid: ${fetchError.message}`)
        }

        // Check if payment is eligible for refund
        if (payment.status !== 'captured') {
          throw new Error(`Payment status is '${payment.status}', only captured payments can be refunded`)
        }

        if (!payment.captured) {
          throw new Error('Payment is not captured, cannot process refund')
        }

        // Refund what Razorpay actually captured, never the stored order total.
        // Refusing on a mismatch keeps a tampered order from draining more than
        // was ever paid.
        const expectedAmount = Math.round(order.orderSummary.total * 100)
        const capturedAmount = Number(payment.amount)
        if (capturedAmount !== expectedAmount) {
          console.error(
            `Refusing refund for ${orderId}: order total ${expectedAmount} paise but payment captured ${capturedAmount} paise`
          )
          throw new Error('Order total does not match the captured payment')
        }

        const refundAmount = capturedAmount
        const refundData = {
          amount: refundAmount,
          speed: 'normal' as const,
          notes: {
            reason: reason || 'Order cancelled by customer',
            order_id: orderId,
            cancelled_at: new Date().toISOString(),
          },
          receipt: `refund_${orderId}_${Date.now()}`,
        }

        console.log('Refund request data:', refundData)

        // Create refund
        const refund = await razorpay.payments.refund(order.paymentDetails.razorpay_payment_id, refundData)

        console.log('Refund response:', refund)

        refundDetails = {
          refund_id: refund.id,
          amount: refund.amount ? refund.amount / 100 : order.orderSummary.total, // Convert back to rupees or use order total
          status: refund.status,
          created_at: refund.created_at,
          speed_processed: refund.speed_processed,
        }
      } catch (refundError: any) {
        console.error('Razorpay refund error:', refundError)
        console.error('Error details:', {
          statusCode: refundError.statusCode,
          error: refundError.error,
          message: refundError.message
        })

        // Check if it's a specific Razorpay error
        if (refundError.statusCode === 400) {
          if (refundError.error?.code === 'BAD_REQUEST_ERROR') {
            console.error('Bad request error - likely invalid payment ID or payment not eligible for refund')
            
            // The cancellation stands, but no money has actually moved. Flag the
            // order so it surfaces in admin rather than sitting in a queue nobody
            // watches, and do not quote the customer a settlement date the system
            // cannot keep.
            console.error(
              `MANUAL REFUND REQUIRED: order ${orderId} cancelled but Razorpay refused the refund of ${order.orderSummary.total} for payment ${order.paymentDetails?.razorpay_payment_id}`
            )

            await collection.updateOne(
              { orderId, userEmail: session.user.email },
              {
                $set: {
                  status: 'cancelled',
                  cancelledAt: new Date(),
                  cancellationReason: reason || 'Cancelled by customer',
                  requiresManualRefund: true,
                  refundDetails: {
                    refund_id: 'manual_refund_required',
                    amount: order.orderSummary.total,
                    status: 'manual_processing_required',
                    created_at: Date.now(),
                    error: 'Automatic refund failed - manual processing required'
                  },
                  stockRestored: true,
                  updatedAt: new Date(),
                }
              }
            )

            await releaseStock(order.items)

            return NextResponse.json({
              success: true,
              requiresManualRefund: true,
              message:
                'Your order has been cancelled. We could not process the refund automatically, so our team will review it and be in touch about your refund.',
              refundDetails: {
                refund_id: 'manual_refund_required',
                amount: order.orderSummary.total,
                status: 'manual_processing_required',
                error: 'Automatic refund failed - manual processing required'
              },
            })
          }
        }

        // Release the claim so the order is not stranded in `cancelling`.
        await collection.updateOne(
          { orderId, userEmail: session.user.email, status: 'cancelling' },
          { $set: { status: previousStatus, updatedAt: new Date() } }
        )

        return NextResponse.json(
          { error: 'Failed to process refund. Please contact support.' },
          { status: 500 }
        )
      }
    } else {
      console.log('No valid payment details found for refund processing')
      console.log('Payment details:', order.paymentDetails)
      
      // If no valid payment details, still cancel the order
      refundDetails = {
        refund_id: 'no_payment_to_refund',
        amount: 0,
        status: 'no_refund_required',
        created_at: Date.now(),
        note: 'No valid payment found to refund'
      }
    }

    // Update order status to cancelled
    await collection.updateOne(
      { orderId, userEmail: session.user.email },
      {
        $set: {
          status: 'cancelled',
          cancelledAt: new Date(),
          cancellationReason: reason || 'Cancelled by customer',
          refundDetails: refundDetails,
          stockRestored: true,
          updatedAt: new Date(),
        }
      }
    )

    // Nothing shipped, so the reserved units go back on the shelf.
    await releaseStock(order.items)

    return NextResponse.json({
      success: true,
      message: 'Order cancelled successfully',
      refundDetails,
    })

  } catch (error) {
    console.error('Order cancellation error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel order' },
      { status: 500 }
    )
  }
}
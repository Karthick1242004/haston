import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { webhookSignatureMatches } from '@/lib/razorpay'
import {
  getOrdersCollection,
  getPaymentEventsCollection,
  getCheckoutIntentsCollection,
} from '@/lib/mongodb'
import type { RefundDetails } from '@/types/order'

export const dynamic = 'force-dynamic'

/** Order states where goods have not gone out yet and a refund is still tidy. */
const NOT_YET_FULFILLED = ['pending', 'cancelling', 'cancelled']

type RazorpayEvent = {
  event?: unknown
  payload?: Record<string, { entity?: Record<string, any> }>
  created_at?: unknown
}

/**
 * Razorpay's server-to-server notifications. Nothing here is driven by the
 * browser, so this is the only place that still hears about a payment once the
 * customer has closed the tab — which is exactly when money goes missing.
 *
 * Configure at Dashboard → Settings → Webhooks against
 * https://<host>/api/razorpay/webhook, subscribing to payment.authorized,
 * payment.captured, payment.failed, refund.processed and settlement.processed,
 * then put the webhook's secret in RAZORPAY_WEBHOOK_SECRET.
 */
export async function POST(request: NextRequest) {
  // The signature covers the bytes as sent. Parsing first and re-serialising
  // would change the whitespace and invalidate every event.
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature')

  if (!process.env.RAZORPAY_WEBHOOK_SECRET) {
    console.error(
      'RAZORPAY_WEBHOOK_SECRET is not set; refusing to trust a Razorpay webhook. Payment events are being dropped.'
    )
    return NextResponse.json({ error: 'Webhook not configured' }, { status: 500 })
  }

  if (!webhookSignatureMatches(rawBody, signature)) {
    // Anyone can POST here, so an unsigned body is the expected case, not an
    // incident. Say nothing about why it failed.
    return NextResponse.json({ error: 'Invalid signature' }, { status: 400 })
  }

  let parsed: RazorpayEvent
  try {
    parsed = JSON.parse(rawBody)
  } catch {
    // Signed but unparseable is ours to investigate, not Razorpay's to retry.
    console.error('Razorpay webhook body passed signature check but is not JSON')
    return NextResponse.json({ received: true })
  }

  const eventType = typeof parsed.event === 'string' ? parsed.event : 'unknown'
  // Razorpay retries until it gets a 2xx, so the same event arrives more than
  // once. Fall back to a body hash when the header is absent so a retry of a
  // header-less delivery still collapses onto one document.
  const eventId =
    request.headers.get('x-razorpay-event-id') ||
    `sha:${crypto.createHash('sha256').update(rawBody).digest('hex')}`

  const paymentEntity = parsed.payload?.payment?.entity
  const refundEntity = parsed.payload?.refund?.entity
  const paymentId =
    typeof paymentEntity?.id === 'string'
      ? paymentEntity.id
      : typeof refundEntity?.payment_id === 'string'
        ? refundEntity.payment_id
        : null

  try {
    const events = await getPaymentEventsCollection()

    // The unique index on eventId is what makes this idempotent; see
    // scripts/create-security-indexes.js. Insert before acting so a retry that
    // races the first delivery cannot apply the same effect twice.
    try {
      await events.insertOne({
        eventId,
        event: eventType,
        paymentId,
        orderId: typeof paymentEntity?.order_id === 'string' ? paymentEntity.order_id : null,
        amount: paymentEntity?.amount ?? refundEntity?.amount ?? null,
        payload: parsed.payload ?? null,
        needsReconciliation: false,
        receivedAt: new Date(),
      })
    } catch (insertError: any) {
      if (insertError?.code === 11000) {
        return NextResponse.json({ received: true, duplicate: true })
      }
      throw insertError
    }

    const flag = async (reason: string) => {
      await events.updateOne({ eventId }, { $set: { needsReconciliation: true, reason } })
    }

    const orders = await getOrdersCollection()
    const order = paymentId
      ? await orders.findOne({ 'paymentDetails.razorpay_payment_id': paymentId })
      : null

    switch (eventType) {
      case 'payment.authorized': {
        // Authorized is a hold, not money: if nothing captures it, the bank
        // releases it back to the customer in about five days and it never
        // reaches a settlement. POST /api/orders captures before confirming, so
        // an order already sitting on an uncaptured payment means that path was
        // bypassed and we are about to ship against funds that will vanish.
        if (order) {
          console.error(
            `URGENT: order ${order.orderId} exists for payment ${paymentId}, which is still only authorized. Capture or cancel it before dispatch.`
          )
          await flag('order confirmed on an uncaptured payment')
        }
        break
      }

      case 'payment.captured': {
        if (!order) {
          // The customer paid and the browser never came back to POST
          // /api/orders — a closed tab, a dead connection, a crash. The money is
          // real and will settle, but nobody is going to ship anything.
          const intents = await getCheckoutIntentsCollection()
          const intent = paymentEntity?.order_id
            ? await intents.findOne({ razorpayOrderId: paymentEntity.order_id })
            : null

          console.error(
            `URGENT: payment ${paymentId} captured with no order behind it` +
              (intent ? ` (checkout intent for ${intent.userEmail})` : '') +
              '. Fulfil or refund it manually.'
          )
          await flag('captured payment with no order')
        }
        break
      }

      case 'payment.failed': {
        // Recorded only. A failed payment takes no money, and the customer is
        // already looking at the failure in the checkout modal.
        break
      }

      case 'refund.created':
      case 'refund.processed': {
        if (!order) break

        const refund: RefundDetails = {
          refund_id: typeof refundEntity?.id === 'string' ? refundEntity.id : '',
          amount: Number(refundEntity?.amount ?? 0),
          status: typeof refundEntity?.status === 'string' ? refundEntity.status : eventType,
          created_at: new Date(),
          speed_processed:
            typeof refundEntity?.speed_processed === 'string'
              ? refundEntity.speed_processed
              : undefined,
        }

        // Only fill in a refund the order does not already know about; the
        // cancel and return flows record their own and are the fuller story.
        await orders.updateOne(
          { _id: order._id, refundDetails: { $exists: false } },
          { $set: { refundDetails: refund, updatedAt: new Date() } }
        )

        // A refund against an order that is still being fulfilled means the
        // customer has their money and we are still preparing to hand over
        // goods. Status is left alone — unwinding the order is a human call.
        if (!NOT_YET_FULFILLED.includes(order.status)) {
          console.error(
            `URGENT: payment ${paymentId} refunded while order ${order.orderId} is '${order.status}'. Hold the dispatch.`
          )
          await flag(`refund on an order in '${order.status}'`)
        }
        break
      }

      default:
        // settlement.processed and anything else we subscribe to later: the
        // insert above is the record. Acknowledge so Razorpay stops retrying.
        break
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    // A non-2xx makes Razorpay retry, which is what we want for a transient
    // database failure — the event is not lost.
    console.error(`Failed to handle Razorpay webhook ${eventType} (${eventId}):`, error)
    return NextResponse.json({ error: 'Webhook handling failed' }, { status: 500 })
  }
}

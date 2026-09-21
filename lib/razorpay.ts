import Razorpay from 'razorpay'
import crypto from 'crypto'

if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
  throw new Error(
    'Invalid/Missing environment variable: "RAZORPAY_KEY_ID" / "RAZORPAY_KEY_SECRET"'
  )
}

const keySecret = process.env.RAZORPAY_KEY_SECRET

export const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: keySecret,
})

// Constant-time comparison so signature verification cannot be probed by timing.
function signatureMatches(expected: string, provided: unknown): boolean {
  if (typeof provided !== 'string') return false
  const a = Buffer.from(expected, 'utf8')
  const b = Buffer.from(provided, 'utf8')
  if (a.length !== b.length) return false
  return crypto.timingSafeEqual(a, b)
}

/**
 * Proves Razorpay's checkout produced `paymentId` for `orderId`. Signed with the
 * API key secret, which is what Razorpay hands the browser handler.
 */
export function checkoutSignatureMatches(
  orderId: string,
  paymentId: string,
  provided: unknown
): boolean {
  const expected = crypto
    .createHmac('sha256', keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  return signatureMatches(expected, provided)
}

/**
 * Proves a webhook body came from Razorpay. Signed with the per-webhook secret
 * set in the dashboard, which is a different secret from the API key above, and
 * computed over the exact bytes received — re-serialising the JSON breaks it.
 */
export function webhookSignatureMatches(rawBody: string, provided: unknown): boolean {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return false

  const expected = crypto.createHmac('sha256', secret).update(rawBody).digest('hex')

  return signatureMatches(expected, provided)
}

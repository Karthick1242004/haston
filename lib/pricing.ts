// Single source of truth for checkout maths. The checkout page imports the same
// constants so what the customer sees matches what the server charges; only the
// server's numbers are ever persisted or sent to Razorpay.
export const FREE_SHIPPING_THRESHOLD = 200
export const SHIPPING_FLAT_RATE = 12
export const TAX_RATE = 0.08

const round2 = (n: number) => Math.round(n * 100) / 100

export function computeTotals(subtotal: number, discountPercentage: number) {
  const discount = round2((subtotal * discountPercentage) / 100)
  const shipping = subtotal > FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_FLAT_RATE
  const taxes = round2((subtotal - discount) * TAX_RATE)
  const total = round2(subtotal - discount + shipping + taxes)
  return { discount, shipping, taxes, total }
}

// Escapes regex metacharacters so a user-supplied string is matched literally.
// Without this, a code of ".*" matches every coupon in the collection.
export function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}


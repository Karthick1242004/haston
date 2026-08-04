import { ObjectId } from 'mongodb'
import {
  getProductsCollection,
  getCouponsCollection,
  findUserByEmail,
} from '@/lib/mongodb'
import type { OrderItem, OrderSummary } from '@/types/order'
import { computeTotals, escapeRegex } from '@/lib/pricing'
import { normalizeColor, normalizeSize } from '@/lib/cart'

const round2 = (n: number) => Math.round(n * 100) / 100

export interface ValidatedCoupon {
  code: string
  discountPercentage: number
}

/**
 * Resolves a coupon code to its stored discount, enforcing that the coupon is
 * active and that this user has not already redeemed it. Returns null when no
 * code was supplied; throws PricingError when the code is present but unusable.
 */
export async function validateCoupon(
  code: unknown,
  userEmail: string
): Promise<ValidatedCoupon | null> {
  if (code === undefined || code === null || code === '') return null
  if (typeof code !== 'string' || code.length > 64) {
    throw new PricingError('Invalid coupon code')
  }

  const coupons = await getCouponsCollection()
  const coupon = await coupons.findOne({
    code: { $regex: new RegExp(`^${escapeRegex(code)}$`, 'i') },
    isActive: true,
  })

  if (!coupon) throw new PricingError('Invalid or inactive coupon code')

  const discountPercentage = Number(coupon.discountPercentage)
  if (!Number.isFinite(discountPercentage) || discountPercentage < 0 || discountPercentage > 100) {
    throw new PricingError('Coupon is misconfigured')
  }

  const user = await findUserByEmail(userEmail)
  // Compare case-insensitively: usedCoupons entries written before codes were
  // canonicalised may differ in case from the stored coupon code.
  const used = (user?.usedCoupons || []).map((c: string) => String(c).toLowerCase())
  if (used.includes(String(coupon.code).toLowerCase())) {
    throw new PricingError('You have already used this coupon code')
  }

  return { code: coupon.code, discountPercentage }
}

export class PricingError extends Error {
  status: number
  constructor(message: string, status = 400) {
    super(message)
    this.name = 'PricingError'
    this.status = status
  }
}

export interface PricedCart {
  items: OrderItem[]
  orderSummary: OrderSummary
  amountPaise: number
}

/**
 * Rebuilds the cart from the user's persisted cart document, re-reading every
 * price from the products collection. Client-supplied prices are never trusted.
 */
export async function priceUserCart(
  userEmail: string,
  discountCode?: unknown
): Promise<PricedCart> {
  const user = await findUserByEmail(userEmail)
  const cartItems = user?.cartItems || []

  if (!Array.isArray(cartItems) || cartItems.length === 0) {
    throw new PricingError('Your cart is empty')
  }

  const productIds = cartItems
    .map((item) => String(item.productId))
    .filter((id) => ObjectId.isValid(id))
    .map((id) => new ObjectId(id))

  if (productIds.length !== cartItems.length) {
    throw new PricingError('Your cart contains an invalid item. Please refresh your cart.')
  }

  const products = await getProductsCollection()
  const docs = await products.find({ _id: { $in: productIds } }).toArray()
  const byId = new Map(docs.map((doc) => [doc._id.toString(), doc]))

  const items: OrderItem[] = []
  let subtotal = 0

  for (const cartItem of cartItems) {
    const product = byId.get(String(cartItem.productId))
    if (!product) {
      throw new PricingError(
        `"${cartItem.name || 'An item'}" is no longer available. Please remove it from your cart.`
      )
    }

    const quantity = Number(cartItem.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100) {
      throw new PricingError('Invalid quantity in your cart')
    }

    // Authoritative price: the product document, never the cart or the client.
    const price = Number(product.price)
    if (!Number.isFinite(price) || price < 0) {
      throw new PricingError(`"${product.name}" is mispriced and cannot be ordered`)
    }

    // Fail before the customer pays. The binding check is the guarded decrement
    // at order creation; this one exists so the common case produces a clear
    // message instead of a refund.
    const available = Number(product.stock ?? 0)
    if (!Number.isFinite(available) || available < quantity) {
      throw new PricingError(
        available > 0
          ? `Only ${available} of "${product.name}" left in stock`
          : `"${product.name}" is out of stock`
      )
    }

    const itemSubtotal = round2(price * quantity)
    subtotal = round2(subtotal + itemSubtotal)

    items.push({
      id: product._id.toString(),
      name: product.name,
      image: cartItem.image || product.image || product.images?.[0] || '',
      price,
      quantity,
      selectedSize: normalizeSize(cartItem.selectedSize),
      selectedColor: normalizeColor(cartItem.selectedColor),
      subtotal: itemSubtotal,
    })
  }

  const coupon = await validateCoupon(discountCode, userEmail)
  const { discount, shipping, taxes, total } = computeTotals(
    subtotal,
    coupon?.discountPercentage ?? 0
  )

  if (total <= 0) throw new PricingError('Order total must be greater than zero')

  const orderSummary: OrderSummary = {
    subtotal,
    shipping,
    taxes,
    discount,
    total,
    ...(coupon ? { discountCode: coupon.code } : {}),
  }

  return { items, orderSummary, amountPaise: Math.round(total * 100) }
}

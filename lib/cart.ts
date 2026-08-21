/**
 * Cart line identity.
 *
 * A colour reaches the cart in two shapes depending on where it was added
 * from: a plain name ("White") from the product page, or a ProductColor object
 * ({ name: "White", value: "#ffffff" }) from the shop grid and wishlist, which
 * pass `product.colors[0]` straight through.
 *
 * Every match used to be `item.selectedColor === selectedColor`. For objects
 * that is reference equality, and a cart rehydrated from the database is all
 * fresh instances — so remove and quantity updates silently matched nothing,
 * and add appended a duplicate line instead of merging. Normalising to the
 * colour name at every boundary is what makes a cart line identifiable.
 */

export function normalizeColor(value: unknown): string {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'object') {
    const name = (value as { name?: unknown }).name
    if (typeof name === 'string') return name.trim()
  }
  return String(value).trim()
}

export function normalizeSize(value: unknown): string {
  return typeof value === 'string' ? value.trim() : String(value ?? '').trim()
}

/**
 * The identity of a cart line. Two lines are the same line when this matches;
 * colour comparison is case-insensitive so "White" and "white" merge rather
 * than sitting in the cart as two entries of the same garment.
 */
export function cartLineKey(
  productId: unknown,
  selectedSize: unknown,
  selectedColor: unknown
): string {
  return [
    String(productId ?? '').trim(),
    normalizeSize(selectedSize).toLowerCase(),
    normalizeColor(selectedColor).toLowerCase(),
  ].join('|')
}

/**
 * Link target for a cart line. Cart items carry the product's id, so they can
 * link straight back to the product page. Returns "/shop" when the id is
 * missing or malformed, so a legacy cart row can never render a dead link.
 */
export function productHref(productId: unknown): string {
  const id = String(productId ?? '').trim()
  return /^[a-f\d]{24}$/i.test(id) ? `/product/${id}` : '/shop'
}

export function isSameCartLine(
  a: { id?: unknown; productId?: unknown; selectedSize?: unknown; selectedColor?: unknown },
  productId: unknown,
  selectedSize: unknown,
  selectedColor: unknown
): boolean {
  return (
    cartLineKey(a.id ?? a.productId, a.selectedSize, a.selectedColor) ===
    cartLineKey(productId, selectedSize, selectedColor)
  )
}

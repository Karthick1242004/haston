import { normalizeColor } from '@/lib/cart'

/**
 * Colour <-> image mapping for a product.
 *
 * The admin form states the contract explicitly: "Multiple Colors (images must
 * match color order)". Colour N therefore corresponds to image N. The storefront
 * was ignoring that entirely — it always sent images[0] to the cart, so choosing
 * the green tee added the brown one.
 *
 * Colours are stored as { name, value } objects, but older rows and some seed
 * data use plain strings, so both are accepted.
 */

export interface ResolvedColor {
  name: string
  /** CSS colour for the swatch. */
  value: string
  /** Index into product.images for this colour. */
  imageIndex: number
}

const FALLBACK_SWATCH = '#d1d5db'

export function resolveProductColors(product: any): ResolvedColor[] {
  let raw = product?.colors

  // Some records store the array as a JSON string.
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed)) raw = parsed
    } catch {
      raw = [raw]
    }
  }

  if (!Array.isArray(raw) || raw.length === 0) return []

  return raw
    .map((entry: any, index: number) => {
      const name = normalizeColor(entry)
      if (!name) return null
      const value =
        entry && typeof entry === 'object' && typeof entry.value === 'string'
          ? entry.value
          : FALLBACK_SWATCH
      return { name, value, imageIndex: index }
    })
    .filter((c): c is ResolvedColor => c !== null)
}

/**
 * The image that belongs to a colour. Falls back to the product's own image
 * when there is no matching entry, so a colour without its own photo still
 * shows something rather than nothing.
 */
export function imageForColor(product: any, colorName: unknown): string {
  const images: string[] = Array.isArray(product?.images) ? product.images : []
  const fallback = product?.image || images[0] || ''

  const wanted = normalizeColor(colorName).toLowerCase()
  if (!wanted) return fallback

  const match = resolveProductColors(product).find(
    (c) => c.name.toLowerCase() === wanted
  )
  if (!match) return fallback

  return images[match.imageIndex] || fallback
}

/** The colour whose image is currently on screen, for gallery -> colour sync. */
export function colorForImageIndex(product: any, imageIndex: number): ResolvedColor | null {
  const colors = resolveProductColors(product)
  if (colors.length === 0) return null
  return colors.find((c) => c.imageIndex === imageIndex) ?? null
}

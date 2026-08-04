/**
 * Normalises stored cart lines and merges duplicates.
 *
 * Carts written before colours were normalised hold `selectedColor` as either a
 * name ("White") or a ProductColor object ({ name: "White", value: "#ffffff" }),
 * depending on which surface added the item. Because every lookup compared with
 * `===`, object colours never matched, so removals silently failed and repeat
 * adds appended a duplicate line instead of merging.
 *
 * This rewrites every cart line to the colour name and folds duplicates
 * together, summing their quantities.
 *
 *   node scripts/normalize-cart-colors.js           # dry run, prints changes
 *   node scripts/normalize-cart-colors.js --apply   # writes
 */
const { MongoClient } = require('mongodb')
require('@next/env').loadEnvConfig(process.cwd())

const APPLY = process.argv.includes('--apply')

const normalizeColor = (value) => {
  if (value === null || value === undefined) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'object' && typeof value.name === 'string') return value.name.trim()
  return String(value).trim()
}
const normalizeSize = (value) => (typeof value === 'string' ? value.trim() : String(value ?? '').trim())
const lineKey = (productId, size, color) =>
  [String(productId ?? '').trim(), normalizeSize(size).toLowerCase(), normalizeColor(color).toLowerCase()].join('|')

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')

  const client = new MongoClient(uri)
  await client.connect()
  const users = client.db('hex').collection('users')

  const withCarts = await users
    .find({ 'cartItems.0': { $exists: true } }, { projection: { email: 1, cartItems: 1 } })
    .toArray()

  let changedUsers = 0
  let linesBefore = 0
  let linesAfter = 0

  for (const user of withCarts) {
    const original = user.cartItems || []
    linesBefore += original.length

    const byLine = new Map()
    for (const item of original) {
      const size = normalizeSize(item.selectedSize)
      const color = normalizeColor(item.selectedColor)
      const key = lineKey(item.productId, size, color)
      const quantity = Number(item.quantity) || 0
      if (quantity <= 0) continue

      const existing = byLine.get(key)
      if (existing) {
        existing.quantity = Math.min(existing.quantity + quantity, 100)
      } else {
        byLine.set(key, { ...item, selectedSize: size, selectedColor: color, quantity })
      }
    }

    const merged = Array.from(byLine.values())
    linesAfter += merged.length

    const unchanged =
      merged.length === original.length &&
      merged.every((item, i) =>
        item.selectedColor === original[i].selectedColor &&
        item.selectedSize === original[i].selectedSize &&
        item.quantity === original[i].quantity
      )
    if (unchanged) continue

    changedUsers++
    const masked = String(user.email || '').replace(/(.{3}).*(@.*)/, '$1***$2')
    console.log(`  ${masked}: ${original.length} line(s) -> ${merged.length}`)
    for (const item of merged) {
      console.log(`      ${item.name || item.productId} | ${item.selectedSize} | ${item.selectedColor} x${item.quantity}`)
    }

    if (APPLY) {
      await users.updateOne({ _id: user._id }, { $set: { cartItems: merged, updatedAt: new Date() } })
    }
  }

  console.log(
    `\n${APPLY ? 'Applied' : 'Dry run'}: ${changedUsers} of ${withCarts.length} carts need changes ` +
      `(${linesBefore} lines -> ${linesAfter}).`
  )
  if (!APPLY && changedUsers > 0) console.log('Re-run with --apply to write.')

  await client.close()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

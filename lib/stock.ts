import { ObjectId } from 'mongodb'
import { getProductsCollection } from '@/lib/mongodb'
import type { OrderItem } from '@/types/order'

/**
 * Inventory movements.
 *
 * Reservation is a guarded `$inc`: the filter requires the product to still
 * hold enough stock, so two concurrent buyers cannot both pass. A plain
 * read-then-write would let them, which is exactly how overselling happens.
 *
 * There is no multi-document transaction here on purpose — the reservation
 * loop compensates by releasing whatever it already took if a later item fails,
 * which keeps the code working on any Mongo topology.
 */

export interface StockReservationFailure {
  productName: string
  requested: number
}

export interface StockReservationResult {
  ok: boolean
  failure?: StockReservationFailure
}

type Line = Pick<OrderItem, 'id' | 'name' | 'quantity'>

export async function reserveStock(items: Line[]): Promise<StockReservationResult> {
  const products = await getProductsCollection()
  const taken: Line[] = []

  for (const item of items) {
    const quantity = Number(item.quantity)
    if (!Number.isInteger(quantity) || quantity < 1 || !ObjectId.isValid(String(item.id))) {
      await releaseStock(taken)
      return { ok: false, failure: { productName: item.name, requested: Number(item.quantity) } }
    }

    const result = await products.updateOne(
      { _id: new ObjectId(String(item.id)), stock: { $gte: quantity } },
      { $inc: { stock: -quantity } }
    )

    if (result.modifiedCount === 0) {
      // Someone else took the last of it between pricing and payment.
      await releaseStock(taken)
      return { ok: false, failure: { productName: item.name, requested: quantity } }
    }

    taken.push({ ...item, quantity })
  }

  return { ok: true }
}

/**
 * Returns stock to the shelf — used to unwind a partial reservation, and when
 * an order is cancelled or a return is refunded.
 */
export async function releaseStock(items: Line[]): Promise<void> {
  if (items.length === 0) return
  const products = await getProductsCollection()

  await Promise.all(
    items
      .filter((item) => ObjectId.isValid(String(item.id)) && Number(item.quantity) > 0)
      .map((item) =>
        products
          .updateOne(
            { _id: new ObjectId(String(item.id)) },
            { $inc: { stock: Number(item.quantity) } }
          )
          .catch((error) => {
            // Never let restock failure mask the caller's outcome; the money
            // path (refund, cancellation) matters more than the count.
            console.error(`Failed to restock product ${item.id}:`, error)
          })
      )
  )
}

/** Parses an admin-supplied stock value. Returns null when absent or invalid. */
export function parseStockInput(value: unknown): number | null {
  if (value === undefined || value === null || value === '') return null
  const stock = Number(value)
  if (!Number.isInteger(stock) || stock < 0 || stock > 1_000_000) return null
  return stock
}

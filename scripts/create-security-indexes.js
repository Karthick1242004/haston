/**
 * Creates the indexes the hardened checkout relies on.
 *
 *   node scripts/create-security-indexes.js
 *
 * Safe to re-run: createIndex is idempotent for an identical definition.
 */
const { MongoClient } = require('mongodb')
require('@next/env').loadEnvConfig(process.cwd())

async function main() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not set')

  const client = new MongoClient(uri)
  await client.connect()
  const db = client.db('hex')

  // One Razorpay payment can back at most one order. Partial so the many
  // historical orders without a payment id do not collide with each other.
  const dupes = await db.collection('orders').aggregate([
    { $match: { 'paymentDetails.razorpay_payment_id': { $type: 'string' } } },
    { $group: { _id: '$paymentDetails.razorpay_payment_id', n: { $sum: 1 }, orders: { $push: '$orderId' } } },
    { $match: { n: { $gt: 1 } } },
  ]).toArray()

  if (dupes.length > 0) {
    console.error('Cannot create the unique payment index — these payment ids already back multiple orders:')
    dupes.forEach(d => console.error(`  ${d._id} -> ${d.orders.join(', ')}`))
    console.error('Resolve these duplicates, then re-run.')
  } else {
    await db.collection('orders').createIndex(
      { 'paymentDetails.razorpay_payment_id': 1 },
      {
        unique: true,
        name: 'uniq_razorpay_payment_id',
        partialFilterExpression: { 'paymentDetails.razorpay_payment_id': { $type: 'string' } },
      }
    )
    console.log('orders: uniq_razorpay_payment_id created')
  }

  // A checkout intent is claimed exactly once.
  await db.collection('checkoutIntents').createIndex(
    { razorpayOrderId: 1 },
    { unique: true, name: 'uniq_checkout_intent_order' }
  )
  console.log('checkoutIntents: uniq_checkout_intent_order created')

  // Unclaimed intents are worthless after an hour; let Mongo reap them.
  await db.collection('checkoutIntents').createIndex(
    { createdAt: 1 },
    { expireAfterSeconds: 3600, name: 'ttl_checkout_intents' }
  )
  console.log('checkoutIntents: ttl_checkout_intents created')

  // Supports the owner-scoped order lookups used across the order routes.
  await db.collection('orders').createIndex({ orderId: 1 }, { name: 'idx_orderId' })
  await db.collection('orders').createIndex({ userEmail: 1, createdAt: -1 }, { name: 'idx_userEmail_createdAt' })
  await db.collection('returns').createIndex({ orderId: 1, status: 1 }, { name: 'idx_return_order_status' })
  console.log('lookup indexes created')

  await client.close()
}

main().catch(err => {
  console.error(err)
  process.exit(1)
})

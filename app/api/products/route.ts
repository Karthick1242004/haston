import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getProductsCollection } from '@/lib/mongodb'
import { stripReviewPii } from '@/lib/reviews'

export const dynamic = 'force-dynamic'

// The catalogue is read on nearly every page (the shop pulls it whole, and the
// wishlist hydrates item-by-item through it) but changes only when an admin
// edits a product — and those routes call revalidatePath('/api/products'), so a
// short shared-cache window costs nothing in freshness. Kept private=false so
// the CDN, not the browser, holds it; stock counts should not go stale in a
// user's own cache.
const CATALOGUE_CACHE = 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'

// This endpoint is public, and product documents embed the full review array —
// including each reviewer's email and account id. Scrub them on the way out.
function toPublicProduct(doc: any) {
  const { _id, reviews, ...rest } = doc
  return {
    ...rest,
    id: _id.toString(),
    reviews: Array.isArray(reviews) ? reviews.map(stripReviewPii) : [],
  }
}

export async function GET(request: NextRequest) {
  try {
    const collection = await getProductsCollection()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '0', 10) || 0, 0), 200)
    const isLookParam = searchParams.get('isLook')
    const mainCategory = searchParams.get('mainCategory')
    const subCategory = searchParams.get('subCategory')

    if (id) {
      if (!ObjectId.isValid(id)) {
        return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
      }
      const doc = await collection.findOne({ _id: new ObjectId(id) })
      if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      return NextResponse.json(toPublicProduct(doc), {
        headers: { 'Cache-Control': CATALOGUE_CACHE },
      })
    }

    const filter: any = {}
    if (isLookParam === 'true') filter.isLook = true
    if (isLookParam === 'false') filter.isLook = { $ne: true }
    
    // Category filtering
    if (mainCategory) {
      filter['productCategory.main'] = mainCategory
    }
    if (subCategory) {
      filter['productCategory.sub'] = subCategory
    }

    const cursor = collection.find(filter).sort({ createdAt: -1 })
    if (limit) cursor.limit(limit)
    const docs = await cursor.toArray()
    const products = docs.map(toPublicProduct)
    return NextResponse.json({ products }, {
      headers: { 'Cache-Control': CATALOGUE_CACHE },
    })
  } catch (err) {
    console.error('Products fetch error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
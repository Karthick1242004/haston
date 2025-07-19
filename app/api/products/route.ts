import { NextRequest, NextResponse } from 'next/server'
import { ObjectId } from 'mongodb'
import { getProductsCollection } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const collection = await getProductsCollection()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    const limit = parseInt(searchParams.get('limit') || '0')

    if (id) {
      const doc = await collection.findOne({ _id: new ObjectId(id) })
      if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
      const { _id, ...rest } = doc as any
      return NextResponse.json({ ...rest, id: _id.toString() })
    }

    const cursor = collection.find({}).sort({ createdAt: -1 })
    if (limit) cursor.limit(limit)
    const docs = await cursor.toArray()
    const products = docs.map((d: any) => ({ id: d._id.toString(), ...d }))
    return NextResponse.json({ products })
  } catch (err) {
    console.error('Products fetch error', err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import clientPromise, { getDatabase } from '@/lib/mongodb'
import cloudinary from '@/lib/cloudinary'
import { isAdminEmail } from '@/lib/isAdmin'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

async function isAdmin(session: any) {
  const adminEmail = process.env.ADMIN_MAILID
  return session?.user?.email && adminEmail && session.user.email === adminEmail
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!await isAdminEmail(session?.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const form = await request.formData()
    const name = form.get('name') as string | null
    const price = form.get('price') as string | null
    const description = form.get('description') as string | null
    const sizes = form.get('sizes') as string | null // comma-separated
    const isLookFlag = form.get('isLook') === 'true'

    if (!name || !price || !description || !sizes) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const sizeArray = sizes.split(',').map(s => s.trim()).filter(Boolean)
    const imageFiles = form.getAll('images') as File[]

    if (imageFiles.length === 0) {
      return NextResponse.json({ error: 'At least one image is required' }, { status: 400 })
    }

    if (imageFiles.length > 5) {
      return NextResponse.json({ error: 'Maximum 5 images allowed' }, { status: 400 })
    }

    // Upload images sequentially (could parallelize)
    const imageUrls: string[] = []
    for (const file of imageFiles) {
      const arrayBuffer = await file.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      const uploadRes = await new Promise<{ secure_url: string }>((resolve, reject) => {
        cloudinary.uploader.upload_stream({ folder: 'products' }, (error, result) => {
          if (error || !result) {
            reject(error)
          } else {
            resolve(result as any)
          }
        }).end(buffer)
      })
      imageUrls.push(uploadRes.secure_url)
    }

    // Store product in MongoDB
    const db = await getDatabase()
    const products = db.collection('products')
    const now = new Date()
    const productDoc:any = {
      name,
      price: parseFloat(price),
      description,
      sizes: sizeArray,
      image: imageUrls[0],
      images: imageUrls,
      colors: ['Default'],
      rating: 0,
      stock: 100,
      createdAt: now,
      updatedAt: now,
    }

    if (isLookFlag) {
      productDoc.isLook = true
      productDoc.lookImages = imageUrls
    }

    const insertRes = await products.insertOne(productDoc)

    return NextResponse.json({ success: true, id: insertRes.insertedId, product: productDoc })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
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
    const deliveryDays = form.get('deliveryDays') as string | null
    const isLookFlag = form.get('isLook') === 'true'
    const mainCategory = form.get('mainCategory') as string | null
    const subCategory = form.get('subCategory') as string | null

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

    // Parse optional form data
    let colors = ['Default']
    let badges = []
    let specifications = null
    let hasDiscount = false
    let discountPercentage = null
    let originalPrice = null

    // Parse colors
    if (form.has('colors')) {
      try {
        const parsedColors = JSON.parse(form.get('colors') as string)
        if (Array.isArray(parsedColors) && parsedColors.length > 0) {
          colors = parsedColors
        }
      } catch (e) {
        console.warn('Failed to parse colors, using default')
      }
    }

    // Parse badges
    if (form.has('badges')) {
      try {
        const parsedBadges = JSON.parse(form.get('badges') as string)
        if (Array.isArray(parsedBadges)) {
          badges = parsedBadges
        }
      } catch (e) {
        console.warn('Failed to parse badges, using empty array')
      }
    }

    // Parse specifications
    if (form.has('specifications')) {
      try {
        const parsedSpecs = JSON.parse(form.get('specifications') as string)
        if (parsedSpecs && typeof parsedSpecs === 'object') {
          specifications = parsedSpecs
        }
      } catch (e) {
        console.warn('Failed to parse specifications, using null')
      }
    }

    // Parse discount data
    if (form.has('hasDiscount') && form.get('hasDiscount') === 'true') {
      hasDiscount = true
      if (form.has('discountPercentage')) {
        discountPercentage = parseFloat(form.get('discountPercentage') as string)
      }
      if (form.has('originalPrice')) {
        originalPrice = parseFloat(form.get('originalPrice') as string)
      }
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
    // Build product category object
    let productCategory = null
    if (mainCategory && subCategory) {
      productCategory = {
        main: mainCategory,
        sub: subCategory
      }
    }

    const productDoc:any = {
      name,
      price: parseFloat(price),
      description,
      sizes: sizeArray,
      deliveryDays: deliveryDays || '2-3 days',
      image: imageUrls[0],
      images: imageUrls,
      colors: colors,
      rating: 0,
      stock: 100,
      category: "Fashion", // Keep legacy field for backward compatibility
      productCategory, // New structured category
      createdAt: now,
      updatedAt: now,
    }

    if (isLookFlag) {
      productDoc.isLook = true
      productDoc.lookImages = imageUrls
    }

    if (hasDiscount) {
      productDoc.hasDiscount = true
      productDoc.discountPercentage = discountPercentage
      productDoc.originalPrice = originalPrice
    }

    if (specifications) {
      productDoc.specifications = specifications
    }

    if (badges.length > 0) {
      productDoc.badges = badges
    }

    const insertRes = await products.insertOne(productDoc)

    return NextResponse.json({ success: true, id: insertRes.insertedId, product: productDoc })
  } catch (error) {
    console.error('Product creation error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
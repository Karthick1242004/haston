import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { getProductsCollection } from '@/lib/mongodb'
import cloudinary from '@/lib/cloudinary'
import { isAdminEmail } from '@/lib/isAdmin'
import { deleteImagesFromCloudinary, getRemovedImages } from '@/lib/cloudinary-utils'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest, { params }: { params: { id: string }}) {
  try {
    const session = await getServerSession(authOptions)
    if (!await isAdminEmail(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const collection = await getProductsCollection()
    
    // First, get the product to retrieve its images for cleanup
    const product = await collection.findOne({ _id: new ObjectId(params.id) })
    if (!product) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    // Delete the product from database
    const res = await collection.deleteOne({ _id: new ObjectId(params.id) })
    if (res.deletedCount === 0) return NextResponse.json({ error: 'Failed to delete product' }, { status: 500 })

    // Clean up images from Cloudinary
    const imagesToDelete: string[] = []
    if (product.images && Array.isArray(product.images)) {
      imagesToDelete.push(...product.images)
    }
    if (product.lookImages && Array.isArray(product.lookImages)) {
      imagesToDelete.push(...product.lookImages)
    }
    
    // Remove duplicates
    const uniqueImages = [...new Set(imagesToDelete)]
    
    if (uniqueImages.length > 0) {
      // Delete images from Cloudinary (async, don't wait for completion)
      deleteImagesFromCloudinary(uniqueImages).catch(error => {
        console.error('Error cleaning up images for deleted product:', error)
      })
    }

    return NextResponse.json({ success: true })
  } catch(err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string }}) {
  try {
    const session = await getServerSession(authOptions)
    if (!await isAdminEmail(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const collection = await getProductsCollection()
    
    // Get existing product to compare images for cleanup
    const existingProduct = await collection.findOne({ _id: new ObjectId(params.id) })
    if (!existingProduct) return NextResponse.json({ error: 'Product not found' }, { status: 404 })

    const form = await request.formData()
    const updateDoc: any = {}
    let isLookFlag = false
    for (const [key,value] of form.entries()) {
      if (key === 'images') continue
      if (key === 'isLook') { isLookFlag = value==='true'; continue }
      updateDoc[key] = key === 'price' ? parseFloat(value as string) : value
    }
    if (form.has('sizes')) {
      updateDoc.sizes = (form.get('sizes') as string).split(',').map(s=>s.trim()).filter(Boolean)
    }
    
    // Handle images and cleanup
    let finalImages: string[] = []
    if (form.has('existingImages')) {
      try {
        finalImages = JSON.parse(form.get('existingImages') as string)
      } catch {}
    }

    const imageFiles = form.getAll('images') as File[]
    if (imageFiles.length) {
      const urls: string[] = []
      for (const f of imageFiles) {
        const buf = Buffer.from(await f.arrayBuffer())
        const uploaded = await new Promise<{ secure_url:string }>((resolve,reject)=>{
          cloudinary.uploader.upload_stream({ folder:'products' }, (e,r)=>{ if(e||!r) reject(e); else resolve(r as any) }).end(buf)
        })
        urls.push(uploaded.secure_url)
      }
      finalImages = [...finalImages, ...urls]
    }
    
    // Identify removed images for cleanup
    const oldImages = existingProduct.images || []
    const removedImages = getRemovedImages(oldImages, finalImages)
    
    if (finalImages.length) {
      updateDoc.image = finalImages[0]
      updateDoc.images = finalImages
    }
    if (isLookFlag!==undefined) updateDoc.isLook = isLookFlag
    if (isLookFlag) updateDoc.lookImages = finalImages
    updateDoc.updatedAt = new Date()
    
    // Update the product
    await collection.updateOne({ _id: new ObjectId(params.id) }, { $set: updateDoc })
    
    // Clean up removed images from Cloudinary (async, don't block response)
    if (removedImages.length > 0) {
      deleteImagesFromCloudinary(removedImages).catch(error => {
        console.error('Error cleaning up removed images:', error)
      })
    }
    
    return NextResponse.json({ success: true })
  } catch(err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
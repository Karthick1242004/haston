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
    let mainCategory = null
    let subCategory = null
    
    for (const [key,value] of form.entries()) {
      if (key === 'images') continue
      if (key === 'isLook') { isLookFlag = value==='true'; continue }
      if (key === 'existingImages') continue
      if (key === 'colors') continue
      if (key === 'badges') continue
      if (key === 'specifications') continue
      if (key === 'hasDiscount') continue
      if (key === 'discountPercentage') continue
      if (key === 'originalPrice') continue
      if (key === 'mainCategory') { mainCategory = value as string; continue }
      if (key === 'subCategory') { subCategory = value as string; continue }
      updateDoc[key] = key === 'price' ? parseFloat(value as string) : value
    }
    if (form.has('sizes')) {
      updateDoc.sizes = (form.get('sizes') as string).split(',').map(s=>s.trim()).filter(Boolean)
    }

    // Parse and update colors
    if (form.has('colors')) {
      try {
        const parsedColors = JSON.parse(form.get('colors') as string)
        if (Array.isArray(parsedColors) && parsedColors.length > 0) {
          updateDoc.colors = parsedColors
        }
      } catch (e) {
        console.warn('Failed to parse colors during update')
      }
    }

    // Parse and update badges
    if (form.has('badges')) {
      try {
        const parsedBadges = JSON.parse(form.get('badges') as string)
        if (Array.isArray(parsedBadges)) {
          updateDoc.badges = parsedBadges
        }
      } catch (e) {
        console.warn('Failed to parse badges during update')
      }
    }

    // Parse and update specifications
    if (form.has('specifications')) {
      try {
        const parsedSpecs = JSON.parse(form.get('specifications') as string)
        if (parsedSpecs && typeof parsedSpecs === 'object') {
          updateDoc.specifications = parsedSpecs
        }
      } catch (e) {
        console.warn('Failed to parse specifications during update')
      }
    }

    // Parse and update discount data
    if (form.has('hasDiscount')) {
      const hasDiscount = form.get('hasDiscount') === 'true'
      updateDoc.hasDiscount = hasDiscount
      
      if (hasDiscount) {
        if (form.has('discountPercentage')) {
          updateDoc.discountPercentage = parseFloat(form.get('discountPercentage') as string)
        }
        if (form.has('originalPrice')) {
          updateDoc.originalPrice = parseFloat(form.get('originalPrice') as string)
        }
      } else {
        // Remove discount fields if discount is disabled
        updateDoc.discountPercentage = null
        updateDoc.originalPrice = null
      }
    }

    // Handle product category update
    if (mainCategory && subCategory && mainCategory !== 'none' && subCategory !== 'none') {
      updateDoc.productCategory = {
        main: mainCategory,
        sub: subCategory
      }
    } else if (mainCategory === 'none' || subCategory === 'none' || mainCategory === '' || subCategory === '') {
      // Remove category if either is 'none' or empty
      updateDoc.productCategory = null
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
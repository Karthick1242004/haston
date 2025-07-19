import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { ObjectId } from 'mongodb'
import { getProductsCollection } from '@/lib/mongodb'
import cloudinary from '@/lib/cloudinary'
import { isAdminEmail } from '@/lib/isAdmin'

export const dynamic = 'force-dynamic'

export async function DELETE(request: NextRequest, { params }: { params: { id: string }}) {
  try {
    const session = await getServerSession(authOptions)
    if (!await isAdminEmail(session?.user?.email)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const collection = await getProductsCollection()
    const res = await collection.deleteOne({ _id: new ObjectId(params.id) })
    if (res.deletedCount === 0) return NextResponse.json({ error: 'Not found' }, { status: 404 })
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
    // handle images if provided
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
    if (finalImages.length) {
      updateDoc.image = finalImages[0]
      updateDoc.images = finalImages
    }
    if (isLookFlag!==undefined) updateDoc.isLook = isLookFlag
    if (isLookFlag) updateDoc.lookImages = finalImages
    updateDoc.updatedAt = new Date()
    const collection = await getProductsCollection()
    await collection.updateOne({ _id: new ObjectId(params.id) }, { $set: updateDoc })
    return NextResponse.json({ success: true })
  } catch(err) {
    console.error(err)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
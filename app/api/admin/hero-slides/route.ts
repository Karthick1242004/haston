import { NextRequest, NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { isAdminEmail } from '@/lib/isAdmin'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { v2 as cloudinary } from 'cloudinary'
import { revalidatePath, revalidateTag } from 'next/cache'

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

// Helper function to extract public ID from Cloudinary URL
function extractPublicId(url: string): string | null {
  const regex = /\/v\d+\/([^/.]+)/
  const match = url.match(regex)
  return match ? match[1] : null
}

// GET - Fetch all hero slides
export async function GET() {
  try {
    const db = await getDatabase()
    
    // Optimized admin query with projection
    const slides = await db.collection('heroSlides')
      .find(
        {},
        {
          projection: {
            _id: 1,
            mainText: 1,
            subText: 1,
            image: 1,
            order: 1,
            isActive: 1,
            createdAt: 1,
            updatedAt: 1
            // Only fetch fields needed for admin interface
          }
        }
      )
      .sort({ order: 1, createdAt: -1 }) // Primary sort by order, secondary by creation date
      .toArray()
    
    return NextResponse.json({ 
      success: true, 
      slides: slides.map((slide: any) => ({
        _id: slide._id.toString(),
        mainText: slide.mainText || '',
        subText: slide.subText || '',
        image: slide.image,
        order: slide.order || 0,
        isActive: slide.isActive ?? true,
        createdAt: slide.createdAt,
        updatedAt: slide.updatedAt
      })),
      // Add metadata for admin
      meta: {
        total: slides.length,
        active: slides.filter((s: any) => s.isActive).length,
        inactive: slides.filter((s: any) => !s.isActive).length,
        timestamp: new Date().toISOString()
      }
    })
  } catch (error) {
    console.error('Error fetching hero slides:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch slides' }, { status: 500 })
  }
}

// POST - Create new hero slide
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !(await isAdminEmail(session.user.email))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const mainText = formData.get('mainText') as string
    const subText = formData.get('subText') as string
    const imageFile = formData.get('image') as File
    const order = parseInt(formData.get('order') as string) || 0
    const isActive = formData.get('isActive') === 'true'

    if (!imageFile) {
      return NextResponse.json({ success: false, error: 'Image is required' }, { status: 400 })
    }

    // Upload image to Cloudinary
    const arrayBuffer = await imageFile.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    const uploadResult = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'hero-slides',
          transformation: [
            { quality: 'auto:best' },
            { format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) reject(error)
          else resolve(result)
        }
      ).end(buffer)
    }) as any

    // Save to database
    const db = await getDatabase()
    const slide = {
      mainText: mainText || '',
      subText: subText || '',
      image: uploadResult.secure_url,
      order,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('heroSlides').insertOne(slide)
    
    // Revalidate the hero slides cache to show new banner immediately
    try {
      revalidatePath('/api/hero-slides')
      revalidatePath('/')
      revalidateTag('hero-slides')
    } catch (revalidateError) {
      console.warn('Cache revalidation failed:', revalidateError)
    }
    
    return NextResponse.json({ 
      success: true, 
      slide: { ...slide, _id: result.insertedId },
      revalidated: true,
      timestamp: new Date().toISOString()
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating hero slide:', error)
    return NextResponse.json({ success: false, error: 'Failed to create slide' }, { status: 500 })
  }
}

// PUT - Update hero slide
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !(await isAdminEmail(session.user.email))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const formData = await request.formData()
    const slideId = formData.get('slideId') as string
    const mainText = formData.get('mainText') as string
    const subText = formData.get('subText') as string
    const imageFile = formData.get('image') as File | null
    const currentImageUrl = formData.get('currentImageUrl') as string
    const order = parseInt(formData.get('order') as string) || 0
    const isActive = formData.get('isActive') === 'true'

    if (!slideId) {
      return NextResponse.json({ success: false, error: 'Slide ID is required' }, { status: 400 })
    }

    const db = await getDatabase()
    let imageUrl = currentImageUrl

    // If new image is uploaded, handle image replacement
    if (imageFile && imageFile.size > 0) {
      // Delete old image from Cloudinary
      if (currentImageUrl) {
        const oldPublicId = extractPublicId(currentImageUrl)
        if (oldPublicId) {
          try {
            await cloudinary.uploader.destroy(`hero-slides/${oldPublicId}`)
          } catch (deleteError) {
            console.warn('Failed to delete old image:', deleteError)
          }
        }
      }

      // Upload new image
      const arrayBuffer = await imageFile.arrayBuffer()
      const buffer = Buffer.from(arrayBuffer)
      
      const uploadResult = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'hero-slides',
            transformation: [
              { quality: 'auto:best' },
              { format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) reject(error)
            else resolve(result)
          }
        ).end(buffer)
      }) as any

      imageUrl = uploadResult.secure_url
    }

    const updateData = {
      mainText: mainText || '',
      subText: subText || '',
      image: imageUrl,
      order,
      isActive,
      updatedAt: new Date()
    }

    await db.collection('heroSlides').updateOne(
      { _id: new (require('mongodb')).ObjectId(slideId) },
      { $set: updateData }
    )
    
    // Revalidate the hero slides cache to show updated banner immediately
    try {
      revalidatePath('/api/hero-slides')
      revalidatePath('/')
      revalidateTag('hero-slides')
    } catch (revalidateError) {
      console.warn('Cache revalidation failed:', revalidateError)
    }
    
    return NextResponse.json({ 
      success: true, 
      slide: { _id: slideId, ...updateData },
      revalidated: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error updating hero slide:', error)
    return NextResponse.json({ success: false, error: 'Failed to update slide' }, { status: 500 })
  }
}

// DELETE - Delete hero slide
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !(await isAdminEmail(session.user.email))) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const slideId = searchParams.get('id')

    if (!slideId) {
      return NextResponse.json({ success: false, error: 'Slide ID required' }, { status: 400 })
    }

    const db = await getDatabase()
    
    // Get slide details before deletion for image cleanup
    const slide = await db.collection('heroSlides').findOne({ 
      _id: new (require('mongodb')).ObjectId(slideId) 
    })

    if (!slide) {
      return NextResponse.json({ success: false, error: 'Slide not found' }, { status: 404 })
    }

    // Delete image from Cloudinary
    if (slide.image) {
      const publicId = extractPublicId(slide.image)
      if (publicId) {
        try {
          await cloudinary.uploader.destroy(`hero-slides/${publicId}`)
        } catch (deleteError) {
          console.warn('Failed to delete image from Cloudinary:', deleteError)
        }
      }
    }

    // Delete slide from database
    await db.collection('heroSlides').deleteOne({ 
      _id: new (require('mongodb')).ObjectId(slideId) 
    })
    
    // Revalidate the hero slides cache to reflect deletion immediately
    try {
      revalidatePath('/api/hero-slides')
      revalidatePath('/')
      revalidateTag('hero-slides')
    } catch (revalidateError) {
      console.warn('Cache revalidation failed:', revalidateError)
    }
    
    return NextResponse.json({ 
      success: true,
      revalidated: true,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    console.error('Error deleting hero slide:', error)
    return NextResponse.json({ success: false, error: 'Failed to delete slide' }, { status: 500 })
  }
} 
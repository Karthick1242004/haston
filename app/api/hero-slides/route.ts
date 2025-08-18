import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

// Force dynamic rendering and no caching
export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function GET() {
  try {
    const db = await getDatabase()
    const slides = await db.collection('heroSlides')
      .find({ isActive: true })
      .sort({ order: 1 })
      .toArray()
    
    // Create response with cache control headers
    const response = NextResponse.json({ 
      success: true, 
      slides: slides.map((slide: any) => ({
        id: slide._id.toString(),
        mainText: slide.mainText,
        subText: slide.subText,
        image: slide.image,
        order: slide.order
      }))
    })

    // Add headers to prevent caching
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    response.headers.set('X-Response-Time', new Date().toISOString())

    return response
  } catch (error) {
    console.error('Error fetching hero slides:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch slides' }, { status: 500 })
  }
} 
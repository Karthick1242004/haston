import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

// Enable ISR (Incremental Static Regeneration) for better performance
export const revalidate = 300 // Revalidate every 5 minutes

export async function GET() {
  try {
    const db = await getDatabase()
    
    // Optimized query with projection to fetch only needed fields
    const slides = await db.collection('heroSlides')
      .find(
        { isActive: true },
        {
          projection: {
            _id: 1,
            mainText: 1,
            subText: 1,
            image: 1,
            order: 1
            // Exclude unnecessary fields like createdAt, updatedAt, etc.
          }
        }
      )
      .sort({ order: 1 })
      .toArray()
    
    // Create response with optimized data structure
    const response = NextResponse.json({ 
      success: true, 
      slides: slides.map((slide: any) => ({
        id: slide._id.toString(),
        mainText: slide.mainText || '',
        subText: slide.subText || '',
        image: slide.image,
        order: slide.order || 0
      })),
      // Add metadata for debugging (only in development)
      ...(process.env.NODE_ENV === 'development' && {
        meta: {
          count: slides.length,
          timestamp: new Date().toISOString(),
          cached: false // Will be true when served from cache
        }
      })
    })

    // Add proper caching headers
    response.headers.set('Cache-Control', 'public, s-maxage=300, stale-while-revalidate=600')
    response.headers.set('X-Response-Time', new Date().toISOString())

    return response
  } catch (error) {
    console.error('Error fetching hero slides:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch slides' }, { status: 500 })
  }
} 
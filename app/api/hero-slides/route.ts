import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'
import { unstable_cache } from 'next/cache'

// Enable ISR (Incremental Static Regeneration) for better performance
export const revalidate = 60 // Revalidate every 1 minute (reduced from 5 minutes)

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
            order: 1,
            updatedAt: 1
            // Exclude unnecessary fields like createdAt, etc.
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
      // Add metadata with cache info
      meta: {
        count: slides.length,
        timestamp: new Date().toISOString(),
        // Include a hash based on last update for cache busting
        lastUpdate: slides.length > 0 
          ? Math.max(...slides.map((s: any) => s.updatedAt?.getTime() || 0))
          : Date.now()
      }
    }, {
      headers: {
        // Reduced cache time to 60 seconds, allow stale content for 120 seconds
        'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=120',
        'X-Response-Time': new Date().toISOString(),
        // Add cache tag for targeted revalidation
        'Cache-Tag': 'hero-slides'
      }
    })

    return response
  } catch (error) {
    console.error('Error fetching hero slides:', error)
    return NextResponse.json({ success: false, error: 'Failed to fetch slides' }, { status: 500 })
  }
} 
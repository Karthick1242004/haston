import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

// Public marketing strip: rendered on every page but changes only when an admin
// edits it, and those routes call revalidatePath('/api/banner-messages').
export const revalidate = 60

const BANNER_CACHE = 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'

// GET - Fetch active banner messages for public display
export async function GET() {
  try {
    const db = await getDatabase()
    
    // Debug: Log the query we're about to execute
    console.log('🔍 Fetching banner messages with isActive: true')
    
    const bannerMessages = await db
      .collection('bannerMessages')
      .find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .toArray()

    // Debug: Log what we found
    console.log('📊 Raw banner messages from DB:', bannerMessages)
    console.log('📊 Count of active messages:', bannerMessages.length)

    // Transform for frontend compatibility
    const transformedMessages = bannerMessages.map(msg => ({
      id: msg._id.toString(),
      text: msg.text,
      icon: msg.icon || '',
      order: msg.order || 0
    }))

    // Debug: Log transformed messages
    console.log('🔄 Transformed messages:', transformedMessages)

    // Create response with cache control headers
    const response = NextResponse.json({
      success: true,
      bannerMessages: transformedMessages
    })

    response.headers.set('Cache-Control', BANNER_CACHE)

    return response
  } catch (error) {
    console.error('❌ Error fetching banner messages:', error)
    
    // Return fallback messages in case of error
    const fallbackMessages = [
      { id: '1', text: 'FREE SHIPPING ON ORDERS OVER ₹999', icon: '🚚' },
      { id: '2', text: 'SUMMER SALE - UP TO 50% OFF', icon: '🔥' },
      { id: '3', text: 'NEW ARRIVALS EVERY WEEK', icon: '✨' },
    ]
    
    const response = NextResponse.json({
      success: true,
      bannerMessages: fallbackMessages,
      error: 'Using fallback messages due to database error'
    })

    // The fallback is an error state; never let it stick in a shared cache.
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    return response
  }
}

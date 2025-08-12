import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

// GET - Fetch active banner messages for public display
export async function GET() {
  try {
    const db = await getDatabase()
    
    const bannerMessages = await db
      .collection('bannerMessages')
      .find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .toArray()

    // Transform for frontend compatibility
    const transformedMessages = bannerMessages.map(msg => ({
      id: msg._id.toString(),
      text: msg.text,
      icon: msg.icon || '',
      order: msg.order || 0
    }))

    return NextResponse.json({
      success: true,
      bannerMessages: transformedMessages
    })
  } catch (error) {
    console.error('Error fetching banner messages:', error)
    
    // Return fallback messages in case of error
    const fallbackMessages = [
      { id: '1', text: 'FREE SHIPPING ON ORDERS OVER ₹999', icon: '🚚' },
      { id: '2', text: 'SUMMER SALE - UP TO 50% OFF', icon: '🔥' },
      { id: '3', text: 'NEW ARRIVALS EVERY WEEK', icon: '✨' },
    ]
    
    return NextResponse.json({
      success: true,
      bannerMessages: fallbackMessages
    })
  }
}

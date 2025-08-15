import { NextResponse } from 'next/server'
import { getDatabase } from '@/lib/mongodb'

export const dynamic = 'force-dynamic'

// Test endpoint to debug banner messages
export async function GET() {
  try {
    const db = await getDatabase()
    
    // Get ALL banner messages (not just active ones)
    const allMessages = await db
      .collection('bannerMessages')
      .find({})
      .sort({ order: 1, createdAt: 1 })
      .toArray()

    // Get only active messages
    const activeMessages = await db
      .collection('bannerMessages')
      .find({ isActive: true })
      .sort({ order: 1, createdAt: 1 })
      .toArray()

    return NextResponse.json({
      success: true,
      debug: {
        totalMessages: allMessages.length,
        activeMessages: activeMessages.length,
        timestamp: new Date().toISOString()
      },
      allMessages: allMessages.map(msg => ({
        _id: msg._id.toString(),
        text: msg.text,
        icon: msg.icon,
        isActive: msg.isActive,
        order: msg.order,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt
      })),
      activeMessages: activeMessages.map(msg => ({
        _id: msg._id.toString(),
        text: msg.text,
        icon: msg.icon,
        isActive: msg.isActive,
        order: msg.order,
        createdAt: msg.createdAt,
        updatedAt: msg.updatedAt
      }))
    })
  } catch (error) {
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 })
  }
}

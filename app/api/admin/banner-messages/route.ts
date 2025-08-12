import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import type { BannerMessage, CreateBannerMessageRequest } from '@/types/banner'

// GET - Fetch all banner messages
export async function GET() {
  try {
    const db = await getDatabase()
    
    const bannerMessages = await db
      .collection('bannerMessages')
      .find({})
      .sort({ order: 1, createdAt: 1 })
      .toArray()

    return NextResponse.json({
      success: true,
      bannerMessages: bannerMessages || []
    })
  } catch (error) {
    console.error('Error fetching banner messages:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    })
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch banner messages',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

// POST - Create new banner message
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const db = await getDatabase()
    const adminUser = await db.collection('admins').findOne({ 
      email: session.user.email 
    })
    
    if (!adminUser) {
      return NextResponse.json({ error: 'Forbidden - Admin access required' }, { status: 403 })
    }

    const body: CreateBannerMessageRequest = await request.json()
    
    // Validation
    if (!body.text || body.text.trim() === '') {
      return NextResponse.json(
        { success: false, error: 'Banner text is required' },
        { status: 400 }
      )
    }

    // Get the highest order number to append new message at the end
    const lastMessage = await db
      .collection('bannerMessages')
      .findOne({}, { sort: { order: -1 } })
    
    const nextOrder = lastMessage ? (lastMessage.order || 0) + 1 : 1

    const bannerMessage: Omit<BannerMessage, '_id'> = {
      text: body.text.trim(),
      icon: body.icon || '',
      isActive: body.isActive !== false, // Default to true
      order: body.order || nextOrder,
      createdAt: new Date(),
      updatedAt: new Date()
    }

    const result = await db.collection('bannerMessages').insertOne(bannerMessage)

    return NextResponse.json({
      success: true,
      bannerMessage: {
        ...bannerMessage,
        _id: result.insertedId
      }
    })
  } catch (error) {
    console.error('Error creating banner message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create banner message' },
      { status: 500 }
    )
  }
}

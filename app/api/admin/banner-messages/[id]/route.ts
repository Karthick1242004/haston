import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getDatabase } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import type { UpdateBannerMessageRequest } from '@/types/banner'

// PUT - Update banner message
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const body: UpdateBannerMessageRequest = await request.json()
    
    // Validate ObjectId
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid banner message ID' },
        { status: 400 }
      )
    }

    // Build update object
    const updateDoc: any = {
      updatedAt: new Date()
    }

    if (body.text !== undefined) {
      if (body.text.trim() === '') {
        return NextResponse.json(
          { success: false, error: 'Banner text cannot be empty' },
          { status: 400 }
        )
      }
      updateDoc.text = body.text.trim()
    }

    if (body.icon !== undefined) {
      updateDoc.icon = body.icon
    }

    if (body.isActive !== undefined) {
      updateDoc.isActive = body.isActive
    }

    if (body.order !== undefined) {
      updateDoc.order = body.order
    }

    const result = await db.collection('bannerMessages').updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateDoc }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Banner message not found' },
        { status: 404 }
      )
    }

    // Fetch updated banner message
    const updatedMessage = await db.collection('bannerMessages').findOne({
      _id: new ObjectId(params.id)
    })

    return NextResponse.json({
      success: true,
      bannerMessage: updatedMessage
    })
  } catch (error) {
    console.error('Error updating banner message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to update banner message' },
      { status: 500 }
    )
  }
}

// DELETE - Delete banner message
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // Validate ObjectId
    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid banner message ID' },
        { status: 400 }
      )
    }

    const result = await db.collection('bannerMessages').deleteOne({
      _id: new ObjectId(params.id)
    })

    if (result.deletedCount === 0) {
      return NextResponse.json(
        { success: false, error: 'Banner message not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Banner message deleted successfully'
    })
  } catch (error) {
    console.error('Error deleting banner message:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete banner message' },
      { status: 500 }
    )
  }
}

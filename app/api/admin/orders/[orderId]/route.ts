import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getOrdersCollection } from '@/lib/mongodb'
import { isAdminEmail } from '@/lib/isAdmin'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!await isAdminEmail(session?.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = params
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const collection = await getOrdersCollection()
    
    // Find order by orderId (admin can see any order)
    const order = await collection.findOne({ orderId: orderId })

    if (!order) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      order: {
        ...order,
        _id: order._id.toString()
      }
    })

  } catch (error) {
    console.error('Error fetching order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!await isAdminEmail(session?.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = params
    const body = await request.json()
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const { status, estimatedDelivery, notes, timeline } = body
    
    // Build update object
    const updateData: any = {
      updatedAt: new Date()
    }

    if (status) {
      const validStatuses = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled']
      if (!validStatuses.includes(status)) {
        return NextResponse.json({ error: 'Invalid status' }, { status: 400 })
      }
      updateData.status = status
    }

    if (estimatedDelivery) {
      // Validate date
      const deliveryDate = new Date(estimatedDelivery)
      if (isNaN(deliveryDate.getTime())) {
        return NextResponse.json({ error: 'Invalid delivery date' }, { status: 400 })
      }
      updateData.estimatedDelivery = deliveryDate
    }

    if (notes !== undefined) {
      updateData.adminNotes = notes
    }

    if (timeline) {
      // Validate timeline object
      if (timeline.processingDays || timeline.shippedDays || timeline.deliveredDays) {
        updateData.timeline = {
          processingDays: timeline.processingDays || '1-2 business days',
          shippedDays: timeline.shippedDays || '3-5 business days',
          deliveredDays: timeline.deliveredDays || '5-7 business days'
        }
      }
    }

    const collection = await getOrdersCollection()
    
    // Update order (admin can update any order)
    const result = await collection.updateOne(
      { orderId: orderId },
      { $set: updateData }
    )

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    // Get updated order
    const updatedOrder = await collection.findOne({ orderId: orderId })

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully',
      order: {
        ...updatedOrder,
        _id: updatedOrder?._id.toString()
      }
    })

  } catch (error) {
    console.error('Error updating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!await isAdminEmail(session?.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = params
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const collection = await getOrdersCollection()
    
    // Delete order (admin can delete any order)
    const result = await collection.deleteOne({ orderId: orderId })

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 })
    }

    return NextResponse.json({
      success: true,
      message: 'Order deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
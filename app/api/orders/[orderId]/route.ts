import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getOrdersCollection } from '@/lib/mongodb'

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { orderId } = params
    
    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 })
    }

    const collection = await getOrdersCollection()
    
    // Find order by orderId and ensure it belongs to the current user
    const order = await collection.findOne({ 
      orderId: orderId,
      userId: session.user.email 
    })

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

// Customers deliberately have no way to set their own order status. Letting them
// do so allowed a refund loop: cancel (refund), flip back to `delivered`, then
// file a return for a second payout. Cancellation goes through
// /api/orders/[orderId]/cancel and returns through .../return, both of which
// enforce their own guards; every other transition is admin-only. 
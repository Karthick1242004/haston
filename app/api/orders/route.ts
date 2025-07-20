import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getOrdersCollection } from '@/lib/mongodb'
import { Order, OrderItem, PaymentDetails, ShippingAddress, OrderSummary } from '@/types/order'

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      items,
      shippingAddress,
      paymentDetails,
      orderSummary,
      discountCode
    }: {
      items: OrderItem[]
      shippingAddress: ShippingAddress
      paymentDetails: PaymentDetails
      orderSummary: OrderSummary
      discountCode?: string
    } = body

    // Generate unique order ID
    const orderId = `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`

    // Calculate estimated delivery (7-10 business days from now)
    const estimatedDelivery = new Date()
    estimatedDelivery.setDate(estimatedDelivery.getDate() + Math.floor(Math.random() * 4) + 7)

    // Create order object
    const order: Order = {
      orderId,
      userId: session.user.email,
      userEmail: session.user.email,
      items: items.map(item => ({
        ...item,
        subtotal: item.price * item.quantity
      })),
      shippingAddress,
      paymentDetails: {
        ...paymentDetails,
        created_at: new Date()
      },
      orderSummary: {
        ...orderSummary,
        discountCode
      },
      status: 'confirmed',
      createdAt: new Date(),
      updatedAt: new Date(),
      estimatedDelivery
    }

    // Save to database
    const collection = await getOrdersCollection()
    const result = await collection.insertOne(order)

    if (!result.insertedId) {
      return NextResponse.json({ error: 'Failed to create order' }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      orderId: order.orderId,
      order: {
        ...order,
        _id: result.insertedId
      }
    })

  } catch (error) {
    console.error('Error creating order:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const skip = (page - 1) * limit

    const collection = await getOrdersCollection()
    
    // Get orders for the user
    const orders = await collection
      .find({ userId: session.user.email })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count for pagination
    const totalOrders = await collection.countDocuments({ userId: session.user.email })

    return NextResponse.json({
      success: true,
      orders: orders.map(order => ({
        ...order,
        _id: order._id.toString()
      })),
      pagination: {
        page,
        limit,
        total: totalOrders,
        totalPages: Math.ceil(totalOrders / limit),
        hasNext: page * limit < totalOrders,
        hasPrev: page > 1
      }
    })

  } catch (error) {
    console.error('Error fetching orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
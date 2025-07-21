import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getOrdersCollection } from '@/lib/mongodb'
import { isAdminEmail } from '@/lib/isAdmin'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    const session = await getServerSession(authOptions)
    if (!await isAdminEmail(session?.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const collection = await getOrdersCollection()
    
    // Get all orders to calculate stats
    const allOrders = await collection.find({}).toArray()
    
    // Calculate statistics
    const stats = {
      total: allOrders.length,
      totalRevenue: allOrders.reduce((sum, order) => sum + (order.orderSummary?.total || 0), 0),
      pending: allOrders.filter(order => order.status === 'pending').length,
      delivered: allOrders.filter(order => order.status === 'delivered').length,
      confirmed: allOrders.filter(order => order.status === 'confirmed').length,
      processing: allOrders.filter(order => order.status === 'processing').length,
      shipped: allOrders.filter(order => order.status === 'shipped').length,
      cancelled: allOrders.filter(order => order.status === 'cancelled').length
    }

    return NextResponse.json({ 
      success: true, 
      stats 
    })

  } catch (error) {
    console.error('Error fetching order stats:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch order statistics' 
    }, { status: 500 })
  }
} 
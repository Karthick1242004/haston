import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getOrdersCollection } from '@/lib/mongodb'
import { isAdminEmail } from '@/lib/isAdmin'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!await isAdminEmail(session?.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const status = searchParams.get('status')
    const search = searchParams.get('search')
    const sortBy = searchParams.get('sortBy') || 'createdAt'
    const sortOrder = searchParams.get('sortOrder') || 'desc'
    
    const skip = (page - 1) * limit

    const collection = await getOrdersCollection()
    
    // Build filter query
    const filterQuery: any = {}
    
    if (status && status !== 'all') {
      filterQuery.status = status
    }
    
    if (search) {
      filterQuery.$or = [
        { orderId: { $regex: search, $options: 'i' } },
        { userEmail: { $regex: search, $options: 'i' } },
        { 'shippingAddress.firstName': { $regex: search, $options: 'i' } },
        { 'shippingAddress.lastName': { $regex: search, $options: 'i' } },
        { 'items.name': { $regex: search, $options: 'i' } }
      ]
    }

    // Build sort query
    const sortQuery: any = {}
    sortQuery[sortBy] = sortOrder === 'desc' ? -1 : 1

    // Get orders with filter and sort
    const orders = await collection
      .find(filterQuery)
      .sort(sortQuery)
      .skip(skip)
      .limit(limit)
      .toArray()

    // Get total count for pagination
    const totalOrders = await collection.countDocuments(filterQuery)

    // Get statistics
    const stats = await collection.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$orderSummary.total" }
        }
      }
    ]).toArray()

    const statusStats = {
      total: totalOrders,
      confirmed: 0,
      processing: 0,
      shipped: 0,
      delivered: 0,
      cancelled: 0,
      pending: 0,
      totalRevenue: 0
    }

    stats.forEach(stat => {
      statusStats[stat._id as keyof typeof statusStats] = stat.count
      statusStats.totalRevenue += stat.totalAmount || 0
    })

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
      },
      stats: statusStats
    })

  } catch (error) {
    console.error('Error fetching admin orders:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
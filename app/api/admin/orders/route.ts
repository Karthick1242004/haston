import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { getOrdersCollection } from '@/lib/mongodb'
import { isAdminEmail } from '@/lib/isAdmin'
import { escapeRegex } from '@/lib/pricing'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!await isAdminEmail(session?.user?.email)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get('page') || '1', 10) || 1, 1)
    const limit = Math.min(Math.max(parseInt(searchParams.get('limit') || '10', 10) || 10, 1), 100)
    const status = searchParams.get('status')
    const search = searchParams.get('search')?.slice(0, 100)
    const sortOrder = searchParams.get('sortOrder') || 'desc'

    // Only sortable fields the admin UI offers; an arbitrary key would force an
    // unindexed in-memory sort across the whole collection.
    const SORTABLE = ['createdAt', 'updatedAt', 'orderSummary.total', 'status', 'orderId']
    const requestedSort = searchParams.get('sortBy') || 'createdAt'
    const sortBy = SORTABLE.includes(requestedSort) ? requestedSort : 'createdAt'

    const skip = (page - 1) * limit

    const collection = await getOrdersCollection()

    // Build filter query
    const filterQuery: any = {}

    if (status && status !== 'all') {
      filterQuery.status = status
    }

    if (search) {
      // Escaped: an unescaped pattern such as "(a+)+$" backtracks across five
      // unindexed fields on every order document.
      const safeSearch = escapeRegex(search)
      filterQuery.$or = [
        { orderId: { $regex: safeSearch, $options: 'i' } },
        { userEmail: { $regex: safeSearch, $options: 'i' } },
        { 'shippingAddress.firstName': { $regex: safeSearch, $options: 'i' } },
        { 'shippingAddress.lastName': { $regex: safeSearch, $options: 'i' } },
        { 'items.name': { $regex: safeSearch, $options: 'i' } }
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
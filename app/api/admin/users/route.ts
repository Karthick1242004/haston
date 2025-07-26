import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { getDatabase, getUsersCollection } from '@/lib/mongodb'
import { isAdminEmail } from '@/lib/isAdmin'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session || !await isAdminEmail(session.user?.email || '')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const db = await getDatabase()
    
    // Get search and filter parameters
    const { searchParams } = new URL(request.url)
    const search = searchParams.get('search') || ''
    const orderFilter = searchParams.get('orderFilter') || 'all'
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    
    // Build filter query for basic find operation first
    const filterQuery: any = {}
    
    // Add search filter if provided
    if (search) {
      filterQuery.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    
    // Get total users count
    const totalUsers = await db.collection('users').countDocuments(filterQuery)
    
    // Calculate pagination
    const skip = (page - 1) * limit
    
    // First get basic users
    let users = await db.collection('users')
      .find(filterQuery)
      .sort({ _id: -1 })
      .skip(skip)
      .limit(limit)
      .project({
        name: 1,
        email: 1,
        image: 1,
        firstName: 1,
        lastName: 1,
        phone: 1,
        createdAt: '$_id'
      })
      .toArray()
    
    // Now add order information for each user
    const usersWithOrders = await Promise.all(
      users.map(async (user) => {
        const userOrders = await db.collection('orders')
          .find({ userEmail: user.email })
          .toArray()
        
        const orderCount = userOrders.length
        const totalSpent = userOrders.reduce((sum, order) => sum + (order.orderSummary?.total || 0), 0)
        const lastOrder = userOrders.length > 0 
          ? Math.max(...userOrders.map(o => new Date(o.createdAt).getTime()))
          : null
        
        return {
          ...user,
          orderCount,
          totalSpent,
          lastOrder: lastOrder ? new Date(lastOrder) : null
        }
      })
    )
    
    // Apply order-based filters after calculating order stats
    let filteredUsers = usersWithOrders
    if (orderFilter !== 'all') {
      switch (orderFilter) {
        case 'hasOrders':
          filteredUsers = usersWithOrders.filter(user => user.orderCount > 0)
          break
        case 'noOrders':
          filteredUsers = usersWithOrders.filter(user => user.orderCount === 0)
          break
        case 'highValue':
          filteredUsers = usersWithOrders.filter(user => user.totalSpent >= 1000)
          break
      }
    }
    
    return NextResponse.json({
      success: true,
      users: filteredUsers,
      pagination: {
        page,
        limit,
        total: totalUsers,
        pages: Math.ceil(totalUsers / limit)
      }
    })
    
  } catch (error) {
    console.error('Error fetching users:', error)
    return NextResponse.json({ error: 'Failed to fetch users' }, { status: 500 })
  }
} 
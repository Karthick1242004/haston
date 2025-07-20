import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { findUserById, updateUser } from '@/lib/mongodb'
import { authOptions } from '@/lib/auth'

// Force dynamic rendering
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await findUserById(session.user.id)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ wishlist: user.wishlist || [] })
  } catch (error) {
    console.error('Wishlist fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, action } = body

    if (!productId || !action) {
      return NextResponse.json({ error: 'Product ID and action are required' }, { status: 400 })
    }

    const user = await findUserById(session.user.id)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let updatedWishlist = user.wishlist || []

    if (action === 'add') {
      // Add to wishlist if not already present
      if (!updatedWishlist.includes(productId.toString())) {
        updatedWishlist.push(productId.toString())
      }
    } else if (action === 'remove') {
      // Remove from wishlist
      updatedWishlist = updatedWishlist.filter(id => id !== productId.toString())
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "add" or "remove"' }, { status: 400 })
    }

    const success = await updateUser(session.user.id, { wishlist: updatedWishlist })
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update wishlist' }, { status: 400 })
    }

    return NextResponse.json({ 
      message: `Product ${action === 'add' ? 'added to' : 'removed from'} wishlist successfully`,
      wishlist: updatedWishlist
    })
  } catch (error) {
    console.error('Wishlist update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
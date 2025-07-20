import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { findUserById, updateUser } from '@/lib/mongodb'
import { CartItem } from '@/lib/mongodb'

// Force this route to be dynamic
export const dynamic = 'force-dynamic'

// GET - Fetch user's cart items
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

    return NextResponse.json({ 
      cartItems: user.cartItems || [],
      cartCount: (user.cartItems || []).reduce((count, item) => count + item.quantity, 0)
    })
  } catch (error) {
    console.error('Cart fetch error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST - Add or update cart item
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { productId, name, price, image, selectedSize, selectedColor, quantity = 1, action = 'add' } = body

    if (!productId || !name || !price || !selectedSize || !selectedColor) {
      return NextResponse.json({ 
        error: 'Product ID, name, price, selected size, and selected color are required' 
      }, { status: 400 })
    }

    const user = await findUserById(session.user.id)
    
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let updatedCartItems = user.cartItems || []

    // Find existing item with same product, size, and color
    const existingItemIndex = updatedCartItems.findIndex(
      item => 
        item.productId === productId.toString() && 
        item.selectedSize === selectedSize && 
        item.selectedColor === selectedColor
    )

    if (action === 'add') {
      if (existingItemIndex > -1) {
        // Update existing item quantity
        updatedCartItems[existingItemIndex].quantity += quantity
      } else {
        // Add new item
        const newItem: CartItem = {
          productId: productId.toString(),
          name,
          price,
          image,
          selectedSize,
          selectedColor,
          quantity,
          addedAt: new Date()
        }
        updatedCartItems.push(newItem)
      }
    } else if (action === 'update') {
      if (existingItemIndex > -1) {
        if (quantity <= 0) {
          // Remove item if quantity is 0 or negative
          updatedCartItems.splice(existingItemIndex, 1)
        } else {
          // Update quantity
          updatedCartItems[existingItemIndex].quantity = quantity
        }
      }
    } else if (action === 'remove') {
      if (existingItemIndex > -1) {
        updatedCartItems.splice(existingItemIndex, 1)
      }
    } else {
      return NextResponse.json({ error: 'Invalid action. Use "add", "update", or "remove"' }, { status: 400 })
    }

    const success = await updateUser(session.user.id, { cartItems: updatedCartItems })
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update cart' }, { status: 400 })
    }

    const cartCount = updatedCartItems.reduce((count, item) => count + item.quantity, 0)

    return NextResponse.json({ 
      message: `Cart ${action} successful`,
      cartItems: updatedCartItems,
      cartCount
    })
  } catch (error) {
    console.error('Cart update error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// DELETE - Clear entire cart
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const success = await updateUser(session.user.id, { cartItems: [] })
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to clear cart' }, { status: 400 })
    }

    return NextResponse.json({ 
      message: 'Cart cleared successfully',
      cartItems: [],
      cartCount: 0
    })
  } catch (error) {
    console.error('Cart clear error:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
} 
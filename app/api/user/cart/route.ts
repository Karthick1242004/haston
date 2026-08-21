import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { findUserById, updateUser, getProductsCollection } from '@/lib/mongodb'
import { CartItem } from '@/lib/mongodb'
import { ObjectId } from 'mongodb'
import { cartLineKey, normalizeColor, normalizeSize } from '@/lib/cart'
import { enforceRateLimit, RATE_LIMITS } from '@/lib/rate-limit'

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

    // Never let a browser or shared cache hold on to a cart. A replayed
    // response resurrected items the shopper had just deleted.
    return NextResponse.json({
      cartItems: user.cartItems || [],
      cartCount: (user.cartItems || []).reduce((count: number, item: CartItem) => count + item.quantity, 0)
    }, {
      headers: {
        'Cache-Control': 'private, no-store, max-age=0, must-revalidate',
        'Vary': 'Cookie',
      },
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

    const limited = await enforceRateLimit(request, RATE_LIMITS.cartWrite, session.user.id)
    if (limited) return limited

    const body = await request.json()
    const { productId, name, image, selectedSize, selectedColor, quantity = 1, action = 'add' } = body

    if (!['add', 'update', 'remove'].includes(action)) {
      return NextResponse.json({ error: 'Invalid action. Use "add", "update", or "remove"' }, { status: 400 })
    }

    if (!productId || !selectedSize || !selectedColor) {
      return NextResponse.json({
        error: 'Product ID, selected size, and selected color are required'
      }, { status: 400 })
    }

    if (!ObjectId.isValid(String(productId))) {
      return NextResponse.json({ error: 'Invalid product ID' }, { status: 400 })
    }

    const parsedQuantity = Number(quantity)
    if (!Number.isInteger(parsedQuantity) || parsedQuantity < -100 || parsedQuantity > 100) {
      return NextResponse.json({ error: 'Invalid quantity' }, { status: 400 })
    }

    // Colours arrive either as a name or as a { name, value } object depending
    // on which surface added them; the stored line is keyed on the name.
    const size = normalizeSize(selectedSize)
    const color = normalizeColor(selectedColor)
    const targetKey = cartLineKey(productId, size, color)

    const user = await findUserById(session.user.id)

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    const currentItems: CartItem[] = user.cartItems || []
    // Legacy carts can hold the same line more than once, so match every
    // occurrence rather than only the first.
    const matching = currentItems.filter(
      (item) => cartLineKey(item.productId, item.selectedSize, item.selectedColor) === targetKey
    )
    const others = currentItems.filter(
      (item) => cartLineKey(item.productId, item.selectedSize, item.selectedColor) !== targetKey
    )

    let updatedCartItems: CartItem[]

    if (action === 'remove') {
      // Deliberately no product lookup: an item whose product has since been
      // deleted from the catalogue must still be removable from the cart.
      updatedCartItems = others
    } else if (action === 'update') {
      if (matching.length === 0) {
        updatedCartItems = currentItems
      } else if (parsedQuantity <= 0) {
        updatedCartItems = others
      } else {
        // Collapse any duplicates into the single line being updated.
        updatedCartItems = [...others, { ...matching[0], selectedSize: size, selectedColor: color, quantity: parsedQuantity }]
      }
    } else {
      if (parsedQuantity <= 0) {
        return NextResponse.json({ error: 'Quantity must be at least 1' }, { status: 400 })
      }

      // The price is read from the product, never taken from the request.
      // Checkout re-prices from the products collection anyway, but storing a
      // client price here would still show a total the server will not honour.
      const products = await getProductsCollection()
      const product = await products.findOne(
        { _id: new ObjectId(String(productId)) },
        { projection: { price: 1, name: 1, image: 1, images: 1 } }
      )
      if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 })
      }

      const existingQuantity = matching.reduce((sum, item) => sum + (Number(item.quantity) || 0), 0)

      updatedCartItems = [
        ...others,
        {
          productId: String(productId),
          name: product.name ?? name ?? '',
          price: Number(product.price),
          image: image || product.image || product.images?.[0] || '',
          selectedSize: size,
          selectedColor: color,
          quantity: Math.min(existingQuantity + parsedQuantity, 100),
          addedAt: matching[0]?.addedAt ?? new Date(),
        },
      ]
    }

    const success = await updateUser(session.user.id, { cartItems: updatedCartItems })
    
    if (!success) {
      return NextResponse.json({ error: 'Failed to update cart' }, { status: 400 })
    }

    const cartCount = updatedCartItems.reduce((count: number, item: CartItem) => count + item.quantity, 0)

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
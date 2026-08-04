import { create } from "zustand"
import type { Product, CartItem } from "@/types/product"
import { useUIStore } from "./ui-store"
import { cartLineKey, normalizeColor, normalizeSize } from "@/lib/cart"

interface ProductState {
  cartItems: CartItem[]
  isCartOpen: boolean
  isLoading: boolean
  error: string | null
  addToCart: (product: Product, selectedSize: string, selectedColor: string, quantity?: number, syncToDb?: boolean) => Promise<void>
  removeFromCart: (productId: string | number, selectedSize: string, selectedColor: string, syncToDb?: boolean) => Promise<void>
  updateQuantity: (productId: string | number, selectedSize: string, selectedColor: string, quantity: number, syncToDb?: boolean) => Promise<void>
  clearCart: (syncToDb?: boolean) => Promise<void>
  setCartOpen: (open: boolean) => void
  getCartTotal: () => number
  getCartItemsCount: () => number
  syncCartFromDB: (dbCartItems: any[]) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useProductStore = create<ProductState>((set, get) => ({
  cartItems: [],
  isCartOpen: false,
  isLoading: false,
  error: null,

  addToCart: async (product, selectedSize, selectedColor, quantity = 1, syncToDb = true) => {
    // Collapse the colour to its name up front so a line added from the shop
    // grid (object) and the same line added from the product page (string)
    // are the same line.
    const size = normalizeSize(selectedSize)
    const color = normalizeColor(selectedColor)
    const lineKey = cartLineKey(product.id, size, color)

    set((state) => {
      const existingItemIndex = state.cartItems.findIndex(
        (item) => cartLineKey(item.id, item.selectedSize, item.selectedColor) === lineKey
      )

      let newCartItems: CartItem[]

      if (existingItemIndex > -1) {
        // Update existing item quantity
        newCartItems = [...state.cartItems]
        newCartItems[existingItemIndex].quantity += quantity
      } else {
        // Add new item
        const newItem: CartItem = {
          ...product,
          quantity,
          selectedSize: size,
          selectedColor: color,
        }
        newCartItems = [...state.cartItems, newItem]
      }

      return {
        cartItems: newCartItems,
        isCartOpen: true
      }
    })
    
    // Update UI store cart count
    const { getCartItemsCount } = get()
    useUIStore.setState({ cartCount: getCartItemsCount() })

    // Sync to database if requested
    if (syncToDb) {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch('/api/user/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: product.id.toString(),
            name: product.name,
            // Trust the caller's chosen image (color-specific from the swatch)
            // before falling back to the product's image list.
            image: product.image || product.images?.[0],
            selectedSize: size,
            selectedColor: color,
            quantity,
            action: 'add'
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          set({ error: errorData.error || 'Failed to sync cart' })
        }
      } catch (error) {
        console.error('Error syncing cart:', error)
        set({ error: 'Failed to sync cart' })
      } finally {
        set({ isLoading: false })
      }
    }
  },

  removeFromCart: async (productId, selectedSize, selectedColor, syncToDb = true) => {
    // Find the item first for API sync
    const size = normalizeSize(selectedSize)
    const color = normalizeColor(selectedColor)
    const lineKey = cartLineKey(productId, size, color)

    const { cartItems } = get()
    const itemToRemove = cartItems.find(
      (item) => cartLineKey(item.id, item.selectedSize, item.selectedColor) === lineKey
    )

    // Update local state first
    set((state) => ({
      cartItems: state.cartItems.filter(
        (item) => cartLineKey(item.id, item.selectedSize, item.selectedColor) !== lineKey
      ),
    }))
    
    // Update UI store cart count
    const { getCartItemsCount } = get()
    useUIStore.setState({ cartCount: getCartItemsCount() })

    // Sync to database if requested
    if (syncToDb && itemToRemove) {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch('/api/user/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: productId.toString(),
            name: itemToRemove.name,
            image: itemToRemove.image,
            selectedSize: size,
            selectedColor: color,
            action: 'remove'
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          set({ error: errorData.error || 'Failed to sync cart' })
        }
      } catch (error) {
        console.error('Error syncing cart:', error)
        set({ error: 'Failed to sync cart' })
      } finally {
        set({ isLoading: false })
      }
    }
  },

  updateQuantity: async (productId, selectedSize, selectedColor, quantity, syncToDb = true) => {
    if (quantity <= 0) {
      await get().removeFromCart(productId, selectedSize, selectedColor, syncToDb)
      return
    }

    // Find the item first for API sync
    const size = normalizeSize(selectedSize)
    const color = normalizeColor(selectedColor)
    const lineKey = cartLineKey(productId, size, color)

    const { cartItems } = get()
    const itemToUpdate = cartItems.find(
      (item) => cartLineKey(item.id, item.selectedSize, item.selectedColor) === lineKey
    )

    // Update local state first
    set((state) => ({
      cartItems: state.cartItems.map((item) =>
        cartLineKey(item.id, item.selectedSize, item.selectedColor) === lineKey
          ? { ...item, quantity }
          : item
      ),
    }))
    
    // Update UI store cart count
    const { getCartItemsCount } = get()
    useUIStore.setState({ cartCount: getCartItemsCount() })

    // Sync to database if requested
    if (syncToDb && itemToUpdate) {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch('/api/user/cart', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            productId: productId.toString(),
            name: itemToUpdate.name,
            image: itemToUpdate.image,
            selectedSize: size,
            selectedColor: color,
            quantity,
            action: 'update'
          }),
        })

        if (!response.ok) {
          const errorData = await response.json()
          set({ error: errorData.error || 'Failed to sync cart' })
        }
      } catch (error) {
        console.error('Error syncing cart:', error)
        set({ error: 'Failed to sync cart' })
      } finally {
        set({ isLoading: false })
      }
    }
  },

  clearCart: async (syncToDb = true) => {
    set({ cartItems: [] })
    useUIStore.setState({ cartCount: 0 })

    // Sync to database if requested
    if (syncToDb) {
      set({ isLoading: true, error: null })
      try {
        const response = await fetch('/api/user/cart', {
          method: 'DELETE'
        })

        if (!response.ok) {
          const errorData = await response.json()
          set({ error: errorData.error || 'Failed to clear cart' })
        }
      } catch (error) {
        console.error('Error clearing cart:', error)
        set({ error: 'Failed to clear cart' })
      } finally {
        set({ isLoading: false })
      }
    }
  },

  syncCartFromDB: (dbCartItems) => {
    // Normalise on the way in and fold duplicates together. Carts written
    // before colours were normalised can hold the same garment twice — once
    // with an object colour, once with the plain name — and those should
    // present as a single line with the combined quantity.
    const byLine = new Map<string, CartItem>()

    for (const dbItem of dbCartItems || []) {
      const size = normalizeSize(dbItem.selectedSize)
      const color = normalizeColor(dbItem.selectedColor)
      const key = cartLineKey(dbItem.productId, size, color)
      const quantity = Number(dbItem.quantity) || 0
      if (quantity <= 0) continue

      const existing = byLine.get(key)
      if (existing) {
        existing.quantity += quantity
        continue
      }

      byLine.set(key, {
        id: dbItem.productId, // Use string ID directly, don't parse as integer
        name: dbItem.name,
        price: dbItem.price,
        image: dbItem.image, // Set the singular image property for cart display
        images: [dbItem.image],
        description: '',
        category: '',
        colors: [color],
        sizes: [size],
        isLook: false,
        quantity,
        selectedSize: size,
        selectedColor: color,
      } as CartItem)
    }

    const localCartItems = Array.from(byLine.values())
    set({ cartItems: localCartItems })
    useUIStore.setState({ cartCount: localCartItems.reduce((count, item) => count + item.quantity, 0) })
  },

  setCartOpen: (open) => {
    set({ isCartOpen: open })
  },

  setLoading: (loading) => {
    set({ isLoading: loading })
  },

  setError: (error) => {
    set({ error })
  },

  getCartTotal: () => {
    const { cartItems } = get()
    return cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)
  },

  getCartItemsCount: () => {
    const { cartItems } = get()
    return cartItems.reduce((count, item) => count + item.quantity, 0)
  },
}))

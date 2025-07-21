import { create } from "zustand"
import type { Product, CartItem } from "@/types/product"
import { useUIStore } from "./ui-store"

interface ProductState {
  cartItems: CartItem[]
  isCartOpen: boolean
  isLoading: boolean
  error: string | null
  addToCart: (product: Product, selectedSize: string, selectedColor: string, quantity?: number, syncToDb?: boolean) => Promise<void>
  removeFromCart: (productId: number, selectedSize: string, selectedColor: string, syncToDb?: boolean) => Promise<void>
  updateQuantity: (productId: number, selectedSize: string, selectedColor: string, quantity: number, syncToDb?: boolean) => Promise<void>
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
    // Update local state first for immediate UI response
    set((state) => {
      const existingItemIndex = state.cartItems.findIndex(
        (item) => 
          item.id === product.id && 
          item.selectedSize === selectedSize && 
          item.selectedColor === selectedColor
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
          selectedSize,
          selectedColor,
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
            productId: product.id,
            name: product.name,
            price: product.price,
            image: product.images?.[0] || product.image,
            selectedSize,
            selectedColor,
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
    const { cartItems } = get()
    const itemToRemove = cartItems.find(
      (item) => 
        item.id === productId && 
        item.selectedSize === selectedSize && 
        item.selectedColor === selectedColor
    )

    // Update local state first
    set((state) => {
      const newCartItems = state.cartItems.filter(
        (item) => 
          !(item.id === productId && 
            item.selectedSize === selectedSize && 
            item.selectedColor === selectedColor)
      )
      return { cartItems: newCartItems }
    })
    
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
            productId,
            name: itemToRemove.name,
            price: itemToRemove.price,
            image: itemToRemove.image,
            selectedSize,
            selectedColor,
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
    const { cartItems } = get()
    const itemToUpdate = cartItems.find(
      (item) => 
        item.id === productId && 
        item.selectedSize === selectedSize && 
        item.selectedColor === selectedColor
    )

    // Update local state first
    set((state) => {
      const newCartItems = state.cartItems.map((item) =>
        item.id === productId && 
        item.selectedSize === selectedSize && 
        item.selectedColor === selectedColor
          ? { ...item, quantity }
          : item
      )
      return { cartItems: newCartItems }
    })
    
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
            productId,
            name: itemToUpdate.name,
            price: itemToUpdate.price,
            image: itemToUpdate.image,
            selectedSize,
            selectedColor,
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
    // Convert database cart items to local cart items format
    const localCartItems: CartItem[] = dbCartItems.map((dbItem) => ({
      id: parseInt(dbItem.productId),
      name: dbItem.name,
      price: dbItem.price,
      image: dbItem.image, // Set the singular image property for cart display
      images: [dbItem.image],
      description: '',
      category: '',
      colors: [dbItem.selectedColor],
      sizes: [dbItem.selectedSize],
      isLook: false,
      quantity: dbItem.quantity,
      selectedSize: dbItem.selectedSize,
      selectedColor: dbItem.selectedColor,
    }))

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

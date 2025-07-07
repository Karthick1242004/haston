import { create } from "zustand"
import type { Product, CartItem } from "@/types/product"
import { useUIStore } from "./ui-store"

interface ProductState {
  cartItems: CartItem[]
  isCartOpen: boolean
  addToCart: (product: Product, selectedSize: string, selectedColor: string, quantity?: number) => void
  removeFromCart: (productId: number, selectedSize: string, selectedColor: string) => void
  updateQuantity: (productId: number, selectedSize: string, selectedColor: string, quantity: number) => void
  clearCart: () => void
  setCartOpen: (open: boolean) => void
  getCartTotal: () => number
  getCartItemsCount: () => number
}

export const useProductStore = create<ProductState>((set, get) => ({
  cartItems: [],
  isCartOpen: false,

  addToCart: (product, selectedSize, selectedColor, quantity = 1) => {
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
  },

  removeFromCart: (productId, selectedSize, selectedColor) => {
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
  },

  updateQuantity: (productId, selectedSize, selectedColor, quantity) => {
    if (quantity <= 0) {
      get().removeFromCart(productId, selectedSize, selectedColor)
      return
    }

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
  },

  clearCart: () => {
    set({ cartItems: [] })
    useUIStore.setState({ cartCount: 0 })
  },

  setCartOpen: (open) => {
    set({ isCartOpen: open })
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

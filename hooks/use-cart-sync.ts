import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { CartItem } from '@/types/database'

export interface CartSyncHook {
  isLoading: boolean
  error: string | null
  syncCart: () => Promise<void>
  addToCartDB: (productId: number, name: string, price: number, image: string, selectedSize: string, selectedColor: string, quantity?: number) => Promise<boolean>
  updateCartItemDB: (productId: number, selectedSize: string, selectedColor: string, quantity: number) => Promise<boolean>
  removeFromCartDB: (productId: number, selectedSize: string, selectedColor: string) => Promise<boolean>
  clearCartDB: () => Promise<boolean>
}

export const useCartSync = (): CartSyncHook => {
  const { data: session } = useSession()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync cart from database
  const syncCart = useCallback(async () => {
    if (!session?.user) {
      return
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/user/cart')
      if (response.ok) {
        const data = await response.json()
        return data.cartItems || []
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to sync cart')
        return []
      }
    } catch (error) {
      console.error('Failed to sync cart:', error)
      setError('Failed to sync cart')
      return []
    } finally {
      setIsLoading(false)
    }
  }, [session])

  // Add item to cart in database
  const addToCartDB = async (
    productId: number, 
    name: string, 
    price: number, 
    image: string, 
    selectedSize: string, 
    selectedColor: string, 
    quantity: number = 1
  ): Promise<boolean> => {
    if (!session?.user) {
      setError('Please sign in to add items to cart')
      return false
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/user/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          name,
          price,
          image,
          selectedSize,
          selectedColor,
          quantity,
          action: 'add'
        }),
      })

      if (response.ok) {
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to add to cart')
        return false
      }
    } catch (error) {
      console.error('Error adding to cart:', error)
      setError('Failed to add to cart')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Update cart item quantity in database
  const updateCartItemDB = async (
    productId: number, 
    selectedSize: string, 
    selectedColor: string, 
    quantity: number
  ): Promise<boolean> => {
    if (!session?.user) {
      setError('Please sign in to update cart')
      return false
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/user/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          selectedSize,
          selectedColor,
          quantity,
          action: 'update'
        }),
      })

      if (response.ok) {
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to update cart')
        return false
      }
    } catch (error) {
      console.error('Error updating cart:', error)
      setError('Failed to update cart')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Remove item from cart in database
  const removeFromCartDB = async (
    productId: number, 
    selectedSize: string, 
    selectedColor: string
  ): Promise<boolean> => {
    if (!session?.user) {
      setError('Please sign in to remove items from cart')
      return false
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/user/cart', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          selectedSize,
          selectedColor,
          action: 'remove'
        }),
      })

      if (response.ok) {
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to remove from cart')
        return false
      }
    } catch (error) {
      console.error('Error removing from cart:', error)
      setError('Failed to remove from cart')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Clear entire cart in database
  const clearCartDB = async (): Promise<boolean> => {
    if (!session?.user) {
      setError('Please sign in to clear cart')
      return false
    }

    setIsLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/user/cart', {
        method: 'DELETE'
      })

      if (response.ok) {
        return true
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to clear cart')
        return false
      }
    } catch (error) {
      console.error('Error clearing cart:', error)
      setError('Failed to clear cart')
      return false
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    error,
    syncCart,
    addToCartDB,
    updateCartItemDB,
    removeFromCartDB,
    clearCartDB
  }
} 
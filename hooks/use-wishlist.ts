import { useState, useEffect, useCallback } from 'react'
import { useSession } from 'next-auth/react'
import { toast } from '@/hooks/use-toast'

export const useWishlist = () => {
  const { data: session } = useSession()
  const [wishlist, setWishlist] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  // Fetch wishlist when user is authenticated
  const fetchWishlist = useCallback(async () => {
    if (!session?.user) {
      setWishlist([])
      return
    }

    try {
      const response = await fetch('/api/user/wishlist')
      if (response.ok) {
        const data = await response.json()
        setWishlist(data.wishlist || [])
      }
    } catch (error) {
      console.error('Failed to fetch wishlist:', error)
    }
  }, [session])

  // Load wishlist on mount and when session changes
  useEffect(() => {
    fetchWishlist()
  }, [fetchWishlist])

  // Add product to wishlist
  const addToWishlist = async (productId: number) => {
    if (!session?.user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to add items to your wishlist",
        variant: "destructive"
      })
      return false
    }

    setIsLoading(true)
    try {
      const response = await fetch('/api/user/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          action: 'add'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setWishlist(data.wishlist)
        return true
      } else {
        console.error('Failed to add to wishlist')
        return false
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Remove product from wishlist
  const removeFromWishlist = async (productId: number) => {
    if (!session?.user) return false

    setIsLoading(true)
    try {
      const response = await fetch('/api/user/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          productId,
          action: 'remove'
        }),
      })

      if (response.ok) {
        const data = await response.json()
        setWishlist(data.wishlist)
        return true
      } else {
        console.error('Failed to remove from wishlist')
        return false
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle wishlist status
  const toggleWishlist = async (productId: number) => {
    const isInWishlist = wishlist.includes(productId.toString())
    
    if (isInWishlist) {
      return await removeFromWishlist(productId)
    } else {
      return await addToWishlist(productId)
    }
  }

  // Check if product is in wishlist
  const isInWishlist = (productId: number) => {
    return wishlist.includes(productId?.toString())
  }

  return {
    wishlist,
    isLoading,
    addToWishlist,
    removeFromWishlist,
    toggleWishlist,
    isInWishlist,
    fetchWishlist
  }
} 
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
  const addToWishlist = async (productId: string | number) => {
    console.log("addToWishlist called with:", productId, "Type:", typeof productId)
    
    if (!session?.user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to add items to your wishlist",
        variant: "destructive"
      })
      return false
    }

    if (!productId) {
      console.error("Invalid productId:", productId)
      toast({
        title: "Error",
        description: "Invalid product ID",
        variant: "destructive"
      })
      return false
    }

    setIsLoading(true)
    try {
      const requestBody = {
        productId,
        action: 'add'
      }
      
      console.log("Sending wishlist request:", requestBody)
      
      const response = await fetch('/api/user/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Wishlist response status:", response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log("Wishlist response data:", data)
        setWishlist(data.wishlist)
        return true
      } else {
        const errorData = await response.json()
        console.error('Failed to add to wishlist:', errorData)
        toast({
          title: "Error",
          description: errorData.error || "Failed to add to wishlist",
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      console.error('Error adding to wishlist:', error)
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive"
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Remove product from wishlist
  const removeFromWishlist = async (productId: string | number) => {
    console.log("removeFromWishlist called with:", productId, "Type:", typeof productId)
    
    if (!session?.user) {
      toast({
        title: "Sign In Required",
        description: "Please sign in to manage your wishlist",
        variant: "destructive"
      })
      return false
    }

    if (!productId) {
      console.error("Invalid productId:", productId)
      return false
    }

    setIsLoading(true)
    try {
      const requestBody = {
        productId,
        action: 'remove'
      }
      
      console.log("Sending wishlist remove request:", requestBody)
      
      const response = await fetch('/api/user/wishlist', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      })

      console.log("Wishlist remove response status:", response.status)

      if (response.ok) {
        const data = await response.json()
        console.log("Wishlist remove response data:", data)
        setWishlist(data.wishlist)
        return true
      } else {
        const errorData = await response.json()
        console.error('Failed to remove from wishlist:', errorData)
        toast({
          title: "Error",
          description: errorData.error || "Failed to remove from wishlist",
          variant: "destructive"
        })
        return false
      }
    } catch (error) {
      console.error('Error removing from wishlist:', error)
      toast({
        title: "Error",
        description: "Network error. Please try again.",
        variant: "destructive"
      })
      return false
    } finally {
      setIsLoading(false)
    }
  }

  // Toggle wishlist status
  const toggleWishlist = async (productId: string | number) => {
    const productIdStr = productId.toString()
    const isCurrentlyInWishlist = wishlist.includes(productIdStr)
    
    if (isCurrentlyInWishlist) {
      return await removeFromWishlist(productId)
    } else {
      return await addToWishlist(productId)
    }
  }

  // Check if product is in wishlist
  const isInWishlist = (productId: string | number) => {
    if (!productId) return false
    return wishlist.includes(productId.toString())
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
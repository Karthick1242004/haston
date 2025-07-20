"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useProductStore } from '@/stores/product-store'

export default function CartSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  const { syncCartFromDB, clearCart } = useProductStore()

  useEffect(() => {
    const syncCart = async () => {
      if (status === 'authenticated' && session?.user) {
        try {
          // Fetch cart from database
          const response = await fetch('/api/user/cart')
          if (response.ok) {
            const data = await response.json()
            syncCartFromDB(data.cartItems || [])
          } else {
            console.error('Failed to fetch cart from database')
          }
        } catch (error) {
          console.error('Error syncing cart:', error)
        }
      } else if (status === 'unauthenticated') {
        // Clear cart when user logs out
        await clearCart(false) // Don't sync to DB when clearing due to logout
      }
    }

    // Only sync when authentication status is determined
    if (status !== 'loading') {
      syncCart()
    }
  }, [session, status, syncCartFromDB, clearCart])

  return <>{children}</>
} 
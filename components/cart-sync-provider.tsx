"use client"

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useProductStore } from '@/stores/product-store'

export default function CartSyncProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession()
  // Depend on the email string rather than the session object: the object's
  // identity changes on re-render, which re-ran this effect and refetched the
  // cart repeatedly.
  const userEmail = session?.user?.email ?? null

  useEffect(() => {
    let cancelled = false

    const syncCart = async () => {
      if (status === 'authenticated' && userEmail) {
        // Capture the cart's revision before the request goes out. If the
        // shopper adds or removes something while it is in flight, the
        // response is stale and applying it would wipe their change — which
        // showed up as an empty bag while the item sat in the database.
        const revisionAtFetch = useProductStore.getState().cartRevision
        try {
          const response = await fetch('/api/user/cart')
          if (cancelled) return
          if (response.ok) {
            const data = await response.json()
            if (cancelled) return
            useProductStore.getState().syncCartFromDB(data.cartItems || [], revisionAtFetch)
          } else {
            console.error('Failed to fetch cart from database')
          }
        } catch (error) {
          console.error('Error syncing cart:', error)
        }
      } else if (status === 'unauthenticated') {
        // Clear cart when user logs out
        await useProductStore.getState().clearCart(false) // Don't sync to DB when clearing due to logout
      }
    }

    // Only sync when authentication status is determined
    if (status !== 'loading') {
      syncCart()
    }

    return () => {
      cancelled = true
    }
  }, [status, userEmail])

  return <>{children}</>
}

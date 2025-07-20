import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useProductStore } from "@/stores/product-store"
import { useLookStore } from "@/stores/look-store"
import type { Product } from "@/types/product"
import type { Look } from "@/types/look"

interface UseAuthCartReturn {
  addProductToCart: (product: Product, selectedSize: string, selectedColor: string, quantity?: number) => Promise<void>
  addLookToCart: (look: Look) => void
  buyProductNow: (product: Product, selectedSize: string, selectedColor: string, quantity?: number) => Promise<void>
  isAuthenticated: boolean
}

export function useAuthCart(): UseAuthCartReturn {
  const { data: session, status } = useSession()
  const router = useRouter()
  const { addToCart: addProductToCartStore } = useProductStore()
  const { addToCart: addLookToCartStore } = useLookStore()

  const isAuthenticated = status === "authenticated" && !!session

  const storeRedirectUrl = (url: string) => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('redirectAfterLogin', url)
    }
  }

  const addProductToCart = async (product: Product, selectedSize: string, selectedColor: string, quantity = 1) => {
    if (!isAuthenticated) {
      // Store current URL for redirect after login
      storeRedirectUrl(window.location.pathname + window.location.search)
      router.push('/auth/signin')
      return
    }
    
    // User is authenticated, proceed with adding to cart
    await addProductToCartStore(product, selectedSize, selectedColor, quantity)
  }

  const addLookToCart = (look: Look) => {
    if (!isAuthenticated) {
      // Store current URL for redirect after login
      storeRedirectUrl(window.location.pathname + window.location.search)
      router.push('/auth/signin')
      return
    }
    
    // User is authenticated, proceed with adding to cart
    addLookToCartStore(look)
  }

  const buyProductNow = async (product: Product, selectedSize: string, selectedColor: string, quantity = 1) => {
    if (!isAuthenticated) {
      // Store current URL and buy now action for redirect after login
      storeRedirectUrl(window.location.pathname + window.location.search)
      storeBuyNowAction(product, selectedSize, selectedColor, quantity)
      router.push('/auth/signin')
      return
    }
    
    // User is authenticated, add to cart and redirect to checkout
    await addProductToCartStore(product, selectedSize, selectedColor, quantity)
    router.push('/checkout')
  }

  return {
    addProductToCart,
    addLookToCart,
    buyProductNow,
    isAuthenticated
  }
}

export function getRedirectUrl(): string | null {
  if (typeof window !== 'undefined') {
    return sessionStorage.getItem('redirectAfterLogin')
  }
  return null
}

export function clearRedirectUrl(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('redirectAfterLogin')
  }
}

interface BuyNowAction {
  product: Product
  selectedSize: string
  selectedColor: string
  quantity: number
}

function storeBuyNowAction(product: Product, selectedSize: string, selectedColor: string, quantity: number): void {
  if (typeof window !== 'undefined') {
    const buyNowAction: BuyNowAction = {
      product,
      selectedSize,
      selectedColor,
      quantity
    }
    sessionStorage.setItem('buyNowAction', JSON.stringify(buyNowAction))
  }
}

export function getBuyNowAction(): BuyNowAction | null {
  if (typeof window !== 'undefined') {
    const stored = sessionStorage.getItem('buyNowAction')
    return stored ? JSON.parse(stored) : null
  }
  return null
}

export function clearBuyNowAction(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem('buyNowAction')
  }
} 
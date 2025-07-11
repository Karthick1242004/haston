"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { signIn, getSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Chrome, ArrowLeft } from "lucide-react"
import Header from "@/components/header"
import PageTransition from "@/components/page-transition"
import { getRedirectUrl, clearRedirectUrl, getBuyNowAction, clearBuyNowAction } from "@/hooks/use-auth-cart"
import { useProductStore } from "@/stores/product-store"

export default function SignInPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { addToCart } = useProductStore()

  useEffect(() => {
    // Check if user is already signed in
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        // Check for buy now action first
        const buyNowAction = getBuyNowAction()
        if (buyNowAction) {
          // Add to cart and redirect to checkout
          addToCart(buyNowAction.product, buyNowAction.selectedSize, buyNowAction.selectedColor, buyNowAction.quantity)
          clearBuyNowAction()
          clearRedirectUrl()
          router.push('/checkout')
          return
        }
        
        // Check for redirect URL
        const redirectUrl = getRedirectUrl()
        if (redirectUrl) {
          clearRedirectUrl()
          router.push(redirectUrl)
        } else {
          router.push('/profile')
        }
      }
    }
    checkSession()
  }, [router, addToCart])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      // Check for buy now action first
      const buyNowAction = getBuyNowAction()
      
      const result = await signIn('google', { 
        callbackUrl: buyNowAction ? '/checkout' : (getRedirectUrl() || '/profile'),
        redirect: false 
      })
      
      if (result?.ok) {
        // Handle buy now action
        if (buyNowAction) {
          addToCart(buyNowAction.product, buyNowAction.selectedSize, buyNowAction.selectedColor, buyNowAction.quantity)
          clearBuyNowAction()
          clearRedirectUrl()
          router.push('/checkout')
        } else {
          // Handle normal redirect
          const redirectUrl = getRedirectUrl()
          clearRedirectUrl()
          router.push(redirectUrl || '/profile')
        }
      }
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F1EFEE]">
        {/* Header */}
        <div className="relative bg-white shadow-sm">
          <Header />
        </div>

        <div className="pt-20 pb-12">
          <div className="max-w-md mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Navigation */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-amber-950 hover:text-amber-800 hover:bg-white transition-all rounded-lg px-4 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </motion.div>

            {/* Sign In Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white shadow-lg border border-gray-200">
                <CardHeader className="bg-white border-b border-gray-200 text-center">
                  <CardTitle className="text-2xl font-bold text-amber-950">
                    Welcome to Hex & Hue
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    Sign in to access your account and enjoy personalized shopping
                  </p>
                </CardHeader>
                
                <CardContent className="p-8 space-y-6">
                  {/* Google Sign In Button */}
                  <Button
                    onClick={handleGoogleSignIn}
                    disabled={isLoading}
                    className="w-full bg-amber-950 text-white hover:bg-amber-800 disabled:bg-gray-300 transition-all py-6 text-lg font-medium rounded-lg"
                  >
                    <Chrome className="w-5 h-5 mr-3" />
                    {isLoading ? "Signing in..." : "Sign in with Google"}
                  </Button>

                  {/* Features List */}
                  <div className="mt-8 space-y-4">
                    <p className="text-sm font-medium text-amber-950 text-center">
                      What you'll get:
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-950 rounded-full"></div>
                        <span>Personalized shopping experience</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-950 rounded-full"></div>
                        <span>Save your favorite items to wishlist</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-950 rounded-full"></div>
                        <span>Track your order history</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-amber-950 rounded-full"></div>
                        <span>Faster checkout with saved addresses</span>
                      </div>
                    </div>
                  </div>

                  {/* Terms */}
                  <p className="text-xs text-gray-500 text-center mt-6">
                    By signing in, you agree to our Terms of Service and Privacy Policy
                  </p>
                </CardContent>
              </Card>
            </motion.div>

            {/* Continue as Guest */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="mt-6 text-center"
            >
              <Button
                variant="outline"
                onClick={() => router.push('/')}
                className="text-amber-950 border-amber-950 hover:text-white hover:bg-amber-950 transition-all"
              >
                Continue as Guest
              </Button>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
} 
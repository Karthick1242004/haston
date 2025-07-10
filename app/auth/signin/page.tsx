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

export default function SignInPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    // Check if user is already signed in
    const checkSession = async () => {
      const session = await getSession()
      if (session) {
        router.push('/profile')
      }
    }
    checkSession()
  }, [router])

  const handleGoogleSignIn = async () => {
    setIsLoading(true)
    try {
      await signIn('google', { 
        callbackUrl: '/profile',
        redirect: false 
      })
    } catch (error) {
      console.error('Sign in error:', error)
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50">
        {/* Header */}
        <div className="relative bg-white/80 backdrop-blur-sm shadow-sm">
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
                className="flex items-center gap-2 text-blue-600 hover:text-white hover:bg-gradient-to-r hover:from-blue-500 hover:to-purple-600 transition-all rounded-lg px-4 py-2"
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
              <Card className="border-t-4 border-t-blue-500 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardHeader className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-t-lg text-center">
                  <CardTitle className="text-2xl font-bold text-gray-800">
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
                    className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all py-6 text-lg font-medium rounded-lg"
                  >
                    <Chrome className="w-5 h-5 mr-3" />
                    {isLoading ? "Signing in..." : "Sign in with Google"}
                  </Button>

                  {/* Features List */}
                  <div className="mt-8 space-y-4">
                    <p className="text-sm font-medium text-gray-700 text-center">
                      What you'll get:
                    </p>
                    <div className="space-y-2 text-sm text-gray-600">
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-purple-600 rounded-full"></div>
                        <span>Personalized shopping experience</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full"></div>
                        <span>Save your favorite items to wishlist</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-green-500 to-blue-600 rounded-full"></div>
                        <span>Track your order history</span>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="w-2 h-2 bg-gradient-to-r from-pink-500 to-orange-500 rounded-full"></div>
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
                className="text-purple-600 border-purple-300 hover:text-white hover:bg-gradient-to-r hover:from-purple-500 hover:to-pink-500 hover:border-0 transition-all shadow-sm hover:shadow-md"
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
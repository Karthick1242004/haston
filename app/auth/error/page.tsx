"use client"

import { motion } from "framer-motion"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertTriangle, ArrowLeft, RefreshCcw } from "lucide-react"
import Header from "@/components/header"
import PageTransition from "@/components/page-transition"
import { Suspense } from "react"

function ErrorContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  const getErrorMessage = (error: string | null) => {
    switch (error) {
      case 'Configuration':
        return 'There is a problem with the server configuration.'
      case 'AccessDenied':
        return 'Access denied. You do not have permission to sign in.'
      case 'Verification':
        return 'The verification token has expired or has already been used.'
      case 'Default':
      default:
        return 'An error occurred during authentication. Please try again.'
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
                onClick={() => router.push('/')}
                className="flex items-center gap-2 text-amber-950 hover:text-amber-800 hover:bg-white transition-all rounded-lg px-4 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Home
              </Button>
            </motion.div>

            {/* Error Card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
            >
              <Card className="bg-white shadow-lg border border-gray-200">
                <CardHeader className="bg-white border-b border-gray-200 text-center">
                  <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-red-500 rounded-full flex items-center justify-center">
                      <AlertTriangle className="w-8 h-8 text-white" />
                    </div>
                  </div>
                  <CardTitle className="text-2xl font-bold text-amber-950">
                    Authentication Error
                  </CardTitle>
                  <p className="text-sm text-gray-600 mt-2">
                    {getErrorMessage(error)}
                  </p>
                </CardHeader>
                
                <CardContent className="p-8 space-y-6">
                  {/* Action Buttons */}
                  <div className="space-y-3">
                    <Button
                      onClick={() => router.push('/auth/signin')}
                      className="w-full bg-amber-950 text-white hover:bg-amber-800 transition-all py-4 text-lg font-medium rounded-lg"
                    >
                      <RefreshCcw className="w-5 h-5 mr-3" />
                      Try Again
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => router.push('/')}
                      className="w-full text-gray-600 border-gray-300 hover:text-amber-950 hover:bg-gray-50 transition-all py-4"
                    >
                      Continue as Guest
                    </Button>
                  </div>

                  {/* Help Text */}
                  <div className="bg-gray-50 rounded-lg p-4 mt-6">
                    <p className="text-sm text-gray-700 text-center">
                      Still having trouble? Contact our support team for assistance.
                    </p>
                  </div>

                  {/* Error Details (for debugging) */}
                  {error && process.env.NODE_ENV === 'development' && (
                    <div className="bg-gray-100 rounded-lg p-4 mt-4">
                      <p className="text-xs text-gray-500 text-center">
                        Error Code: {error}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <PageTransition>
        <div className="min-h-screen bg-[#F1EFEE] flex items-center justify-center">
          <div className="text-center">
            <div className="w-16 h-16 border-4 border-gray-200 border-t-amber-950 rounded-full animate-spin mx-auto mb-4"></div>
            <p className="text-amber-950">Loading...</p>
          </div>
        </div>
      </PageTransition>
    }>
      <ErrorContent />
    </Suspense>
  )
} 
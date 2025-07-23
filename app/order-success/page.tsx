"use client"

import { motion } from "framer-motion"
import { useState, useEffect, Suspense } from "react"
import { useSearchParams, useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { 
  CheckCircle, 
  Package, 
  Truck, 
  Calendar, 
  MapPin, 
  CreditCard, 
  Download,
  ArrowRight,
  Home,
  Receipt,
  ShoppingBag,
  User
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import Header from "@/components/header"
import PageTransition from "@/components/page-transition"
import { Order } from "@/types/order"
import Confetti from 'react-confetti'

function OrderSuccessContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  
  const [order, setOrder] = useState<Order | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showConfetti, setShowConfetti] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [windowSize, setWindowSize] = useState({ width: 0, height: 0 })
  const [isMounted, setIsMounted] = useState(false)

  const orderId = searchParams.get('orderId')

  useEffect(() => {
    // Set mounted state and get window size
    setIsMounted(true)
    const updateWindowSize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      })
    }

    updateWindowSize()
    window.addEventListener('resize', updateWindowSize)

    return () => window.removeEventListener('resize', updateWindowSize)
  }, [])

  useEffect(() => {
    if (!orderId) {
      setError('Order ID not found')
      setIsLoading(false)
      return
    }

    fetchOrder()
  }, [orderId])

  useEffect(() => {
    // Stop confetti after 5 seconds
    const timer = setTimeout(() => {
      setShowConfetti(false)
    }, 5000)

    return () => clearTimeout(timer)
  }, [])

  const fetchOrder = async () => {
    try {
      const response = await fetch(`/api/orders/${orderId}`)
      if (response.ok) {
        const data = await response.json()
        setOrder(data.order)
      } else {
        const errorData = await response.json()
        setError(errorData.error || 'Failed to fetch order')
      }
    } catch (error) {
      console.error('Error fetching order:', error)
      setError('Failed to load order details')
    } finally {
      setIsLoading(false)
    }
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800'
      case 'processing': return 'bg-blue-100 text-blue-800'
      case 'shipped': return 'bg-purple-100 text-purple-800'
      case 'delivered': return 'bg-green-100 text-green-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Package className="w-4 h-4" />
      case 'shipped': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  if (!session) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[#F1EFEE] flex items-center justify-center">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-amber-950 mb-4">Please sign in to view your order</h2>
            <Button onClick={() => router.push('/auth/signin')} className="bg-amber-950 text-white">
              Sign In
            </Button>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (isLoading) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[#F1EFEE] flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-950 mx-auto mb-4"></div>
            <p className="text-amber-950 font-medium">Loading your order details...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  if (error || !order) {
    return (
      <PageTransition>
        <div className="min-h-screen bg-[#F1EFEE] flex items-center justify-center">
          <div className="text-center bg-white rounded-2xl p-12 shadow-lg border border-gray-200">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Receipt className="w-8 h-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-red-600 mb-2">Order Not Found</h2>
            <p className="text-gray-600 mb-6">{error || 'We couldn\'t find your order details.'}</p>
            <Button onClick={() => router.push('/')} className="bg-amber-950 text-white">
              <Home className="w-4 h-4 mr-2" />
              Back to Home
            </Button>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      {isMounted && showConfetti && windowSize.width > 0 && (
        <Confetti
          width={windowSize.width}
          height={windowSize.height}
          recycle={false}
          numberOfPieces={200}
          gravity={0.1}
        />
      )}
      
      <div className="min-h-screen bg-[#F1EFEE]">
        {/* Header */}
        <div className="relative bg-white shadow-sm">
          <Header />
        </div>

        <div className="pt-20 pb-12">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Success Header */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center mb-12"
            >
              {/* Welcome Message */}
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="mb-8"
              >
                <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-200 max-w-2xl mx-auto">
                  <div className="flex items-center justify-center space-x-4">
                    {session.user?.image ? (
                      <Image
                        src={session.user.image}
                        alt={session.user.name || 'User'}
                        width={48}
                        height={48}
                        className="rounded-full ring-4 ring-amber-950/10"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-amber-950 rounded-full flex items-center justify-center">
                        <User className="w-6 h-6 text-white" />
                      </div>
                    )}
                    <div className="text-left">
                      <h2 className="text-2xl font-bold text-amber-950">
                        Welcome back, {session.user?.name?.split(' ')[0] || 'Customer'}!
                      </h2>
                      <p className="text-gray-600">Thank you for choosing us</p>
                    </div>
                  </div>
                </div>
              </motion.div>

              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
              >
                <CheckCircle className="w-12 h-12 text-green-600" />
              </motion.div>
              
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="text-4xl font-bold text-amber-950 mb-4"
              >
                Order Confirmed! 🎉
              </motion.h1>
              
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="text-xl text-gray-600 mb-6"
              >
                Your order has been successfully placed and is being processed.
              </motion.p>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="flex items-center justify-center space-x-4"
              >
                <Badge className="text-lg px-4 py-2 bg-amber-950 text-white">
                  Order #{order.orderId}
                </Badge>
                <Badge className={`text-lg px-4 py-2 ${getStatusColor(order.status)}`}>
                  {getStatusIcon(order.status)}
                  <span className="ml-2 capitalize">{order.status}</span>
                </Badge>
              </motion.div>
            </motion.div>

            {/* Order Status Information */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="mb-8"
            >
              <Card className="bg-white shadow-lg border border-gray-200">
                <CardHeader className="bg-white border-b border-gray-200">
                  <CardTitle className="text-2xl font-bold text-amber-950">Order Status</CardTitle>
                </CardHeader>
                <CardContent className="p-6">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Order Date */}
                    <div className="text-center">
                      <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Calendar className="w-6 h-6 text-green-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Order Placed</h3>
                      <p className="text-sm text-gray-600">
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric'
                        })}
                      </p>
                    </div>

                    {/* Current Status */}
                    <div className="text-center">
                      <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        {getStatusIcon(order.status)}
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Current Status</h3>
                      <p className="text-sm text-gray-600 capitalize">{order.status}</p>
                    </div>

                    {/* Estimated Delivery */}
                    <div className="text-center">
                      <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
                        <Truck className="w-6 h-6 text-purple-600" />
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-1">Expected Delivery</h3>
                      <p className="text-sm text-gray-600">
                        {order.estimatedDelivery 
                          ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                              day: 'numeric',
                              month: 'short'
                            })
                          : '7-10 days'
                        }
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
              {/* Order Summary */}
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.6 }}
              >
                <Card className="bg-white shadow-lg border border-gray-200">
                  <CardHeader className="bg-white border-b border-gray-200">
                    <CardTitle className="text-2xl font-bold text-amber-950 flex items-center">
                      <Package className="w-6 h-6 mr-3" />
                      Order Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-6">
                      {/* Order Items */}
                      <div>
                        <h3 className="font-semibold text-gray-900 mb-4">Items Ordered</h3>
                        <div className="space-y-4">
                          {order.items.map((item, index) => (
                            <motion.div
                              key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                              initial={{ opacity: 0, y: 10 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: 0.7 + (index * 0.1) }}
                              className="flex gap-4 p-3 border border-gray-200 rounded-lg"
                            >
                              <div className="relative w-16 h-20 rounded-lg overflow-hidden bg-gray-100">
                                <Image
                                  src={item.image}
                                  alt={item.name}
                                  fill
                                  className="object-cover"
                                  unoptimized
                                />
                              </div>
                              <div className="flex-1">
                                <h4 className="font-medium text-gray-900">{item.name}</h4>
                                <p className="text-sm text-gray-600">
                                  {item.selectedColor} • {item.selectedSize}
                                </p>
                                <div className="flex justify-between items-center mt-2">
                                  <span className="text-sm text-gray-600">Qty: {item.quantity}</span>
                                  <span className="font-medium">₹{item.subtotal.toFixed(2)}</span>
                                </div>
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Order Summary */}
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Subtotal</span>
                          <span>₹{order.orderSummary.subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Shipping</span>
                          <span>
                            {order.orderSummary.shipping === 0 ? "Free" : `₹${order.orderSummary.shipping.toFixed(2)}`}
                          </span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Taxes</span>
                          <span>₹{order.orderSummary.taxes.toFixed(2)}</span>
                        </div>
                        {order.orderSummary.discount > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-green-600">
                              Discount {order.orderSummary.discountCode && `(${order.orderSummary.discountCode})`}
                            </span>
                            <span className="text-green-600">-₹{order.orderSummary.discount.toFixed(2)}</span>
                          </div>
                        )}
                        <Separator />
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span>₹{order.orderSummary.total.toFixed(2)}</span>
                        </div>
                      </div>

                      {/* Delivery Information */}
                      <div className="bg-amber-50 p-4 rounded-lg">
                        <div className="flex items-center mb-2">
                          <Calendar className="w-5 h-5 text-amber-700 mr-2" />
                          <span className="font-medium text-amber-900">Estimated Delivery</span>
                        </div>
                        <p className="text-amber-800">
                          {order.estimatedDelivery 
                            ? new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })
                            : '7-10 business days'
                          }
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              {/* Payment & Shipping Details */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.7 }}
                className="space-y-6"
              >
                {/* Payment Details */}
                <Card className="bg-white shadow-lg border border-gray-200">
                  <CardHeader className="bg-white border-b border-gray-200">
                    <CardTitle className="text-xl font-bold text-amber-950 flex items-center">
                      <CreditCard className="w-5 h-5 mr-3" />
                      Payment Details
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    <div className="flex justify-between">
                      <span className="text-gray-600">Transaction ID</span>
                      <span className="font-mono text-sm font-medium">{order.paymentDetails.razorpay_payment_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Order ID</span>
                      <span className="font-mono text-sm font-medium">{order.paymentDetails.razorpay_order_id}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Amount Paid</span>
                      <span className="font-medium">₹{order.paymentDetails.amount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Status</span>
                      <Badge className="bg-green-100 text-green-800">
                        <CheckCircle className="w-3 h-3 mr-1" />
                        Success
                      </Badge>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-600">Payment Date</span>
                      <span className="text-sm">
                        {new Date(order.paymentDetails.created_at).toLocaleDateString('en-IN', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </CardContent>
                </Card>

                {/* Shipping Address */}
                <Card className="bg-white shadow-lg border border-gray-200">
                  <CardHeader className="bg-white border-b border-gray-200">
                    <CardTitle className="text-xl font-bold text-amber-950 flex items-center">
                      <MapPin className="w-5 h-5 mr-3" />
                      Shipping Address
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6">
                    <div className="space-y-2">
                      <p className="font-medium">
                        {order.shippingAddress.firstName} {order.shippingAddress.lastName}
                      </p>
                      <p className="text-gray-600">{order.shippingAddress.address}</p>
                      <p className="text-gray-600">
                        {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.zipCode}
                      </p>
                      <p className="text-gray-600">{order.shippingAddress.country}</p>
                      <p className="text-gray-600">{order.shippingAddress.phone}</p>
                    </div>
                  </CardContent>
                </Card>

                {/* Action Buttons */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.8 }}
                  className="space-y-3"
                >
                  <Button
                    onClick={() => router.push('/profile')}
                    className="w-full bg-amber-950 text-white hover:bg-amber-800 transition-all py-6"
                  >
                    <Receipt className="w-5 h-5 mr-3" />
                    View Order History
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push('/shop')}
                    className="w-full border-amber-950 text-amber-950 hover:bg-amber-950 hover:text-white transition-all py-4"
                  >
                    <ShoppingBag className="w-4 h-4 mr-2" />
                    Continue Shopping
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={() => router.push('/')}
                    className="w-full border-gray-300 text-gray-600 hover:bg-gray-50 transition-all py-4"
                  >
                    <Home className="w-4 h-4 mr-2" />
                    Back to Home
                  </Button>
                </motion.div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-[#F1EFEE] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-amber-950 mx-auto mb-4"></div>
          <p className="text-amber-950 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <OrderSuccessContent />
    </Suspense>
  )
} 
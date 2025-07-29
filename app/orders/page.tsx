"use client"

import { motion } from "framer-motion"
import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { 
  Package, 
  Truck, 
  CheckCircle, 
  Calendar, 
  CreditCard, 
  ArrowLeft,
  Eye,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  X,
  AlertTriangle
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import Header from "@/components/header"
import PageTransition from "@/components/page-transition"
import Loader from "@/components/loader"
import { Order } from "@/types/order"
import { useToast } from "@/hooks/use-toast"

export default function OrderHistoryPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const { toast } = useToast()
  
  const [orders, setOrders] = useState<Order[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [currentPage, setCurrentPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 5,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false
  })

  // Cancellation state
  const [selectedOrderForCancel, setSelectedOrderForCancel] = useState<Order | null>(null)
  const [cancelDialogOpen, setCancelDialogOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState("")
  const [isCancelling, setIsCancelling] = useState(false)

  useEffect(() => {
    if (status === 'loading') return
    
    if (!session) {
      router.push('/auth/signin')
      return
    }

    fetchOrders()
  }, [session, status, router, currentPage])

  const fetchOrders = async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/orders?page=${currentPage}&limit=5`)
      if (response.ok) {
        const data = await response.json()
        setOrders(data.orders)
        setPagination(data.pagination)
      } else {
        console.error('Failed to fetch orders')
      }
    } catch (error) {
      console.error('Error fetching orders:', error)
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
      case 'pending': return 'bg-yellow-100 text-yellow-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'confirmed': return <CheckCircle className="w-4 h-4" />
      case 'processing': return <Package className="w-4 h-4" />
      case 'shipped': return <Truck className="w-4 h-4" />
      case 'delivered': return <CheckCircle className="w-4 h-4" />
      case 'cancelled': return <X className="w-4 h-4" />
      default: return <Package className="w-4 h-4" />
    }
  }

  const canCancelOrder = (order: Order) => {
    // Cannot cancel if already cancelled, shipped, or delivered
    if (['cancelled', 'shipped', 'delivered'].includes(order.status)) {
      return { canCancel: false, reason: 'Order cannot be cancelled' }
    }

    // Check delivery date - must be 3+ days ahead
    if (order.estimatedDelivery) {
      const today = new Date()
      const deliveryDate = new Date(order.estimatedDelivery)
      const daysDifference = Math.ceil((deliveryDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
      
      if (daysDifference < 3) {
        return { 
          canCancel: false, 
          reason: `Delivery is only ${daysDifference} day${daysDifference !== 1 ? 's' : ''} away` 
        }
      }
      
      return { 
        canCancel: true, 
        reason: `${daysDifference} days until delivery` 
      }
    }

    // If no delivery date set, allow cancellation for pending/confirmed orders
    return { 
      canCancel: ['pending', 'confirmed'].includes(order.status), 
      reason: order.status === 'processing' ? 'Order is being processed' : 'Available for cancellation' 
    }
  }

  const handleCancelOrder = async () => {
    if (!selectedOrderForCancel) return

    setIsCancelling(true)
    try {
      const response = await fetch(`/api/orders/${selectedOrderForCancel.orderId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reason: cancelReason || 'Customer requested cancellation'
        }),
      })

      const data = await response.json()

      if (data.success) {
        toast({
          title: "Order Cancelled Successfully",
          description: "Refund will be processed within 5-7 business days",
        })
        
        // Refresh orders list
        await fetchOrders()
        
        // Close dialog and reset state
        setCancelDialogOpen(false)
        setSelectedOrderForCancel(null)
        setCancelReason("")
      } else {
        toast({
          title: "Cancellation Failed",
          description: data.error || "Failed to cancel order",
          variant: "destructive"
        })
      }
    } catch (error) {
      console.error('Error cancelling order:', error)
      toast({
        title: "Error",
        description: "Something went wrong. Please try again.",
        variant: "destructive"
      })
    } finally {
      setIsCancelling(false)
    }
  }

  const filteredOrders = orders.filter(order => {
    const matchesSearch = order.orderId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         order.items.some(item => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesStatus = statusFilter === "all" || order.status === statusFilter
    return matchesSearch && matchesStatus
  })

  if (status === 'loading' || isLoading) {
    return (
      <PageTransition>
        <Loader />
      </PageTransition>
    )
  }

  if (!session) {
    return null
  }

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F1EFEE]">
        {/* Header */}
        <div className="relative bg-white shadow-sm">
          <Header />
        </div>

        <div className="pt-20 pb-12">
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Back Navigation */}
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-8"
            >
              <Button
                variant="ghost"
                onClick={() => router.back()}
                className="flex items-center gap-2 text-blue-950 hover:text-blue-800 hover:bg-white transition-all rounded-lg px-4 py-2"
              >
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
            </motion.div>

            {/* Page Header */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-blue-950 mb-2">Order History</h1>
              <p className="text-gray-600">Track and manage all your orders</p>
            </motion.div>

            {/* Filters */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="mb-6"
            >
              <Card className="bg-white shadow-sm border border-gray-200">
                <CardContent className="p-4">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                      <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                        <Input
                          placeholder="Search by order ID or product name..."
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                    </div>
                    <div className="md:w-48">
                      <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger>
                          <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="confirmed">Confirmed</SelectItem>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="shipped">Shipped</SelectItem>
                          <SelectItem value="delivered">Delivered</SelectItem>
                          <SelectItem value="cancelled">Cancelled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>

            {/* Orders List */}
            <div className="space-y-6">
              {filteredOrders.length === 0 ? (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                >
                  <Card className="bg-white shadow-lg border border-gray-200">
                    <CardContent className="p-12 text-center">
                      <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-600 mb-2">No Orders Found</h3>
                      <p className="text-gray-500 mb-6">
                        {searchTerm || statusFilter !== "all" 
                          ? "Try adjusting your search or filter criteria."
                          : "You haven't placed any orders yet."
                        }
                      </p>
                      <Button 
                        onClick={() => router.push('/shop')}
                        className="bg-blue-950 text-white hover:bg-blue-800"
                      >
                        Start Shopping
                      </Button>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                filteredOrders.map((order, index) => {
                  const cancellationInfo = canCancelOrder(order)
                  
                  return (
                    <motion.div
                      key={order.orderId}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + (index * 0.1) }}
                    >
                      <Card className={`bg-white shadow-lg border transition-shadow hover:shadow-xl ${
                        order.status === 'cancelled' ? 'border-red-200 bg-red-50' : 'border-gray-200'
                      }`}>
                        <CardHeader className={`${
                          order.status === 'cancelled' ? 'bg-red-50' : 'bg-white'
                        } border-b border-gray-200`}>
                          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div>
                              <CardTitle className="text-xl font-bold text-blue-950 mb-2">
                                Order #{order.orderId}
                                {order.status === 'cancelled' && (
                                  <Badge className="ml-2 bg-red-500 text-white">
                                    <X className="w-3 h-3 mr-1" />
                                    CANCELLED
                                  </Badge>
                                )}
                              </CardTitle>
                              <div className="flex items-center gap-4 text-sm text-gray-600">
                                <div className="flex items-center">
                                  <Calendar className="w-4 h-4 mr-1" />
                                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                    year: 'numeric',
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </div>
                                <div className="flex items-center">
                                  <CreditCard className="w-4 h-4 mr-1" />
                                  ₹{order.orderSummary.total.toFixed(2)}
                                </div>
                                <div className="flex items-center">
                                  <Package className="w-4 h-4 mr-1" />
                                  {order.items.length} item{order.items.length > 1 ? 's' : ''}
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge className={`${getStatusColor(order.status)} text-sm px-3 py-1`}>
                                {getStatusIcon(order.status)}
                                <span className="ml-2 capitalize">{order.status}</span>
                              </Badge>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => router.push(`/order-success?orderId=${order.orderId}`)}
                                className="border-blue-950 text-blue-950 hover:bg-blue-950 hover:text-white"
                              >
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </Button>
                              {cancellationInfo.canCancel && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    setSelectedOrderForCancel(order)
                                    setCancelDialogOpen(true)
                                  }}
                                  className="border-red-500 text-red-600 hover:bg-red-50 hover:text-red-700"
                                >
                                  <X className="w-4 h-4 mr-2" />
                                  Cancel Order
                                </Button>
                              )}
                            </div>
                          </div>
                        </CardHeader>
                        <CardContent className="p-6">
                          <div className="space-y-4">
                            {/* Order Items Preview */}
                            <div>
                              <h4 className="font-medium text-gray-900 mb-3">Items in this order:</h4>
                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                {order.items.slice(0, 3).map((item, itemIndex) => (
                                  <div
                                    key={`${item.id}-${item.selectedSize}-${item.selectedColor}`}
                                    className="flex gap-3 p-3 border border-gray-200 rounded-lg"
                                  >
                                    <div className="relative w-12 h-16 rounded overflow-hidden bg-gray-100">
                                      <Image
                                        src={item.image}
                                        alt={item.name}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <h5 className="font-medium text-sm text-gray-900 truncate">{item.name}</h5>
                                      <p className="text-xs text-gray-600">
                                        {item.selectedColor} • {item.selectedSize}
                                      </p>
                                      <div className="flex justify-between items-center mt-1">
                                        <span className="text-xs text-gray-600">Qty: {item.quantity}</span>
                                        <span className="text-sm font-medium">₹{item.subtotal.toFixed(2)}</span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                                {order.items.length > 3 && (
                                  <div className="flex items-center justify-center p-3 border border-gray-200 rounded-lg bg-gray-50">
                                    <span className="text-sm text-gray-600">
                                      +{order.items.length - 3} more item{order.items.length - 3 > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>

                            {/* Delivery Information */}
                            {order.estimatedDelivery && (
                              <div className={`p-4 rounded-lg ${
                                order.status === 'cancelled' ? 'bg-red-100' : 'bg-amber-50'
                              }`}>
                                <div className="flex items-center">
                                  <Truck className={`w-5 h-5 mr-2 ${
                                    order.status === 'cancelled' ? 'text-red-700' : 'text-blue-700'
                                  }`} />
                                  <span className={`font-medium ${
                                    order.status === 'cancelled' ? 'text-red-900' : 'text-blue-900'
                                  }`}>
                                    {order.status === 'delivered' ? 'Delivered on' : 
                                     order.status === 'cancelled' ? 'Was scheduled for' : 
                                     'Estimated delivery'}:
                                  </span>
                                  <span className={`ml-2 ${
                                    order.status === 'cancelled' ? 'text-red-800' : 'text-blue-800'
                                  }`}>
                                    {new Date(order.estimatedDelivery).toLocaleDateString('en-IN', {
                                      weekday: 'short',
                                      month: 'short',
                                      day: 'numeric'
                                    })}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Cancellation Info */}
                            {order.status !== 'cancelled' && !cancellationInfo.canCancel && (
                              <div className="bg-gray-100 p-3 rounded-lg">
                                <div className="flex items-center">
                                  <AlertTriangle className="w-4 h-4 text-gray-600 mr-2" />
                                  <span className="text-sm text-gray-700">
                                    {cancellationInfo.reason}
                                  </span>
                                </div>
                              </div>
                            )}

                            {/* Cancellation Details for cancelled orders */}
                            {order.status === 'cancelled' && (order as any).refundDetails && (
                              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                                <h5 className="font-medium text-red-900 mb-2">Refund Information</h5>
                                <div className="space-y-1 text-sm text-red-800">
                                  <p>Refund ID: {(order as any).refundDetails.refund_id}</p>
                                  <p>Amount: ₹{(order as any).refundDetails.amount}</p>
                                  <p>Status: {(order as any).refundDetails.status}</p>
                                  <p className="text-xs text-red-600 mt-2">
                                    Refund will be processed within 5-7 business days
                                  </p>
                                </div>
                              </div>
                            )}

                            {/* Shipping Address */}
                            <div className="text-sm text-gray-600">
                              <strong>Shipping to:</strong> {order.shippingAddress.firstName} {order.shippingAddress.lastName}, {order.shippingAddress.city}, {order.shippingAddress.state}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </motion.div>
                  )
                })
              )}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-8"
              >
                <Card className="bg-white shadow-sm border border-gray-200">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        Showing {((pagination.page - 1) * pagination.limit) + 1} to {Math.min(pagination.page * pagination.limit, pagination.total)} of {pagination.total} orders
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                          disabled={!pagination.hasPrev}
                          className="border-gray-300"
                        >
                          <ChevronLeft className="w-4 h-4" />
                          Previous
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setCurrentPage(prev => prev + 1)}
                          disabled={!pagination.hasNext}
                          className="border-gray-300"
                        >
                          Next
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </div>
        </div>

        {/* Cancel Order Dialog */}
        <Dialog open={cancelDialogOpen} onOpenChange={setCancelDialogOpen}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold text-red-700">
                Cancel Order #{selectedOrderForCancel?.orderId}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 mt-6">
              <div className="bg-red-50 p-4 rounded-lg border border-red-200">
                <div className="flex items-start">
                  <AlertTriangle className="w-5 h-5 text-red-600 mr-2 mt-0.5" />
                  <div className="text-sm">
                    <p className="font-medium text-red-900 mb-1">Order Cancellation</p>
                    <p className="text-red-700">
                      This action will cancel your order and initiate a full refund. 
                      The refund will be processed within 5-7 business days to your original payment method.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <Label htmlFor="cancelReason" className="text-sm font-medium text-gray-700">
                  Reason for cancellation (Optional)
                </Label>
                <Textarea
                  id="cancelReason"
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="Please tell us why you're cancelling this order..."
                  className="mt-1"
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setCancelDialogOpen(false)
                    setSelectedOrderForCancel(null)
                    setCancelReason("")
                  }}
                  className="flex-1"
                  disabled={isCancelling}
                >
                  Keep Order
                </Button>
                <Button
                  onClick={handleCancelOrder}
                  className="flex-1 bg-red-600 text-white hover:bg-red-700"
                  disabled={isCancelling}
                >
                  {isCancelling ? 'Cancelling...' : 'Cancel Order'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PageTransition>
  )
} 
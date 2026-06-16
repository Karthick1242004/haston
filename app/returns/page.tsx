"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import { motion } from "framer-motion"
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Package,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Header from "@/components/header"
import PageTransition from "@/components/page-transition"
import Loader from "@/components/loader"
import type { Return, ReturnStatus } from "@/types/return"

const STATUS_LABEL: Record<ReturnStatus, string> = {
  requested: "Awaiting review",
  approved: "Approved",
  rejected: "Rejected",
  refunded: "Refunded",
}

function statusColor(status: ReturnStatus) {
  switch (status) {
    case "requested":
      return "bg-yellow-100 text-yellow-800"
    case "approved":
      return "bg-blue-100 text-blue-800"
    case "rejected":
      return "bg-red-100 text-red-800"
    case "refunded":
      return "bg-green-100 text-green-800"
  }
}

function statusIcon(status: ReturnStatus) {
  switch (status) {
    case "requested":
      return <Clock className="w-4 h-4" />
    case "approved":
      return <CheckCircle className="w-4 h-4" />
    case "rejected":
      return <XCircle className="w-4 h-4" />
    case "refunded":
      return <CreditCard className="w-4 h-4" />
  }
}

export default function ReturnsPage() {
  const router = useRouter()
  const { data: session, status } = useSession()
  const [returns, setReturns] = useState<Return[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  useEffect(() => {
    if (status === "loading") return
    if (!session) {
      router.push("/auth/signin")
      return
    }
    fetchReturns()
  }, [session, status, router, page])

  const fetchReturns = async () => {
    try {
      setIsLoading(true)
      const res = await fetch(`/api/returns?page=${page}&limit=10`)
      if (res.ok) {
        const data = await res.json()
        setReturns(data.returns)
        setPagination(data.pagination)
      }
    } catch (err) {
      console.error("Failed to fetch returns", err)
    } finally {
      setIsLoading(false)
    }
  }

  if (status === "loading" || isLoading) {
    return (
      <PageTransition>
        <Loader />
      </PageTransition>
    )
  }

  if (!session) return null

  return (
    <PageTransition>
      <div className="min-h-screen bg-[#F1EFEE]">
        <div className="relative bg-white shadow-sm">
          <Header />
        </div>

        <div className="pt-20 pb-12">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
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

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-8"
            >
              <h1 className="text-3xl font-bold text-blue-950 mb-2 flex items-center gap-3">
                <RotateCcw className="w-8 h-8" />
                My Returns
              </h1>
              <p className="text-gray-600">
                Track the status of your return and refund requests
              </p>
            </motion.div>

            {returns.length === 0 ? (
              <Card className="bg-white shadow-lg border border-gray-200">
                <CardContent className="p-12 text-center">
                  <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-600 mb-2">
                    No return requests yet
                  </h3>
                  <p className="text-gray-500 mb-6">
                    When you request a return from your order history, it will
                    show up here.
                  </p>
                  <Button
                    onClick={() => router.push("/orders")}
                    className="bg-blue-950 text-white hover:bg-blue-800"
                  >
                    Go to Order History
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-6">
                {returns.map((ret, idx) => (
                  <motion.div
                    key={ret.returnId}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx }}
                  >
                    <Card className="bg-white shadow-lg border border-gray-200">
                      <CardHeader className="bg-white border-b border-gray-200">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                          <div>
                            <CardTitle className="text-lg font-bold text-blue-950">
                              Return #{ret.returnId}
                            </CardTitle>
                            <div className="flex items-center flex-wrap gap-3 text-sm text-gray-600 mt-1">
                              <span className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                {new Date(ret.requestedAt).toLocaleDateString(
                                  "en-IN",
                                  { day: "numeric", month: "short", year: "numeric" }
                                )}
                              </span>
                              <button
                                onClick={() =>
                                  router.push(`/order-success?orderId=${ret.orderId}`)
                                }
                                className="text-blue-700 hover:underline"
                              >
                                Order #{ret.orderId}
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            <Badge
                              className={`${statusColor(ret.status)} text-sm px-3 py-1 capitalize`}
                            >
                              {statusIcon(ret.status)}
                              <span className="ml-2">
                                {STATUS_LABEL[ret.status]}
                              </span>
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="p-6 space-y-4">
                        <div>
                          <h4 className="font-medium text-gray-900 mb-2 text-sm">
                            Returning ({ret.items.length} item
                            {ret.items.length !== 1 ? "s" : ""})
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            {ret.items.map((item, i) => (
                              <div
                                key={`${item.productId}-${item.selectedSize}-${item.selectedColor}-${i}`}
                                className="flex gap-3 p-3 border border-gray-200 rounded-lg"
                              >
                                <div className="relative w-12 h-16 rounded overflow-hidden bg-gray-100 flex-shrink-0">
                                  <Image
                                    src={item.image || "/placeholder.jpg"}
                                    alt={item.name}
                                    fill
                                    className="object-cover"
                                    sizes="48px"
                                    quality={70}
                                  />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <h5 className="font-medium text-sm text-gray-900 truncate">
                                    {item.name}
                                  </h5>
                                  <p className="text-xs text-gray-600">
                                    {item.selectedColor} • {item.selectedSize}
                                  </p>
                                  <div className="flex justify-between items-center mt-1">
                                    <span className="text-xs text-gray-600">
                                      Qty: {item.quantity}
                                    </span>
                                    <span className="text-sm font-medium">
                                      ₹{item.subtotal.toFixed(2)}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-500">Reason</p>
                            <p className="font-medium text-gray-900">{ret.reason}</p>
                            {ret.additionalNotes && (
                              <p className="text-gray-600 mt-1 italic">
                                &ldquo;{ret.additionalNotes}&rdquo;
                              </p>
                            )}
                          </div>
                          <div>
                            <p className="text-gray-500">Refund amount</p>
                            <p className="text-xl font-bold text-gray-900">
                              ₹{ret.refundAmount.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        {ret.status === "rejected" && ret.rejectionReason && (
                          <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm">
                            <p className="font-medium text-red-900 mb-1">
                              Reason for rejection
                            </p>
                            <p className="text-red-800">{ret.rejectionReason}</p>
                          </div>
                        )}

                        {ret.status === "refunded" && ret.refundDetails && (
                          <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm">
                            <p className="font-medium text-green-900 mb-1">
                              Refund processed
                            </p>
                            <p className="text-green-800">
                              ID: {ret.refundDetails.refund_id} • Status:{" "}
                              {ret.refundDetails.status} • ₹
                              {ret.refundDetails.amount.toFixed(2)}
                            </p>
                            <p className="text-xs text-green-700 mt-1">
                              Funds will reflect in 5-7 business days on your
                              original payment method.
                            </p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {pagination.totalPages > 1 && (
              <div className="mt-8 flex items-center justify-between">
                <div className="text-sm text-gray-600">
                  Showing {(pagination.page - 1) * pagination.limit + 1}–
                  {Math.min(pagination.page * pagination.limit, pagination.total)}{" "}
                  of {pagination.total}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={!pagination.hasPrev}
                  >
                    <ChevronLeft className="w-4 h-4" />
                    Previous
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => p + 1)}
                    disabled={!pagination.hasNext}
                  >
                    Next
                    <ChevronRight className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </PageTransition>
  )
}

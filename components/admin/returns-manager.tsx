"use client"

import { useState, useEffect } from "react"
import Image from "next/image"
import {
  Package,
  Search,
  RotateCcw,
  Clock,
  CheckCircle,
  XCircle,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Eye,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import type { Return, ReturnStatus } from "@/types/return"

interface AdminReturnsStats {
  total: number
  requested: number
  approved: number
  rejected: number
  refunded: number
}

const STATUS_LABEL: Record<ReturnStatus, string> = {
  requested: "Requested",
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

export default function ReturnsManager() {
  const { toast } = useToast()
  const [returns, setReturns] = useState<Return[]>([])
  const [stats, setStats] = useState<AdminReturnsStats>({
    total: 0,
    requested: 0,
    approved: 0,
    rejected: 0,
    refunded: 0,
  })
  const [isLoading, setIsLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState<string>("all")
  const [page, setPage] = useState(1)
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  })

  const [selected, setSelected] = useState<Return | null>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [adminNotes, setAdminNotes] = useState("")
  const [isUpdating, setIsUpdating] = useState(false)

  useEffect(() => {
    fetchReturns()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, statusFilter, search])

  const fetchReturns = async () => {
    try {
      setIsLoading(true)
      const params = new URLSearchParams({
        page: String(page),
        limit: "10",
      })
      if (statusFilter !== "all") params.set("status", statusFilter)
      if (search.trim()) params.set("search", search.trim())
      const res = await fetch(`/api/admin/returns?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setReturns(data.returns)
        setPagination(data.pagination)
        setStats(data.stats)
      }
    } catch (err) {
      console.error("Failed to load returns", err)
    } finally {
      setIsLoading(false)
    }
  }

  const openDetail = (ret: Return) => {
    setSelected(ret)
    setAdminNotes(ret.adminNotes || "")
    setRejectionReason(ret.rejectionReason || "")
    setModalOpen(true)
  }

  const updateStatus = async (next: ReturnStatus) => {
    if (!selected) return
    if (next === "rejected" && !rejectionReason.trim()) {
      toast({
        title: "Rejection reason required",
        description: "Please add a reason before rejecting.",
        variant: "destructive",
      })
      return
    }
    setIsUpdating(true)
    try {
      const res = await fetch(`/api/admin/returns/${selected.returnId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: next,
          rejectionReason: next === "rejected" ? rejectionReason : undefined,
          adminNotes,
        }),
      })
      const data = await res.json()
      if (res.ok && data.success) {
        const label =
          next === "refunded"
            ? "Refund initiated"
            : `Return ${next}`
        toast({ title: label, description: data.message })
        setModalOpen(false)
        setSelected(null)
        await fetchReturns()
      } else {
        toast({
          title: "Update failed",
          description: data.error || "Try again.",
          variant: "destructive",
        })
      }
    } catch (err) {
      console.error("Return update error", err)
      toast({
        title: "Error",
        description: "Could not update return.",
        variant: "destructive",
      })
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-blue-950 mb-2">Returns</h2>
        <p className="text-gray-600">
          Review return requests, approve or reject, and process refunds
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Total", value: stats.total, color: "bg-blue-50 text-blue-900" },
          { label: "Pending review", value: stats.requested, color: "bg-yellow-50 text-yellow-900" },
          { label: "Approved", value: stats.approved, color: "bg-blue-50 text-blue-900" },
          { label: "Refunded", value: stats.refunded, color: "bg-green-50 text-green-900" },
        ].map((s) => (
          <Card key={s.label} className={`${s.color} border-0`}>
            <CardContent className="p-4">
              <p className="text-sm font-medium">{s.label}</p>
              <p className="text-2xl font-bold mt-1">{s.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filter */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
              <Input
                placeholder="Search return ID, order ID, customer email…"
                value={search}
                onChange={(e) => {
                  setPage(1)
                  setSearch(e.target.value)
                }}
                className="pl-10"
              />
            </div>
            <div className="md:w-48">
              <Select
                value={statusFilter}
                onValueChange={(v) => {
                  setPage(1)
                  setStatusFilter(v)
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="requested">Requested</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="refunded">Refunded</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* List */}
      {isLoading ? (
        <Card>
          <CardContent className="p-12 text-center text-gray-500">
            Loading returns…
          </CardContent>
        </Card>
      ) : returns.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-600 mb-1">
              No return requests
            </h3>
            <p className="text-gray-500">
              When customers submit returns, they will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {returns.map((ret) => (
            <Card key={ret.returnId} className="hover:shadow-md transition-shadow">
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center flex-wrap gap-2 mb-1">
                      <span className="font-mono text-sm font-semibold text-blue-950">
                        #{ret.returnId}
                      </span>
                      <Badge className={`${statusColor(ret.status)} text-xs`}>
                        {statusIcon(ret.status)}
                        <span className="ml-1.5 capitalize">
                          {STATUS_LABEL[ret.status]}
                        </span>
                      </Badge>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm text-gray-600">
                      <div>
                        <span className="text-gray-400">Order:</span>{" "}
                        <span className="font-medium">#{ret.orderId}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Customer:</span>{" "}
                        <span className="font-medium truncate">{ret.userEmail}</span>
                      </div>
                      <div>
                        <span className="text-gray-400">Refund:</span>{" "}
                        <span className="font-medium">
                          ₹{ret.refundAmount.toFixed(2)}
                        </span>
                      </div>
                    </div>
                    <div className="text-xs text-gray-500 mt-1">
                      Reason: <span className="text-gray-700">{ret.reason}</span>{" "}
                      • Requested{" "}
                      {new Date(ret.requestedAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => openDetail(ret)}
                    className="border-blue-950 text-blue-950 hover:bg-blue-950 hover:text-white flex-shrink-0"
                  >
                    <Eye className="w-4 h-4 mr-1.5" />
                    Manage
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Page {pagination.page} of {pagination.totalPages}
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={!pagination.hasPrev}
            >
              <ChevronLeft className="w-4 h-4" />
              Prev
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

      {/* Detail modal */}
      <Dialog
        open={modalOpen}
        onOpenChange={(o) => {
          setModalOpen(o)
          if (!o) setSelected(null)
        }}
      >
        <DialogContent className="w-[calc(100vw-2rem)] sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-blue-950 flex items-center gap-2">
              <RotateCcw className="w-5 h-5" />
              {selected ? `Return #${selected.returnId}` : "Return"}
            </DialogTitle>
          </DialogHeader>
          {selected && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-gray-500">Order</p>
                  <p className="font-medium">#{selected.orderId}</p>
                </div>
                <div>
                  <p className="text-gray-500">Status</p>
                  <Badge className={`${statusColor(selected.status)} text-xs mt-0.5`}>
                    {statusIcon(selected.status)}
                    <span className="ml-1.5 capitalize">
                      {STATUS_LABEL[selected.status]}
                    </span>
                  </Badge>
                </div>
                <div>
                  <p className="text-gray-500">Customer</p>
                  <p className="font-medium">{selected.userEmail}</p>
                </div>
                <div>
                  <p className="text-gray-500">Requested</p>
                  <p className="font-medium">
                    {new Date(selected.requestedAt).toLocaleString("en-IN")}
                  </p>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500 mb-2">Items requested for return</p>
                <div className="space-y-2">
                  {selected.items.map((item, i) => (
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
                        <p className="font-medium text-sm text-gray-900 truncate">
                          {item.name}
                        </p>
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
                <div className="flex justify-between items-center mt-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-700">
                    Refund amount
                  </span>
                  <span className="text-lg font-bold text-gray-900">
                    ₹{selected.refundAmount.toFixed(2)}
                  </span>
                </div>
              </div>

              <div>
                <p className="text-sm text-gray-500">Customer reason</p>
                <p className="text-sm text-gray-900 font-medium">{selected.reason}</p>
                {selected.additionalNotes && (
                  <p className="text-sm text-gray-700 italic mt-1">
                    &ldquo;{selected.additionalNotes}&rdquo;
                  </p>
                )}
              </div>

              {selected.status === "rejected" && selected.rejectionReason && (
                <div className="bg-red-50 border border-red-200 p-3 rounded-lg text-sm">
                  <p className="font-medium text-red-900 mb-1">Rejected</p>
                  <p className="text-red-800">{selected.rejectionReason}</p>
                </div>
              )}

              {selected.status === "refunded" && selected.refundDetails && (
                <div className="bg-green-50 border border-green-200 p-3 rounded-lg text-sm">
                  <p className="font-medium text-green-900 mb-1">Refund processed</p>
                  <p className="text-green-800">
                    ID: {selected.refundDetails.refund_id} • Status:{" "}
                    {selected.refundDetails.status} • ₹
                    {selected.refundDetails.amount.toFixed(2)}
                  </p>
                </div>
              )}

              {/* Admin notes (editable while status not terminal) */}
              <div>
                <Label htmlFor="adminNotes" className="text-sm font-medium text-gray-700">
                  Admin notes (internal)
                </Label>
                <Textarea
                  id="adminNotes"
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Notes for your team…"
                  rows={2}
                  className="mt-1"
                  disabled={isUpdating}
                />
              </div>

              {/* Actions based on status */}
              {selected.status === "requested" && (
                <div className="space-y-2">
                  <div>
                    <Label
                      htmlFor="rejectReason"
                      className="text-sm font-medium text-gray-700"
                    >
                      Rejection reason (only if rejecting)
                    </Label>
                    <Textarea
                      id="rejectReason"
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      placeholder="e.g. Item past return window, evidence of use…"
                      rows={2}
                      className="mt-1"
                      disabled={isUpdating}
                    />
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2 pt-2">
                    <Button
                      onClick={() => updateStatus("rejected")}
                      variant="outline"
                      className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                      disabled={isUpdating}
                    >
                      <XCircle className="w-4 h-4 mr-2" />
                      Reject
                    </Button>
                    <Button
                      onClick={() => updateStatus("approved")}
                      className="flex-1 bg-blue-950 text-white hover:bg-blue-800"
                      disabled={isUpdating}
                    >
                      <CheckCircle className="w-4 h-4 mr-2" />
                      Approve
                    </Button>
                  </div>
                </div>
              )}

              {selected.status === "approved" && (
                <div className="flex flex-col sm:flex-row gap-2 pt-2">
                  <Button
                    onClick={() => updateStatus("rejected")}
                    variant="outline"
                    className="flex-1 border-red-500 text-red-600 hover:bg-red-50"
                    disabled={isUpdating}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                  <Button
                    onClick={() => updateStatus("refunded")}
                    className="flex-1 bg-green-600 text-white hover:bg-green-700"
                    disabled={isUpdating}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    {isUpdating ? "Processing…" : "Mark refunded & issue refund"}
                  </Button>
                </div>
              )}

              {(selected.status === "rejected" ||
                selected.status === "refunded") && (
                <div className="flex justify-end pt-2">
                  <Button
                    variant="outline"
                    onClick={() => setModalOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

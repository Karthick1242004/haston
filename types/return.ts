import type { RefundDetails } from "@/types/order"

export type ReturnStatus = "requested" | "approved" | "rejected" | "refunded"

export interface ReturnItem {
  productId: string
  name: string
  image: string
  price: number
  quantity: number
  selectedSize: string
  selectedColor: string
  subtotal: number
}

export interface Return {
  _id?: string
  returnId: string
  orderId: string
  userId: string
  userEmail: string
  items: ReturnItem[]
  reason: string
  additionalNotes?: string
  status: ReturnStatus
  refundAmount: number
  refundDetails?: RefundDetails
  rejectionReason?: string
  adminNotes?: string
  requestedAt: Date
  approvedAt?: Date
  rejectedAt?: Date
  refundedAt?: Date
  updatedAt: Date
}

export interface ServerReturn {
  _id?: import("mongodb").ObjectId
  returnId: string
  orderId: string
  userId: string
  userEmail: string
  items: ReturnItem[]
  reason: string
  additionalNotes?: string
  status: ReturnStatus
  refundAmount: number
  refundDetails?: RefundDetails
  rejectionReason?: string
  adminNotes?: string
  requestedAt: Date
  approvedAt?: Date
  rejectedAt?: Date
  refundedAt?: Date
  updatedAt: Date
}

export const RETURN_WINDOW_DAYS = 7

export const RETURN_REASONS = [
  "Wrong size",
  "Damaged or defective",
  "Not as described",
  "Quality issue",
  "Changed my mind",
  "Other",
] as const

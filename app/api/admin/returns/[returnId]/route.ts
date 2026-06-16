import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { isAdminEmail } from "@/lib/isAdmin"
import { getOrdersCollection, getReturnsCollection } from "@/lib/mongodb"
import type { ServerOrder, RefundDetails } from "@/types/order"
import type { ServerReturn, ReturnStatus } from "@/types/return"
import Razorpay from "razorpay"

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
})

const VALID_TRANSITIONS: Record<ReturnStatus, ReturnStatus[]> = {
  requested: ["approved", "rejected"],
  approved: ["refunded", "rejected"],
  rejected: [],
  refunded: [],
}

export async function GET(
  request: NextRequest,
  { params }: { params: { returnId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !(await isAdminEmail(session.user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const collection = await getReturnsCollection()
    const ret = (await collection.findOne({
      returnId: params.returnId,
    })) as ServerReturn | null

    if (!ret) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 })
    }

    return NextResponse.json({
      return: { ...ret, _id: ret._id?.toString() },
    })
  } catch (error) {
    console.error("Admin return fetch error:", error)
    return NextResponse.json(
      { error: "Failed to fetch return" },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { returnId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !(await isAdminEmail(session.user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const body = await request.json()
    const { status, rejectionReason, adminNotes } = body as {
      status?: ReturnStatus
      rejectionReason?: string
      adminNotes?: string
    }

    if (!status) {
      return NextResponse.json(
        { error: "status is required" },
        { status: 400 }
      )
    }

    const collection = await getReturnsCollection()
    const ret = (await collection.findOne({
      returnId: params.returnId,
    })) as ServerReturn | null

    if (!ret) {
      return NextResponse.json({ error: "Return not found" }, { status: 404 })
    }

    const allowed = VALID_TRANSITIONS[ret.status] || []
    if (!allowed.includes(status)) {
      return NextResponse.json(
        {
          error: `Cannot move return from "${ret.status}" to "${status}"`,
        },
        { status: 400 }
      )
    }

    const now = new Date()
    const updates: Partial<ServerReturn> = {
      status,
      updatedAt: now,
    }
    if (typeof adminNotes === "string") updates.adminNotes = adminNotes.trim()

    if (status === "approved") {
      updates.approvedAt = now
    } else if (status === "rejected") {
      updates.rejectedAt = now
      if (rejectionReason && typeof rejectionReason === "string") {
        updates.rejectionReason = rejectionReason.trim()
      }
    } else if (status === "refunded") {
      // Process Razorpay partial refund using the original order's payment.
      const ordersCollection = await getOrdersCollection()
      const order = (await ordersCollection.findOne({
        orderId: ret.orderId,
      })) as ServerOrder | null

      let refundDetails: RefundDetails | undefined

      if (
        order?.paymentDetails?.razorpay_payment_id &&
        order.paymentDetails.status === "success" &&
        order.paymentDetails.razorpay_payment_id.startsWith("pay_")
      ) {
        try {
          const refundAmountPaise = Math.round(ret.refundAmount * 100)
          const refund = await razorpay.payments.refund(
            order.paymentDetails.razorpay_payment_id,
            {
              amount: refundAmountPaise,
              speed: "normal" as const,
              notes: {
                reason: "Return refund",
                order_id: ret.orderId,
                return_id: ret.returnId,
                refunded_at: now.toISOString(),
              },
              receipt: `return_${ret.returnId}_${Date.now()}`,
            }
          )

          refundDetails = {
            refund_id: refund.id,
            amount: refund.amount ? refund.amount / 100 : ret.refundAmount,
            status: refund.status,
            created_at: refund.created_at as unknown as Date,
            speed_processed: refund.speed_processed,
          }
        } catch (refundError: any) {
          console.error("Razorpay return refund error:", refundError)
          refundDetails = {
            refund_id: "manual_refund_required",
            amount: ret.refundAmount,
            status: "manual_processing_required",
            created_at: now,
          }
        }
      } else {
        refundDetails = {
          refund_id: "no_payment_to_refund",
          amount: ret.refundAmount,
          status: "no_refund_required",
          created_at: now,
        }
      }

      updates.refundDetails = refundDetails
      updates.refundedAt = now
    }

    await collection.updateOne(
      { returnId: params.returnId },
      { $set: updates }
    )

    const updated = (await collection.findOne({
      returnId: params.returnId,
    })) as ServerReturn | null

    return NextResponse.json({
      success: true,
      message: `Return ${status}`,
      return: updated
        ? { ...updated, _id: updated._id?.toString() }
        : null,
    })
  } catch (error) {
    console.error("Admin return update error:", error)
    return NextResponse.json(
      { error: "Failed to update return" },
      { status: 500 }
    )
  }
}

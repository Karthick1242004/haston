import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getOrdersCollection, getReturnsCollection } from "@/lib/mongodb"
import type { ServerOrder } from "@/types/order"
import type { ServerReturn, ReturnItem } from "@/types/return"
import { RETURN_WINDOW_DAYS } from "@/types/return"

interface IncomingReturnItem {
  productId: string
  selectedSize: string
  selectedColor: string
  quantity: number
}

export async function POST(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !session.user.id) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { orderId } = params
    const body = await request.json()
    const { items: incomingItems, reason, additionalNotes } = body as {
      items: IncomingReturnItem[]
      reason: string
      additionalNotes?: string
    }

    if (!Array.isArray(incomingItems) || incomingItems.length === 0) {
      return NextResponse.json(
        { error: "Select at least one item to return" },
        { status: 400 }
      )
    }
    if (!reason || typeof reason !== "string" || !reason.trim()) {
      return NextResponse.json(
        { error: "A return reason is required" },
        { status: 400 }
      )
    }

    const ordersCollection = await getOrdersCollection()
    const order = (await ordersCollection.findOne({
      orderId,
      userEmail: session.user.email,
    })) as ServerOrder | null

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 })
    }

    if (order.status !== "delivered") {
      return NextResponse.json(
        { error: "Only delivered orders are eligible for returns" },
        { status: 400 }
      )
    }

    // Enforce return window (based on estimatedDelivery)
    if (order.estimatedDelivery) {
      const deliveredOn = new Date(order.estimatedDelivery)
      const now = new Date()
      const daysSinceDelivery = Math.floor(
        (now.getTime() - deliveredOn.getTime()) / (1000 * 60 * 60 * 24)
      )
      if (daysSinceDelivery > RETURN_WINDOW_DAYS) {
        return NextResponse.json(
          {
            error: `Return window of ${RETURN_WINDOW_DAYS} days has passed (delivered ${daysSinceDelivery} days ago)`,
          },
          { status: 400 }
        )
      }
    }

    // Load existing active returns for this order to enforce per-item caps
    const returnsCollection = await getReturnsCollection()
    const activeReturns = (await returnsCollection
      .find({
        orderId,
        status: { $in: ["requested", "approved", "refunded"] },
      })
      .toArray()) as ServerReturn[]

    // Map of "id|size|color" -> quantity already returned
    const alreadyReturned = new Map<string, number>()
    for (const ret of activeReturns) {
      for (const item of ret.items) {
        const key = `${item.productId}|${item.selectedSize}|${item.selectedColor}`
        alreadyReturned.set(key, (alreadyReturned.get(key) || 0) + item.quantity)
      }
    }

    // Build sanitized return items by matching against order items
    const sanitizedItems: ReturnItem[] = []
    for (const incoming of incomingItems) {
      const qty = Number(incoming.quantity)
      if (!Number.isFinite(qty) || qty <= 0) {
        return NextResponse.json(
          { error: "Invalid quantity in return request" },
          { status: 400 }
        )
      }

      const orderItem = order.items.find(
        (oi) =>
          oi.id?.toString() === incoming.productId?.toString() &&
          oi.selectedSize === incoming.selectedSize &&
          oi.selectedColor === incoming.selectedColor
      )
      if (!orderItem) {
        return NextResponse.json(
          { error: "One of the items does not belong to this order" },
          { status: 400 }
        )
      }

      const key = `${orderItem.id}|${orderItem.selectedSize}|${orderItem.selectedColor}`
      const remaining = orderItem.quantity - (alreadyReturned.get(key) || 0)
      if (qty > remaining) {
        return NextResponse.json(
          {
            error: `Cannot return ${qty} of "${orderItem.name}" — only ${remaining} available to return`,
          },
          { status: 400 }
        )
      }

      sanitizedItems.push({
        productId: orderItem.id.toString(),
        name: orderItem.name,
        image: orderItem.image,
        price: orderItem.price,
        quantity: qty,
        selectedSize: orderItem.selectedSize,
        selectedColor: orderItem.selectedColor,
        subtotal: Number((orderItem.price * qty).toFixed(2)),
      })
    }

    const refundAmount = Number(
      sanitizedItems.reduce((sum, it) => sum + it.subtotal, 0).toFixed(2)
    )

    const now = new Date()
    const returnId = `RET-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`

    const newReturn: ServerReturn = {
      returnId,
      orderId,
      userId: session.user.id,
      userEmail: session.user.email,
      items: sanitizedItems,
      reason: reason.trim(),
      additionalNotes: additionalNotes?.toString().trim() || undefined,
      status: "requested",
      refundAmount,
      requestedAt: now,
      updatedAt: now,
    }

    const result = await returnsCollection.insertOne(newReturn)
    if (!result.insertedId) {
      return NextResponse.json(
        { error: "Failed to create return request" },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: "Return request submitted",
      return: {
        ...newReturn,
        _id: result.insertedId.toString(),
      },
    })
  } catch (error) {
    console.error("Return creation error:", error)
    return NextResponse.json(
      { error: "Failed to create return request" },
      { status: 500 }
    )
  }
}

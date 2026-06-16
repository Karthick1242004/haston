import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { getReturnsCollection } from "@/lib/mongodb"
import type { ServerReturn } from "@/types/return"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1)
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "10", 10), 1),
      50
    )
    const orderId = searchParams.get("orderId") || undefined

    const collection = await getReturnsCollection()

    const filter: Record<string, any> = { userEmail: session.user.email }
    if (orderId) filter.orderId = orderId

    const total = await collection.countDocuments(filter)
    const docs = (await collection
      .find(filter)
      .sort({ requestedAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()) as ServerReturn[]

    const returns = docs.map((d) => ({
      ...d,
      _id: d._id?.toString(),
    }))

    return NextResponse.json({
      returns,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasNext: page * limit < total,
        hasPrev: page > 1,
      },
    })
  } catch (error) {
    console.error("Returns list error:", error)
    return NextResponse.json(
      { error: "Failed to fetch returns" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { isAdminEmail } from "@/lib/isAdmin"
import { getReturnsCollection } from "@/lib/mongodb"
import type { ServerReturn } from "@/types/return"

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.email || !(await isAdminEmail(session.user.email))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const page = Math.max(parseInt(searchParams.get("page") || "1", 10), 1)
    const limit = Math.min(
      Math.max(parseInt(searchParams.get("limit") || "10", 10), 1),
      50
    )
    const status = searchParams.get("status") || undefined
    const search = (searchParams.get("search") || "").trim()
    const sortBy = searchParams.get("sortBy") || "requestedAt"
    const sortOrder = searchParams.get("sortOrder") === "asc" ? 1 : -1

    const collection = await getReturnsCollection()

    const filter: Record<string, any> = {}
    if (status && status !== "all") filter.status = status
    if (search) {
      filter.$or = [
        { returnId: { $regex: search, $options: "i" } },
        { orderId: { $regex: search, $options: "i" } },
        { userEmail: { $regex: search, $options: "i" } },
      ]
    }

    const total = await collection.countDocuments(filter)
    const docs = (await collection
      .find(filter)
      .sort({ [sortBy]: sortOrder })
      .skip((page - 1) * limit)
      .limit(limit)
      .toArray()) as ServerReturn[]

    // Aggregate counts per status
    const statusCountsAgg = await collection
      .aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }])
      .toArray()
    const statusCounts: Record<string, number> = {
      requested: 0,
      approved: 0,
      rejected: 0,
      refunded: 0,
    }
    for (const row of statusCountsAgg) {
      if (row._id && typeof row._id === "string") {
        statusCounts[row._id] = row.count as number
      }
    }

    const returns = docs.map((d) => ({ ...d, _id: d._id?.toString() }))

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
      stats: {
        total,
        ...statusCounts,
      },
    })
  } catch (error) {
    console.error("Admin returns list error:", error)
    return NextResponse.json(
      { error: "Failed to fetch returns" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCouponsCollection } from "@/lib/mongodb";
import { isAdminEmail } from "@/lib/isAdmin";
import { escapeRegex } from "@/lib/pricing";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(await isAdminEmail(session.user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collection = await getCouponsCollection();
    const coupons = await collection.find({}).sort({ createdAt: -1 }).toArray();

    return NextResponse.json({
      success: true,
      coupons: coupons.map((c) => ({
        ...c,
        _id: c._id.toString(),
      })),
    });
  } catch (error) {
    console.error("Error fetching coupons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(await isAdminEmail(session.user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, discountPercentage, isActive = true } = await req.json();

    if (typeof code !== "string" || code.trim() === "" || code.length > 64) {
      return NextResponse.json(
        { error: "Coupon code must be a string of at most 64 characters" },
        { status: 400 }
      );
    }

    if (
      typeof discountPercentage !== "number" ||
      !Number.isFinite(discountPercentage) ||
      discountPercentage <= 0 ||
      discountPercentage > 100
    ) {
      return NextResponse.json(
        { error: "Discount percentage must be a number between 1 and 100" },
        { status: 400 }
      );
    }

    if (typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
    }

    const collection = await getCouponsCollection();

    // Check if code already exists
    const existing = await collection.findOne({
      code: { $regex: new RegExp(`^${escapeRegex(code)}$`, "i") },
    });
    
    if (existing) {
      return NextResponse.json(
        { error: "Coupon code already exists" },
        { status: 400 }
      );
    }

    const newCoupon = {
      code: code.toUpperCase(),
      discountPercentage,
      isActive,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const result = await collection.insertOne(newCoupon);

    return NextResponse.json({
      success: true,
      coupon: {
        ...newCoupon,
        _id: result.insertedId.toString(),
      },
    });
  } catch (error) {
    console.error("Error creating coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

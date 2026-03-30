import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCouponsCollection, findUserByEmail } from "@/lib/mongodb";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    const collection = await getCouponsCollection();
    const coupon = await collection.findOne({
      code: { $regex: new RegExp(`^${code}$`, "i") },
      isActive: true,
    });

    if (!coupon) {
      return NextResponse.json({ error: "Invalid or inactive coupon code" }, { status: 400 });
    }

    const user = await findUserByEmail(session.user.email);
    const usedCoupons = user?.usedCoupons || [];

    // Check if the exact stored code exists in the user's used array
    if (usedCoupons.includes(coupon.code)) {
      return NextResponse.json({ error: "You have already used this coupon code" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      discountPercentage: coupon.discountPercentage,
      code: coupon.code,
    });
  } catch (error) {
    console.error("Error applying coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

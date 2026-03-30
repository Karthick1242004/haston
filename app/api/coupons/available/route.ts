import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCouponsCollection, findUserByEmail } from "@/lib/mongodb";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    
    // If not authenticated, return no coupons (or you could return active ones, but they can't save them anyway)
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ success: true, coupons: [] });
    }

    const email = session.user.email;
    const user = await findUserByEmail(email);

    const usedCoupons = user?.usedCoupons || [];

    const collection = await getCouponsCollection();
    // Find all active coupons that the user hasn't used yet
    const coupons = await collection
      .find({
        isActive: true,
        code: { $nin: usedCoupons }
      })
      .sort({ createdAt: -1 })
      .toArray();

    return NextResponse.json({
      success: true,
      coupons: coupons.map((c) => ({
        code: c.code,
        discountPercentage: c.discountPercentage,
      })), // only return necessary fields to the client
    });
  } catch (error) {
    console.error("Error fetching available coupons:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

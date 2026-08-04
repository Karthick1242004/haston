import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { validateCoupon, PricingError } from "@/lib/pricing-server";
import { enforceRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !session.user.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const limited = await enforceRateLimit(req, RATE_LIMITS.couponApply, session.user.id);
    if (limited) return limited;

    const { code } = await req.json().catch(() => ({}));

    if (!code) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    // Shared with the checkout pricing path so an applied coupon and a charged
    // coupon can never diverge. Escapes the code before it reaches the regex.
    const coupon = await validateCoupon(code, session.user.email);

    if (!coupon) {
      return NextResponse.json({ error: "Coupon code is required" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      discountPercentage: coupon.discountPercentage,
      code: coupon.code,
    });
  } catch (error) {
    if (error instanceof PricingError) {
      return NextResponse.json({ error: error.message }, { status: error.status });
    }
    console.error("Error applying coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

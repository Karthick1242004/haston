import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCouponsCollection } from "@/lib/mongodb";
import { isAdminEmail } from "@/lib/isAdmin";
import { ObjectId } from "mongodb";

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(await isAdminEmail(session.user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { code, discountPercentage, isActive } = await req.json();
    const collection = await getCouponsCollection();

    // If code is updated, check for uniqueness
    if (code) {
      const existing = await collection.findOne({
        code: { $regex: new RegExp(`^${code}$`, "i") },
        _id: { $ne: new ObjectId(params.id) },
      });
      if (existing) {
        return NextResponse.json(
          { error: "Coupon code already exists" },
          { status: 400 }
        );
      }
    }

    const updateData: any = { updatedAt: new Date() };
    if (code !== undefined) updateData.code = code.toUpperCase();
    if (discountPercentage !== undefined) updateData.discountPercentage = discountPercentage;
    if (isActive !== undefined) updateData.isActive = isActive;

    const result = await collection.updateOne(
      { _id: new ObjectId(params.id) },
      { $set: updateData }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !session.user || !(await isAdminEmail(session.user.email))) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const collection = await getCouponsCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(params.id) });

    if (result.deletedCount === 0) {
      return NextResponse.json({ error: "Coupon not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting coupon:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

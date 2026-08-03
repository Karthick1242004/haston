import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getCouponsCollection } from "@/lib/mongodb";
import { isAdminEmail } from "@/lib/isAdmin";
import { escapeRegex } from "@/lib/pricing";
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

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });
    }

    const { code, discountPercentage, isActive } = await req.json();
    const collection = await getCouponsCollection();

    if (code !== undefined && (typeof code !== "string" || code.trim() === "" || code.length > 64)) {
      return NextResponse.json(
        { error: "Coupon code must be a string of at most 64 characters" },
        { status: 400 }
      );
    }

    if (
      discountPercentage !== undefined &&
      (typeof discountPercentage !== "number" ||
        !Number.isFinite(discountPercentage) ||
        discountPercentage <= 0 ||
        discountPercentage > 100)
    ) {
      return NextResponse.json(
        { error: "Discount percentage must be a number between 1 and 100" },
        { status: 400 }
      );
    }

    if (isActive !== undefined && typeof isActive !== "boolean") {
      return NextResponse.json({ error: "isActive must be a boolean" }, { status: 400 });
    }

    // If code is updated, check for uniqueness
    if (code) {
      const existing = await collection.findOne({
        code: { $regex: new RegExp(`^${escapeRegex(code)}$`, "i") },
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

    if (!ObjectId.isValid(params.id)) {
      return NextResponse.json({ error: "Invalid coupon ID" }, { status: 400 });
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

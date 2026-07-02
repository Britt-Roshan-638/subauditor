// app/api/referral/apply/route.ts — apply a referral code to the current user.

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const { code } = await request.json();

    if (!code || typeof code !== "string" || code.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Invalid referral code." },
        { status: 400 }
      );
    }

    // Find the user who owns this referral code
    const referrer = await prisma.user.findUnique({
      where: { referralCode: code.trim() },
    });

    if (!referrer) {
      return NextResponse.json(
        { success: false, error: "Referral code not found." },
        { status: 404 }
      );
    }

    // Prevent self-referral
    if (referrer.id === user.id) {
      return NextResponse.json(
        { success: false, error: "You cannot use your own referral code." },
        { status: 400 }
      );
    }

    // Update the current user's referredBy field
    await prisma.user.update({
      where: { id: user.id },
      data: { referredBy: referrer.id },
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Referral apply error:", err);
    return NextResponse.json(
      { success: false, error: "Failed to apply referral code." },
      { status: 500 }
    );
  }
}

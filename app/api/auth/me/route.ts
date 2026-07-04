// app/api/auth/me/route.ts

import { NextRequest, NextResponse } from "next/server";
import { requireAuth } from "@/lib/auth";
import { Prisma } from "@prisma/client";

export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request, { hydrate: true });
  if (error) return error;

  // hydrate: true guarantees full Prisma User with plan, razorpayCustomerId, referralCode
  const userWithPlan = user as Prisma.UserGetPayload<{}>;

  return NextResponse.json({
    user: {
      id: userWithPlan.id,
      email: userWithPlan.email,
      name: userWithPlan.name,
      plan: userWithPlan.plan,
      razorpayCustomerId: userWithPlan.razorpayCustomerId,
      referralCode: userWithPlan.referralCode,
    },
  });
}
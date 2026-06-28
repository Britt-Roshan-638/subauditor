import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

/**
 * GET /api/auth/me — returns the current authenticated user's profile.
 */
export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);

  if (!user) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }

  return NextResponse.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      plan: user.plan,
      stripeCustomerId: user.stripeCustomerId,
    },
  });
}

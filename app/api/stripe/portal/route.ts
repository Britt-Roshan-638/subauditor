import { NextRequest, NextResponse } from "next/server";
import { createCustomerPortalSession } from "@/lib/stripe";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Require authenticated user
  const { user, error } = await requireAuth(request);
  if (error) return error;

  if (!user!.stripeCustomerId) {
    return NextResponse.json(
      { error: "No billing account found. Please upgrade to Pro first." },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

  try {
    const session = await createCustomerPortalSession({
      customerId: user!.stripeCustomerId,
      returnUrl: `${baseUrl}/settings`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create portal session";
    console.error("Stripe portal error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

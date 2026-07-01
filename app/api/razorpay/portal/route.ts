import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Require authenticated user
  const { user, error } = await requireAuth(request);
  if (error) return error;

  if (!user!.razorpayCustomerId) {
    return NextResponse.json(
      { error: "No billing account found. Please upgrade to Pro first." },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;

  try {
    // Generate a Razorpay subscription link for managing subscription
    // Note: Razorpay doesn't have a direct equivalent to Stripe's customer portal
    // Instead, we can provide a link to the Razorpay dashboard or create a custom page
    // For now, we'll return a URL to a custom subscription management page

    const subscriptionLink = `${baseUrl}/settings/subscription?customerId=${user!.razorpayCustomerId}`;

    return NextResponse.json({ url: subscriptionLink });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to generate subscription link";
    console.error("Razorpay subscription link error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
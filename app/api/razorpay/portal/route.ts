import { NextRequest, NextResponse } from "next/server";
import { razorpay, isRazorpayConfigured } from "@/lib/razorpay";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * GET: Fetch the current user's subscription status from Razorpay.
 * Returns plan info, subscription details (status, dates, billing cycle).
 */
export async function GET(request: NextRequest) {
  const { user, error } = await requireAuth(request, { hydrate: true });
  if (error) return error;

  const userWithDb = user as Prisma.UserGetPayload<{}>;

  // Free plan users without a Razorpay customer have no active subscription
  if (!userWithDb.razorpayCustomerId) {
    return NextResponse.json({
      plan: userWithDb.plan || "free",
      subscription: null,
    });
  }

  // If Razorpay isn't configured, fall back to the stored plan
  if (!isRazorpayConfigured()) {
    return NextResponse.json({
      plan: userWithDb.plan || "free",
      razorpayCustomerId: userWithDb.razorpayCustomerId,
      subscription: null,
    });
  }

  try {
    let subscriptionInfo = null;

    // Try to fetch the subscription from Razorpay if we have the ID
    if (userWithDb.razorpaySubscriptionId) {
      try {
        const sub = await razorpay.subscriptions.fetch(userWithDb.razorpaySubscriptionId);
        // Type assertion needed: Razorpay SDK types don't include all fields
        const subAny = sub as any;
        subscriptionInfo = {
          id: subAny.id,
          status: subAny.status,
          plan_id: subAny.plan_id,
          current_start: subAny.current_start,
          current_end: subAny.current_end,
          paid_count: subAny.paid_count,
          total_count: subAny.total_count,
          quantity: subAny.quantity,
          short_url: subAny.short_url,
          has_scheduled_changes: subAny.has_scheduled_changes,
          pause_status: subAny.pause_status || null,
        };
      } catch (fetchErr: unknown) {
        // Subscription might have been deleted on Razorpay - log and continue
        const msg = fetchErr instanceof Error ? fetchErr.message : "Unknown error";
        console.warn(`Could not fetch Razorpay subscription ${userWithDb.razorpaySubscriptionId}: ${msg}`);
      }
    }

    // Fetch the most recent payment for billing info
    let lastPayment = null;
    const recentPayment = await prisma.razorpayPayment.findFirst({
      where: { userId: userWithDb.id },
      orderBy: { createdAt: "desc" },
    });
    if (recentPayment) {
      lastPayment = {
        amount: recentPayment.amount,
        currency: recentPayment.currency,
        status: recentPayment.status,
        date: recentPayment.createdAt,
      };
    }

    return NextResponse.json({
      plan: userWithDb.plan || "free",
      razorpayCustomerId: userWithDb.razorpayCustomerId,
      razorpaySubscriptionId: userWithDb.razorpaySubscriptionId || null,
      subscription: subscriptionInfo,
      lastPayment,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to fetch subscription";
    console.error("Portal GET error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/**
 * POST: Legacy endpoint — still supported for backward compatibility.
 * Redirects to the new GET-based subscription management.
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request, { hydrate: true });
  if (error) return error;

  const userWithDb = user as Prisma.UserGetPayload<{}>;

  if (!userWithDb.razorpayCustomerId) {
    return NextResponse.json(
      { error: "No billing account found. Please upgrade to Pro first." },
      { status: 400 }
    );
  }

  const baseUrl = process.env.NEXTAUTH_URL || request.nextUrl.origin;
  const subscriptionUrl = `${baseUrl}/settings/subscription`;

  return NextResponse.json({ url: subscriptionUrl });
}

import { NextRequest, NextResponse } from "next/server";
import { razorpay, isRazorpayConfigured } from "@/lib/razorpay";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

/**
 * POST: Perform subscription management actions (cancel, pause, resume).
 *
 * Body: { action: "cancel" | "cancel_immediate" | "pause" | "resume", subscriptionId?: string }
 *
 * If subscriptionId is not provided, uses the stored razorpaySubscriptionId from the user record.
 */
export async function POST(request: NextRequest) {
  const { user, error } = await requireAuth(request, { hydrate: true });
  if (error) return error;

  const userWithDb = user as Prisma.UserGetPayload<{}>;
  const body = await request.json();
  const { action, subscriptionId: bodySubId } = body;

  if (!action) {
    return NextResponse.json({ error: "Action is required" }, { status: 400 });
  }

  // Use the provided subscriptionId or fall back to the stored one
  const subscriptionId = bodySubId || userWithDb.razorpaySubscriptionId;

  if (!subscriptionId) {
    return NextResponse.json(
      { error: "No active subscription found. Please upgrade to Pro first." },
      { status: 400 }
    );
  }

  if (!isRazorpayConfigured()) {
    return NextResponse.json(
      { error: "Payment processing is not configured. Please contact support." },
      { status: 500 }
    );
  }

  try {
    switch (action) {
      case "cancel": {
        // Cancel at end of current billing period (user keeps access until period ends)
        await razorpay.subscriptions.cancel(subscriptionId, 1);
        return NextResponse.json({
          success: true,
          message: "Subscription will be cancelled at the end of the current billing period. You will retain access until then.",
        });
      }

      case "cancel_immediate": {
        // Cancel immediately — user loses access right away
        await razorpay.subscriptions.cancel(subscriptionId, 0);
        // Downgrade user plan immediately
        await prisma.user.update({
          where: { id: userWithDb.id },
          data: { plan: "free" },
        });
        return NextResponse.json({
          success: true,
          message: "Subscription cancelled immediately. Your plan has been downgraded to Free.",
        });
      }

      case "pause": {
        // Pause subscription for up to 3 billing cycles
        // Razorpay allows pausing with pause_cycles_count (max 3)
        // Using type assertion because Razorpay SDK types may not include pause method
        await (razorpay.subscriptions as any).pause(subscriptionId, {
          pause_cycles_count: 3,
        });
        return NextResponse.json({
          success: true,
          message: "Subscription paused for 3 billing cycles. You will not be charged during this period.",
        });
      }

      case "resume": {
        // Resume a paused subscription immediately
        await (razorpay.subscriptions as any).resume(subscriptionId, {
          resume_at: "now",
        });
        return NextResponse.json({
          success: true,
          message: "Subscription resumed. Billing will continue as normal.",
        });
      }

      default:
        return NextResponse.json(
          { error: `Invalid action: "${action}". Supported actions: cancel, cancel_immediate, pause, resume` },
          { status: 400 }
        );
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to perform action";
    console.error(`Subscription action "${action}" error:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function POST(request: NextRequest) {
  // Require authenticated user (with DB hydration for razorpayCustomerId)
  const { user, error } = await requireAuth(request, { hydrate: true });
  if (error) return error;

  // hydrate: true guarantees full Prisma User with razorpayCustomerId, plan, etc.
  const userWithDb = user as Prisma.UserGetPayload<{}>;

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const planId = process.env.RAZORPAY_PLAN_ID_MONTHLY || process.env.RAZORPAY_PLAN_ID;

  if (!planId) {
    return NextResponse.json(
      { error: "Razorpay plan ID is not configured. Set RAZORPAY_PLAN_ID_MONTHLY or RAZORPAY_PLAN_ID in your .env file." },
      { status: 500 }
    );
  }

  try {
    let razorpayCustomerId = userWithDb.razorpayCustomerId;

    // Create Razorpay customer if one doesn't exist
    if (!razorpayCustomerId) {
      const customer = await razorpay.customers.create({
        email: userWithDb.email,
        name: userWithDb.name || undefined,
        contact: "", // Optional - phone number
      });

      razorpayCustomerId = customer.id;

      // Store razorpayCustomerId in the User table
      await prisma.user.update({
        where: { id: userWithDb.id },
        data: { razorpayCustomerId: customer.id },
      });
    }

    // Create a subscription with recurring billing (total_count: 0 = infinite recurring)
    // Using type assertion to include customer_id which is accepted by Razorpay API but not in TS types
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_id: razorpayCustomerId, // CRITICAL: pass customer_id so webhook can match user
      customer_notify: 1 as const,
      total_count: 0, // 0 = infinite recurring cycles
      notes: {
        userId: userWithDb.id,
        email: userWithDb.email,
        source: "subauditor",
      },
    } as { plan_id: string; customer_id: string; customer_notify: 1; total_count: number; notes: Record<string, string> });

    // Store the subscription ID on the user so portal/actions can look it up
    await prisma.user.update({
      where: { id: userWithDb.id },
      data: { razorpaySubscriptionId: subscription.id },
    });

    // Redirect to our Razorpay checkout page with the subscription ID
    const paymentUrl = `${baseUrl}/razorpay-checkout?subscription_id=${subscription.id}`;

    return NextResponse.json({ url: paymentUrl });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create razorpay subscription";
    console.error("Razorpay subscription error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

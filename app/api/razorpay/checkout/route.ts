import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  // Require authenticated user
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const planId = process.env.RAZORPAY_PLAN_ID_MONTHLY || process.env.RAZORPAY_PLAN_ID;

  if (!planId) {
    return NextResponse.json(
      { error: "Razorpay plan ID is not configured. Set RAZORPAY_PLAN_ID_MONTHLY or RAZORPAY_PLAN_ID in your .env file." },
      { status: 500 }
    );
  }

  try {
    let razorpayCustomerId = user!.razorpayCustomerId;

    // Create Razorpay customer if one doesn't exist
    if (!razorpayCustomerId) {
      const customer = await razorpay.customers.create({
        email: user!.email,
        name: user!.name || undefined,
        contact: "", // Optional - phone number
      });

      razorpayCustomerId = customer.id;

      // Store razorpayCustomerId in the User table
      await prisma.user.update({
        where: { id: user!.id },
        data: { razorpayCustomerId: customer.id },
      });
    }

    // Create a subscription with immediate first payment (count: 1)
    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: 1, // Charge for first period immediately
      notes: {
        userId: user!.id,
        email: user!.email,
        source: "subauditor",
      },
    });

    // Create an order for the subscription amount (for payment collection)
    // First, get the plan details to know the amount
    const plan = await razorpay.plans.fetch(planId);
    const amount = plan.item.amount; // Amount in paise

    // Generate a unique receipt ID
    const receipt = `receipt_${uuidv4()}`;

    // Create an order for this amount
    const order = await razorpay.orders.create({
      amount: amount,
      currency: "INR",
      receipt: receipt,
      notes: {
        subscriptionId: subscription.id,
        userId: user!.id,
      }
    });

    // Redirect to our Razorpay checkout page with the order ID
    const paymentUrl = `${baseUrl}/razorpay-checkout?order_id=${order.id}&subscription_id=${subscription.id}`;

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
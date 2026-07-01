import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";

export async function POST(request: NextRequest) {
  // Require authenticated user
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const { orderId, paymentId, subscriptionId, signature } = await request.json();

    // Validate required fields
    if (!orderId || !paymentId || !subscriptionId || !signature) {
      return NextResponse.json(
        { error: "Missing required payment verification fields" },
        { status: 400 }
      );
    }

    // Verify the payment signature
    const crypto = require('crypto');
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || "");
    shasum.update(`${orderId}|${paymentId}`);
    const digest = shasum.digest('hex');

    if (digest !== signature) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Fetch the payment details from Razorpay to verify it's legitimate
    const payment = await razorpay.payments.fetch(paymentId);

    // Verify that the payment matches our order and subscription
    if (payment.order_id !== orderId) {
      return NextResponse.json(
        { error: "Payment order ID mismatch" },
        { status: 400 }
      );
    }

    if (payment.status !== "captured") {
      return NextResponse.json(
        { error: "Payment not captured" },
        { status: 400 }
      );
    }

    // Update user to Pro plan
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: "pro" },
    });

    // Update or create subscription record
    await prisma.subscription.upsert({
      where: { razorpaySubscriptionId: subscriptionId },
      update: {
        status: "active",
        // Update any other relevant fields
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        razorpaySubscriptionId: subscriptionId,
        status: "active",
        name: "SubAuditor Pro",
        amount: 4.99,
        frequency: "monthly",
        currency: "USD",
        updatedAt: new Date(),
        // You might want to store more details from the subscription object
      },
    });

    // Create a payment record for tracking
    await prisma.razorpayPayment.create({
      data: {
        id: crypto.randomUUID(),
        userId: user.id,
        razorpayPaymentId: paymentId,
        amount: (payment.amount as number) / 100, // Convert from paise to rupees
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: String(payment.contact || ""),
      },
    });

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Payment verification failed";
    console.error("Payment verification error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
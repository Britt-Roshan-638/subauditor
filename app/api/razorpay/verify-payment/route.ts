import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  // Require authenticated user
  const { user, error } = await requireAuth(request);
  if (error) return error;

  try {
    const { paymentId, subscriptionId, signature } = await request.json();

    // Validate required fields
    if (!paymentId || !subscriptionId || !signature) {
      return NextResponse.json(
        { error: "Missing required payment verification fields" },
        { status: 400 }
      );
    }

    // Verify the payment signature using timing-safe comparison
    // For subscription payments, Razorpay signs with: payment_id|subscription_id
    const shasum = crypto.createHmac('sha256', process.env.RAZORPAY_KEY_SECRET || "");
    shasum.update(`${paymentId}|${subscriptionId}`);
    const digest = shasum.digest('hex');

    if (!timingSafeEqual(digest, signature)) {
      return NextResponse.json(
        { error: "Invalid payment signature" },
        { status: 400 }
      );
    }

    // Fetch the payment details from Razorpay to verify it's legitimate
    const payment = await razorpay.payments.fetch(paymentId);

    if (payment.status !== "captured") {
      return NextResponse.json(
        { error: "Payment not captured" },
        { status: 400 }
      );
    }

    // Upgrade user to Pro — billing is tracked on User.plan, not Subscription rows
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: "pro" },
    });

    // Record payment for tracking (idempotent)
    await prisma.razorpayPayment.upsert({
      where: { razorpayPaymentId: paymentId },
      update: {
        amount: (payment.amount as number) / 100, // Convert from paise to rupees
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: String(payment.contact || ""),
      },
      create: {
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

/**
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a);
    const bufB = Buffer.from(b);
    return crypto.timingSafeEqual(bufA, bufB);
  } catch {
    return false;
  }
}
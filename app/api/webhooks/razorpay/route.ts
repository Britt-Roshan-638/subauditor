import { NextRequest, NextResponse } from "next/server";
import { razorpay } from "@/lib/razorpay";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("x-razorpay-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing x-razorpay-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("RAZORPAY_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  // Verify the webhook signature
  const crypto = require('crypto');
  const shasum = crypto.createHmac('sha256', webhookSecret);
  shasum.update(body);
  const digest = shasum.digest('hex');

  if (digest !== signature) {
    console.error("Invalid Razorpay webhook signature");
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  let event: any;

  try {
    event = JSON.parse(body);
  } catch (err) {
    console.error("Invalid JSON in webhook body");
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  try {
    switch (event.event) {
      case "subscription.created": {
        await handleSubscriptionCreated(event.payload.subscription.entity);
        break;
      }

      case "subscription.activated": {
        await handleSubscriptionActivated(event.payload.subscription.entity);
        break;
      }

      case "subscription.charged": {
        await handleSubscriptionCharged(event.payload.subscription.entity);
        break;
      }

      case "subscription.completed": {
        await handleSubscriptionCompleted(event.payload.subscription.entity);
        break;
      }

      case "subscription.cancelled": {
        await handleSubscriptionCancelled(event.payload.subscription.entity);
        break;
      }

      case "payment.captured": {
        await handlePaymentCaptured(event.payload.payment.entity);
        break;
      }

      case "payment.failed": {
        await handlePaymentFailed(event.payload.payment.entity);
        break;
      }

      default:
        console.log(`Unhandled Razorpay event: ${event.event}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook handler error";
    console.error(`Error handling webhook ${event.event}:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle subscription.created — subscription was created but not yet activated
 */
async function handleSubscriptionCreated(subscription: any) {
  const { id: subscriptionId, customer_id, plan_id, status, total_count, current_start, current_end } = subscription;

  console.log(`Subscription created: ${subscriptionId} for customer ${customer_id}`);

  // Find the user by razorpayCustomerId
  const user = await prisma.user.findUnique({
    where: { razorpayCustomerId: customer_id },
  });

  if (!user) {
    console.error(`No user found with razorpayCustomerId: ${customer_id}`);
    return;
  }

  // Update subscription with razorpay subscription ID
  await prisma.subscription.upsert({
    where: { razorpaySubscriptionId: subscriptionId },
    update: {
      status: status.toLowerCase(),
      // Note: We might want to store additional subscription details
    },
    create: {
      id: crypto.randomUUID(),
      userId: user.id,
      plan_id: plan_id,
      razorpaySubscriptionId: subscriptionId,
      status: status.toLowerCase(),
      // Set dates if provided
      ...(current_start && { startDate: new Date(parseInt(current_start) * 1000) }),
      ...(current_end && { endDate: new Date(parseInt(current_end) * 1000) }),
    },
  });
}

/**
 * Handle subscription.activated — subscription is now active
 */
async function handleSubscriptionActivated(subscription: any) {
  const { id: subscriptionId, customer_id, status, current_start, current_end } = subscription;

  console.log(`Subscription activated: ${subscriptionId} for customer ${customer_id}`);

  // Find the user by razorpayCustomerId
  const user = await prisma.user.findUnique({
    where: { razorpayCustomerId: customer_id },
  });

  if (!user) {
    console.error(`No user found with razorpayCustomerId: ${customer_id}`);
    return;
  }

  // Update user to Pro plan
  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "pro" },
  });

  // Update subscription status
  await prisma.subscription.updateMany({
    where: { razorpaySubscriptionId: subscriptionId },
    data: {
      status: status.toLowerCase(),
      ...(current_start && { startDate: new Date(parseInt(current_start) * 1000) }),
      ...(current_end && { endDate: new Date(parseInt(current_end) * 1000) }),
    },
  });

  console.log(`User ${user.id} upgraded to Pro plan`);
}

/**
 * Handle subscription.charged — payment was successful for subscription
 */
async function handleSubscriptionCharged(subscription: any) {
  const { id: subscriptionId, customer_id, status } = subscription;

  console.log(`Subscription charged: ${subscriptionId} for customer ${customer_id}`);

  // Find the user by razorpayCustomerId
  const user = await prisma.user.findUnique({
    where: { razorpayCustomerId: customer_id },
  });

  if (!user) {
    console.error(`No user found with razorpayCustomerId: ${customer_id}`);
    return;
  }

  // Ensure user remains on Pro plan
  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "pro" },
  });

  // Update subscription status
  await prisma.subscription.updateMany({
    where: { razorpaySubscriptionId: subscriptionId },
    data: { status: status.toLowerCase() },
  });
}

/**
 * Handle subscription.completed — subscription has ended
 */
async function handleSubscriptionCompleted(subscription: any) {
  const { id: subscriptionId, customer_id, status } = subscription;

  console.log(`Subscription completed: ${subscriptionId} for customer ${customer_id}`);

  // Find the user by razorpayCustomerId
  const user = await prisma.user.findUnique({
    where: { razorpayCustomerId: customer_id },
  });

  if (!user) {
    console.error(`No user found with razorpayCustomerId: ${customer_id}`);
    return;
  }

  // Downgrade to free plan
  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "free" },
  });

  // Update subscription status
  await prisma.subscription.updateMany({
    where: { razorpaySubscriptionId: subscriptionId },
    data: { status: status.toLowerCase() },
  });

  console.log(`User ${user.id} downgraded to free plan`);
}

/**
 * Handle subscription.cancelled — subscription was cancelled
 */
async function handleSubscriptionCancelled(subscription: any) {
  const { id: subscriptionId, customer_id, status } = subscription;

  console.log(`Subscription cancelled: ${subscriptionId} for customer ${customer_id}`);

  // Find the user by razorpayCustomerId
  const user = await prisma.user.findUnique({
    where: { razorpayCustomerId: customer_id },
  });

  if (!user) {
    console.error(`No user found with razorpayCustomerId: ${customer_id}`);
    return;
  }

  // Downgrade to free plan
  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "free" },
  });

  // Update subscription status
  await prisma.subscription.updateMany({
    where: { razorpaySubscriptionId: subscriptionId },
    data: { status: status.toLowerCase() },
  });

  console.log(`User ${user.id} downgraded to free plan`);
}

/**
 * Handle payment.captured — payment was successfully captured
 */
async function handlePaymentCaptured(payment: any) {
  const { id: paymentId, amount, currency, method, email, contact } = payment;

  console.log(`Payment captured: ${paymentId} for amount ${amount/100} ${currency}`);

  // Store payment record if needed
  // await prisma.razorpayPayment.create({
  //   data: {
  //     razorpayPaymentId: paymentId,
  //     amount: amount / 100, // Convert from paise to rupees
  //     currency,
  //     method,
  //     email,
  //     contact,
  //   },
  // });
}

/**
 * Handle payment.failed — payment failed
 */
async function handlePaymentFailed(payment: any) {
  const { id: paymentId, amount, currency, method, email, contact, error_code, error_description } = payment;

  console.error(`Payment failed: ${paymentId} for amount ${amount/100} ${currency}. Error: ${error_code} - ${error_description}`);

  // You might want to notify the user or handle retries here
}
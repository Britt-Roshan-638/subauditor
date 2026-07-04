import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import crypto from 'crypto';

// --- In-memory dedup cache — evicts entries older than 1 hour ---
const processedEvents = new Map<string, number>();
const EVENT_TTL_MS = 60 * 60 * 1000; // 1 hour

function cleanupCache() {
  const now = Date.now();
  Array.from(processedEvents.entries()).forEach(([key, timestamp]) => {
    if (now - timestamp > EVENT_TTL_MS) {
      processedEvents.delete(key);
    }
  });
}

function getEventId(event: any): string {
  // Razorpay events have an id field at the top level
  if (event.id) return event.id;

  // Fallback: use event type + entity id + created_at
  const entity = event.payload?.subscription?.entity || event.payload?.payment?.entity;
  if (entity?.id) {
    return `${event.event}:${entity.id}:${entity.created_at || ''}`;
  }
  return `${event.event}:${JSON.stringify(event.payload).slice(0, 100)}`;
}

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

  // Verify the webhook signature using timing-safe comparison
  const shasum = crypto.createHmac('sha256', webhookSecret);
  shasum.update(body);
  const digest = shasum.digest('hex');

  if (!timingSafeEqual(digest, signature)) {
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

  // --- Idempotency guard: skip already-processed events ---
  cleanupCache();
  const eventId = getEventId(event);
  if (processedEvents.has(eventId)) {
    console.log(`Duplicate webhook event ignored: ${eventId}`);
    return NextResponse.json({ received: true, duplicate: true });
  }
  processedEvents.set(eventId, Date.now());

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

      case "subscription.payment_failed": {
        await handleSubscriptionPaymentFailed(event.payload.subscription.entity);
        break;
      }

      case "subscription.halted": {
        await handleSubscriptionHalted(event.payload.subscription.entity);
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
 * Timing-safe string comparison to prevent timing attacks
 */
function timingSafeEqual(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  return crypto.timingSafeEqual(bufA, bufB);
}

/**
 * Handle subscription.created — log only; billing is tracked on User.plan, not Subscription rows
 */
async function handleSubscriptionCreated(subscription: any) {
  const { id: subscriptionId, customer_id } = subscription;
  console.log(`Subscription created: ${subscriptionId} for customer ${customer_id}`);
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

  // Update user to Pro plan and store subscription ID for portal management
  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: "pro",
      razorpaySubscriptionId: subscriptionId,
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

  console.log(`User ${user.id} downgraded to free plan`);
}

/**
 * Handle subscription.cancelled — subscription was cancelled
 */
async function handleSubscriptionCancelled(subscription: any) {
  const { id: subscriptionId, customer_id } = subscription;

  console.log(`Subscription cancelled: ${subscriptionId} for customer ${customer_id}`);

  const user = await prisma.user.findUnique({
    where: { razorpayCustomerId: customer_id },
  });

  if (!user) {
    console.error(`No user found with razorpayCustomerId: ${customer_id}`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "free" },
  });

  console.log(`User ${user.id} downgraded to free plan`);
}

/**
 * Handle subscription.payment_failed — recurring payment failed
 */
async function handleSubscriptionPaymentFailed(subscription: any) {
  const { id: subscriptionId, customer_id } = subscription;

  console.log(`Subscription payment failed: ${subscriptionId} for customer ${customer_id}`);

  const user = await prisma.user.findUnique({
    where: { razorpayCustomerId: customer_id },
  });

  if (!user) {
    console.error(`No user found with razorpayCustomerId: ${customer_id}`);
    return;
  }

  console.log(`User ${user.id} subscription payment failed - manual review recommended`);
}

/**
 * Handle subscription.halted — subscription was halted (all retries exhausted)
 */
async function handleSubscriptionHalted(subscription: any) {
  const { id: subscriptionId, customer_id } = subscription;

  console.log(`Subscription halted: ${subscriptionId} for customer ${customer_id}`);

  const user = await prisma.user.findUnique({
    where: { razorpayCustomerId: customer_id },
  });

  if (!user) {
    console.error(`No user found with razorpayCustomerId: ${customer_id}`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "free" },
  });

  console.log(`User ${user.id} downgraded to free plan (subscription halted)`);
}

/**
 * Handle payment.captured — payment was successfully captured
 */
async function handlePaymentCaptured(payment: any) {
  const { id: paymentId, amount, currency, method, email, contact } = payment;

  console.log(`Payment captured: ${paymentId} for amount ${amount/100} ${currency}`);

  // Find the user by email or contact to link payment record
  const user = email
    ? await prisma.user.findFirst({ where: { email } })
    : null;

  if (user) {
    await prisma.razorpayPayment.upsert({
      where: { razorpayPaymentId: paymentId },
      update: {
        amount: amount / 100,
        currency,
        status: "captured",
        method,
        email,
        contact,
      },
      create: {
        id: crypto.randomUUID(),
        userId: user.id,
        razorpayPaymentId: paymentId,
        amount: amount / 100,
        currency,
        status: "captured",
        method,
        email,
        contact,
      },
    });
  }
}

/**
 * Handle payment.failed — payment failed
 */
async function handlePaymentFailed(payment: any) {
  const { id: paymentId, amount, currency, method, email, contact, error_code, error_description } = payment;

  console.error(`Payment failed: ${paymentId} for amount ${amount/100} ${currency}. Error: ${error_code} - ${error_description}`);

  // You might want to notify the user or handle retries here
}
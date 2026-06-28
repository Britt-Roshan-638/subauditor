import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  const body = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json(
      { error: "Missing stripe-signature header" },
      { status: 400 }
    );
  }

  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    console.error("STRIPE_WEBHOOK_SECRET is not set");
    return NextResponse.json(
      { error: "Webhook secret not configured" },
      { status: 500 }
    );
  }

  let event: Stripe.Event;

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook signature verification failed";
    console.error(`Webhook signature verification failed: ${message}`);
    return NextResponse.json({ error: message }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        await handleCheckoutSessionCompleted(event.data.object as Stripe.Checkout.Session);
        break;
      }

      case "customer.subscription.updated": {
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription);
        break;
      }

      case "customer.subscription.deleted": {
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;
      }

      default:
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Webhook handler error";
    console.error(`Error handling webhook ${event.type}:`, message);
    return NextResponse.json({ error: message }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}

/**
 * Handle checkout.session.completed — activate Pro plan for the user.
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const customerId = session.customer as string;
  const subscriptionId = session.subscription as string | undefined;

  if (!customerId) {
    console.error("No customer ID in checkout session");
    return;
  }

  console.log(`Checkout completed for customer ${customerId}, subscription ${subscriptionId}`);

  // Find the user by stripeCustomerId and upgrade to Pro
  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`No user found with stripeCustomerId: ${customerId}`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: {
      plan: "pro",
    },
  });

  console.log(`User ${user.id} upgraded to Pro plan`);
}

/**
 * Handle customer.subscription.updated — sync subscription status.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;
  const status = subscription.status;

  console.log(`Subscription ${subscription.id} updated — status: ${status}`);

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`No user found with stripeCustomerId: ${customerId}`);
    return;
  }

  // If subscription is active or trialing, ensure Pro plan
  if (status === "active" || status === "trialing") {
    if (user.plan !== "pro") {
      await prisma.user.update({
        where: { id: user.id },
        data: { plan: "pro" },
      });
      console.log(`User ${user.id} plan set to pro (subscription ${status})`);
    }
  } else if (status === "past_due" || status === "unpaid") {
    // Keep pro but could notify user about payment issues
    console.log(`User ${user.id} subscription is ${status} — payment attention needed`);
  } else if (status === "canceled" || status === "incomplete_expired") {
    // Downgrade to free
    await prisma.user.update({
      where: { id: user.id },
      data: { plan: "free" },
    });
    console.log(`User ${user.id} downgraded to free (subscription ${status})`);
  }
}

/**
 * Handle customer.subscription.deleted — downgrade to free plan.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const customerId = subscription.customer as string;

  console.log(`Subscription ${subscription.id} deleted for customer ${customerId}`);

  const user = await prisma.user.findUnique({
    where: { stripeCustomerId: customerId },
  });

  if (!user) {
    console.error(`No user found with stripeCustomerId: ${customerId}`);
    return;
  }

  await prisma.user.update({
    where: { id: user.id },
    data: { plan: "free" },
  });

  console.log(`User ${user.id} downgraded to free plan`);
}

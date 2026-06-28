import "server-only";
import Stripe from "stripe";

const stripeKey = process.env.STRIPE_SECRET_KEY || "sk_test_placeholder";

let warnedOnce = false;
function warnOnce(message: string) {
  if (warnedOnce) return;
  warnedOnce = true;
  console.warn(message);
}

/**
 * Stripe client instance. When STRIPE_SECRET_KEY is not configured and we're not in development,
 * a stub key is used so importing this module never throws. Callers should still handle the
 * `Stripe is not configured` error path returned from helpers when the key is missing.
 */
export const stripe = new Stripe(stripeKey, {
  // Use the SDK's default API version (current at install time).
  // Pinning an explicit older literal is incompatible with newer SDK typings.
  typescript: true,
});

if (process.env.NEXT_RUNTIME !== "nodejs") {
  warnOnce("Stripe client imported in a non-Node runtime — only use inside server code.");
}

/**
 * Returns true when a real STRIPE_SECRET_KEY is present.
 */
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

/**
 * Create a Stripe Checkout Session for subscription.
 */
export async function createCheckoutSession({
  priceId,
  customerId,
  successUrl,
  cancelUrl,
}: {
  priceId: string;
  customerId: string;
  successUrl: string;
  cancelUrl: string;
}): Promise<Stripe.Checkout.Session> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.");
  }
  return await stripe.checkout.sessions.create({
    mode: "subscription",
    customer: customerId,
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: successUrl,
    cancel_url: cancelUrl,
    subscription_data: { metadata: { source: "subauditor" } },
  });
}

/**
 * Create a Stripe Customer Portal session so users can manage their subscription.
 */
export async function createCustomerPortalSession({
  customerId,
  returnUrl,
}: {
  customerId: string;
  returnUrl: string;
}): Promise<Stripe.BillingPortal.Session> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.");
  }
  return await stripe.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  });
}

/**
 * Retrieve a Stripe subscription by ID.
 */
export async function getSubscription({
  subscriptionId,
}: {
  subscriptionId: string;
}): Promise<Stripe.Subscription> {
  if (!isStripeConfigured()) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY in your environment.");
  }
  return await stripe.subscriptions.retrieve(subscriptionId);
}

export default stripe;

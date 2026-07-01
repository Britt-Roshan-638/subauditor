import "server-only";
import Razorpay from "razorpay";

const keyId = process.env.RAZORPAY_KEY_ID || "rzp_test_placeholder";
const keySecret = process.env.RAZORPAY_KEY_SECRET || "Your_Secret_Key";

let warnedOnce = false;
function warnOnce(message: string) {
  if (warnedOnce) return;
  warnedOnce = true;
  console.warn(message);
}

/**
 * Razorpay client instance. When RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET is not configured and we're not in development,
 * a stub key is used so importing this module never throws. Callers should still handle the
 * `Razorpay is not configured` error path returned from helpers when the key is missing.
 */
export const razorpay = new Razorpay({
  key_id: keyId,
  key_secret: keySecret,
});

if (process.env.NEXT_RUNTIME !== "nodejs") {
  warnOnce("Razorpay client imported in a non-Node runtime — only use inside server code.");
}

/**
 * Returns true when a real RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET are present.
 */
export function isRazorpayConfigured(): boolean {
  return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
}

/**
 * Create a Razorpay Order for subscription payment.
 * Note: Razorpay uses Orders for payments, which is similar to Stripe's Checkout Sessions.
 */
export async function createRazorpayOrder({
  amount,
  currency = "INR",
  receipt,
  notes,
}: {
  amount: number; // amount in paise (INR) or cents (for other currencies)
  currency?: string;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<any> {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.");
  }
  return await razorpay.orders.create({
    amount,
    currency,
    receipt,
    notes,
  });
}

/**
 * Create a Razorpay Subscription.
 */
export async function createRazorpaySubscription({
  plan_id,
  customer_notify = true,
  total_count,
  quantity = 1,
  addons,
  coupons,
  notes,
}: {
  plan_id: string;
  customer_notify?: boolean;
  total_count: number;
  quantity?: number;
  addons?: any[];
  coupons?: any[];
  notes?: Record<string, string>;
}): Promise<any> {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.");
  }
  return await razorpay.subscriptions.create({
    plan_id,
    customer_notify,
    total_count,
    quantity,
    addons,
    notes,
  });
}

/**
 * Fetch a Razorpay Subscription by ID.
 */
export async function fetchRazorpaySubscription(subscriptionId: string): Promise<any> {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.");
  }
  return await razorpay.subscriptions.fetch(subscriptionId);
}

/**
 * Cancel a Razorpay Subscription.
 */
export async function cancelRazorpaySubscription(subscriptionId: string, cancel_at_cycle_end = 0): Promise<any> {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.");
  }
  return await razorpay.subscriptions.cancel(subscriptionId, cancel_at_cycle_end);
}

/**
 * Fetch a Razorpay Payment by ID.
 */
export async function fetchRazorpayPayment(paymentId: string): Promise<any> {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.");
  }
  return await razorpay.payments.fetch(paymentId);
}

/**
 * Create a Razorpay Customer (if needed).
 * Note: Razorpay automatically creates customers when needed for payments/subscriptions.
 * This function is provided for completeness if you need to create a customer explicitly.
 */
export async function createRazorpayCustomer({
  name,
  email,
  contact,
  fail_existing = false,
  notes,
}: {
  name: string;
  email: string;
  contact: string;
  fail_existing?: boolean;
  notes?: Record<string, string>;
}): Promise<any> {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.");
  }
  return await razorpay.customers.create({
    name,
    email,
    contact,
    fail_existing,
    notes,
  });
}

/**
 * Fetch a Razorpay Customer by ID.
 */
export async function fetchRazorpayCustomer(customerId: string): Promise<any> {
  if (!isRazorpayConfigured()) {
    throw new Error("Razorpay is not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in your environment.");
  }
  return await razorpay.customers.fetch(customerId);
}

export default razorpay;
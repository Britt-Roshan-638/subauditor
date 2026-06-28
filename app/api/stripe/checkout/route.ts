import { NextRequest, NextResponse } from "next/server";
import { stripe, createCheckoutSession } from "@/lib/stripe";
import { requireAuth } from "@/lib/auth";
import prisma from "@/lib/prisma";

export async function POST(request: NextRequest) {
  // Require authenticated user
  const { user, error } = await requireAuth(request);
  if (error) return error;

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const priceId = process.env.STRIPE_PRICE_ID_MONTHLY || process.env.STRIPE_PRICE_ID;

  if (!priceId) {
    return NextResponse.json(
      { error: "Stripe price ID is not configured. Set STRIPE_PRICE_ID_MONTHLY or STRIPE_PRICE_ID in your .env file." },
      { status: 500 }
    );
  }

  try {
    let stripeCustomerId = user!.stripeCustomerId;

    // Create Stripe customer if one doesn't exist
    if (!stripeCustomerId) {
      const customer = await stripe.customers.create({
        email: user!.email,
        name: user!.name || undefined,
        metadata: {
          userId: user!.id,
        },
      });

      stripeCustomerId = customer.id;

      // Store stripeCustomerId in the User table
      await prisma.user.update({
        where: { id: user!.id },
        data: { stripeCustomerId: customer.id },
      });
    }

    // Create the checkout session
    const session = await createCheckoutSession({
      priceId,
      customerId: stripeCustomerId,
      successUrl: `${baseUrl}/dashboard?checkout=success`,
      cancelUrl: `${baseUrl}/pricing?checkout=cancelled`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Failed to create checkout session";
    console.error("Stripe checkout error:", message);
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}

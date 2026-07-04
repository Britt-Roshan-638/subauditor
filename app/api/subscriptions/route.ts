import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { requireAuth } from "@/lib/auth";
import {
  BILLING_SUBSCRIPTION_FILTER,
  FREE_SUBSCRIPTION_LIMIT,
  isProPlan,
  normalizeFrequency,
} from "@/lib/subscription-utils";

export async function GET(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId: user!.id, ...BILLING_SUBSCRIPTION_FILTER },
      orderBy: { amount: "desc" },
      include: {
        PriceChange: {
          orderBy: { detectedAt: "desc" },
        },
      },
    });

    return NextResponse.json({ subscriptions });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch subscriptions";
    console.error("Error fetching subscriptions:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const { user, error } = await requireAuth(request);
    if (error) return error;

    const body = await request.json();
    const { name, amount, frequency, category } = body;

    if (!name?.trim() || typeof amount !== "number" || amount <= 0) {
      return NextResponse.json(
        { error: "Name and a positive amount are required." },
        { status: 400 }
      );
    }

    const validFrequencies = ["weekly", "biweekly", "monthly", "quarterly", "semi_annual", "annual", "yearly"];
    const freq = normalizeFrequency(frequency || "monthly");
    if (!validFrequencies.includes(frequency || "monthly") && !validFrequencies.includes(freq)) {
      return NextResponse.json({ error: "Invalid frequency." }, { status: 400 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { id: user!.id },
      select: { plan: true },
    });

    if (!isProPlan(dbUser?.plan)) {
      const count = await prisma.subscription.count({
        where: { userId: user!.id, status: "active", ...BILLING_SUBSCRIPTION_FILTER },
      });
      if (count >= FREE_SUBSCRIPTION_LIMIT) {
        return NextResponse.json(
          {
            error: `Free plan is limited to ${FREE_SUBSCRIPTION_LIMIT} subscriptions. Upgrade to Pro for unlimited tracking.`,
          },
          { status: 403 }
        );
      }
    }

    const subscription = await prisma.subscription.create({
      data: {
        id: crypto.randomUUID(),
        userId: user!.id,
        name: name.trim(),
        amount,
        frequency: freq,
        category: category?.trim() || "Other",
        status: "active",
        lastChargeDate: new Date(),
        updatedAt: new Date(),
      },
    });

    return NextResponse.json({ subscription }, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to create subscription";
    console.error("Error creating subscription:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

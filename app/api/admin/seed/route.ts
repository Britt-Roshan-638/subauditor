// app/api/admin/seed/route.ts — seed test subscriptions & grant Pro without Razorpay.
// POST /api/admin/seed  — creates test data for the authenticated user.
// POST /api/admin/seed?pro=true  — also upgrades the user to Pro.
// POST /api/admin/seed?reset=true  — deletes all existing subscriptions first.

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";

function randomAmount(min: number, max: number): number {
  return Math.round((Math.random() * (max - min) + min) * 100) / 100;
}

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function daysFromNow(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return d;
}

const TEST_SUBSCRIPTIONS = [
  {
    name: "Netflix Premium",
    amount: 22.99,
    currency: "USD",
    frequency: "monthly",
    category: "Entertainment",
    status: "active",
    lastChargeDate: daysAgo(5),
    nextChargeDate: daysFromNow(25),
    startDate: daysAgo(180),
  },
  {
    name: "Spotify Family",
    amount: 15.99,
    currency: "USD",
    frequency: "monthly",
    category: "Music",
    status: "active",
    lastChargeDate: daysAgo(3),
    nextChargeDate: daysFromNow(27),
    startDate: daysAgo(365),
  },
  {
    name: "Google Drive 2TB",
    amount: 9.99,
    currency: "USD",
    frequency: "monthly",
    category: "Storage",
    status: "active",
    lastChargeDate: daysAgo(10),
    nextChargeDate: daysFromNow(20),
    startDate: daysAgo(90),
  },
  {
    name: "Adobe Creative Cloud",
    amount: 54.99,
    currency: "USD",
    frequency: "monthly",
    category: "Productivity",
    status: "active",
    lastChargeDate: daysAgo(2),
    nextChargeDate: daysFromNow(28),
    startDate: daysAgo(240),
  },
  {
    name: "Medium Membership",
    amount: 5.0,
    currency: "USD",
    frequency: "monthly",
    category: "News",
    status: "active",
    lastChargeDate: daysAgo(7),
    nextChargeDate: daysFromNow(23),
    startDate: daysAgo(45),
  },
  {
    name: "Peloton Digital",
    amount: 12.99,
    currency: "USD",
    frequency: "monthly",
    category: "Health",
    status: "inactive",
    lastChargeDate: daysAgo(60),
    nextChargeDate: daysFromNow(-1),
    startDate: daysAgo(120),
  },
  {
    name: "Amazon Prime",
    amount: 139.0,
    currency: "USD",
    frequency: "yearly",
    category: "Shopping",
    status: "active",
    lastChargeDate: daysAgo(30),
    nextChargeDate: daysFromNow(335),
    startDate: daysAgo(60),
  },
  {
    name: "Notion Plus",
    amount: 10.0,
    currency: "USD",
    frequency: "monthly",
    category: "Productivity",
    status: "trial",
    lastChargeDate: daysAgo(1),
    nextChargeDate: daysFromNow(13),
    startDate: daysAgo(1),
  },
  {
    name: "The New York Times",
    amount: 4.0,
    currency: "USD",
    frequency: "weekly",
    category: "News",
    status: "active",
    lastChargeDate: daysAgo(4),
    nextChargeDate: daysFromNow(3),
    startDate: daysAgo(200),
  },
  {
    name: "iCloud+ 200GB",
    amount: 2.99,
    currency: "USD",
    frequency: "monthly",
    category: "Storage",
    status: "active",
    lastChargeDate: daysAgo(8),
    nextChargeDate: daysFromNow(22),
    startDate: daysAgo(400),
  },
  {
    name: "Headspace",
    amount: 69.99,
    currency: "USD",
    frequency: "yearly",
    category: "Health",
    status: "active",
    lastChargeDate: daysAgo(15),
    nextChargeDate: daysFromNow(350),
    startDate: daysAgo(15),
  },
  {
    name: "Audible Premium Plus",
    amount: 14.95,
    currency: "USD",
    frequency: "monthly",
    category: "Entertainment",
    status: "active",
    lastChargeDate: daysAgo(6),
    nextChargeDate: daysFromNow(24),
    startDate: daysAgo(300),
  },
];

// Price changes to attach to some subscriptions
const PRICE_CHANGES: Record<string, Array<{ oldAmount: number; newAmount: number; daysAgo: number }>> = {
  "Netflix Premium": [
    { oldAmount: 15.99, newAmount: 22.99, daysAgo: 30 },
    { oldAmount: 13.99, newAmount: 15.99, daysAgo: 180 },
  ],
  "Spotify Family": [
    { oldAmount: 14.99, newAmount: 15.99, daysAgo: 45 },
  ],
  "Adobe Creative Cloud": [
    { oldAmount: 52.99, newAmount: 54.99, daysAgo: 60 },
  ],
};

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Admin-only endpoint: require ADMIN_EMAIL in all environments
    const adminEmail = process.env.ADMIN_EMAIL;
    if (!adminEmail || session.user.email !== adminEmail) {
      return NextResponse.json({ error: "Forbidden — admin only" }, { status: 403 });
    }

    const userId = session.user.id;
    const url = new URL(request.url);
    const shouldReset = url.searchParams.get("reset") === "true";
    const shouldGrantPro = url.searchParams.get("pro") === "true";

    // Optionally reset all existing subscriptions + price changes
    if (shouldReset) {
      await prisma.priceChange.deleteMany({ where: { subscription: { userId } } });
      await prisma.subscription.deleteMany({ where: { userId } });
    }

    // Create test subscriptions
    let createdCount = 0;
    const createdSubs: Array<{ name: string; amount: number; frequency: string }> = [];

    for (const subData of TEST_SUBSCRIPTIONS) {
      const existing = await prisma.subscription.findFirst({
        where: { userId, name: subData.name },
      });
      if (existing) continue; // skip duplicates

      const sub = await prisma.subscription.create({
        data: {
          userId,
          name: subData.name,
          amount: subData.amount,
          currency: subData.currency,
          frequency: subData.frequency,
          category: subData.category,
          status: subData.status,
          lastChargeDate: subData.lastChargeDate,
          nextChargeDate: subData.nextChargeDate,
          startDate: subData.startDate,
        },
      });

      createdSubs.push({ name: sub.name, amount: sub.amount, frequency: sub.frequency });
      createdCount++;

      // Add price changes
      const changes = PRICE_CHANGES[subData.name];
      if (changes) {
        for (const change of changes) {
          await prisma.priceChange.create({
            data: {
              subscriptionId: sub.id,
              oldAmount: change.oldAmount,
              newAmount: change.newAmount,
              detectedAt: daysAgo(change.daysAgo),
            },
          });
        }
      }
    }

    // Grant Pro if requested
    if (shouldGrantPro) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          plan: "pro",
          ...(session.user.email
            ? { referralCode: `${session.user.email.split("@")[0].toUpperCase()}-PRO` }
            : {}),
        },
      });
    }

    // Fetch the updated user
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, plan: true, referralCode: true },
    });

    // Calculate total monthly spend
    const activeSubs = await prisma.subscription.findMany({
      where: { userId, status: "active" },
    });
    let totalMonthly = 0;
    for (const sub of activeSubs) {
      if (sub.frequency === "monthly") totalMonthly += sub.amount;
      else if (sub.frequency === "weekly") totalMonthly += sub.amount * 4.33;
      else if (sub.frequency === "yearly") totalMonthly += sub.amount / 12;
      else totalMonthly += sub.amount;
    }

    return NextResponse.json({
      success: true,
      message: `Created ${createdCount} test subscriptions${shouldGrantPro ? " and granted Pro access" : ""}.`,
      created: createdCount,
      skipped: TEST_SUBSCRIPTIONS.length - createdCount,
      totalMonthlySpend: Math.round(totalMonthly * 100) / 100,
      plan: user?.plan || "free",
      referralCode: user?.referralCode || null,
      user,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Error seeding data:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

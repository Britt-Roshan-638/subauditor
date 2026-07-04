import { NextRequest, NextResponse } from "next/server";
import { getTransactions } from "@/lib/plaid";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { detectSubscriptions } from "@/lib/subscription-detector";
import {
  BILLING_SUBSCRIPTION_FILTER,
  FREE_SUBSCRIPTION_LIMIT,
  isProPlan,
  normalizeFrequency,
} from "@/lib/subscription-utils";
import { subDays, format } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { plan: true },
    });

    const plaidAccounts = await prisma.plaidAccount.findMany({
      where: { userId },
    });

    if (plaidAccounts.length === 0) {
      return NextResponse.json(
        { error: "No linked bank accounts found. Please connect a bank account first." },
        { status: 400 }
      );
    }

    const endDate = format(new Date(), "yyyy-MM-dd");
    const startDate = format(subDays(new Date(), 365), "yyyy-MM-dd");

    let totalTransactions = 0;
    let detectedSubscriptions: Awaited<ReturnType<typeof detectSubscriptions>> = [];

    for (const plaidAccount of plaidAccounts) {
      const plaidTransactions = await getTransactions(
        plaidAccount.plaidAccessToken,
        startDate,
        endDate
      );

      await Promise.all(
        plaidTransactions.map((txn) =>
          prisma.transaction
            .upsert({
              where: { plaidTransactionId: txn.transactionId },
              update: {
                amount: txn.amount,
                date: new Date(txn.date),
                name: txn.name,
                category: txn.category,
              },
              create: {
                id: crypto.randomUUID(),
                userId,
                accountId: plaidAccount.id,
                plaidAccountId: plaidAccount.id,
                amount: txn.amount,
                date: new Date(txn.date),
                name: txn.name,
                category: txn.category,
                plaidTransactionId: txn.transactionId,
              },
            })
            .catch(() => null)
        )
      );

      totalTransactions += plaidTransactions.length;

      const subs = await detectSubscriptions(plaidTransactions, userId);
      detectedSubscriptions = detectedSubscriptions.concat(subs);
    }

    // Deduplicate by merchant name — keep highest-confidence match
    const byName = new Map<string, (typeof detectedSubscriptions)[0]>();
    for (const sub of detectedSubscriptions) {
      const key = sub.name.toLowerCase();
      if (!byName.has(key)) byName.set(key, sub);
    }
    detectedSubscriptions = Array.from(byName.values());

    let subscriptionsCreated = 0;
    let priceChangesDetected = 0;

    const existingCount = await prisma.subscription.count({
      where: { userId, status: "active", ...BILLING_SUBSCRIPTION_FILTER },
    });

    for (const sub of detectedSubscriptions) {
      const frequency = normalizeFrequency(sub.frequency);

      const existing = await prisma.subscription.findFirst({
        where: {
          userId,
          ...BILLING_SUBSCRIPTION_FILTER,
          OR: [
            { plaidTransactionId: sub.plaidTransactionId },
            { name: { equals: sub.name, mode: "insensitive" } },
          ],
        },
      });

      if (existing) {
        const amountChanged =
          Math.abs(existing.amount - sub.amount) / existing.amount > 0.05;

        if (amountChanged) {
          await prisma.priceChange.create({
            data: {
              id: crypto.randomUUID(),
              subscriptionId: existing.id,
              oldAmount: existing.amount,
              newAmount: sub.amount,
            },
          });
          priceChangesDetected++;
        }

        await prisma.subscription.update({
          where: { id: existing.id },
          data: {
            amount: sub.amount,
            frequency,
            lastChargeDate: sub.lastChargeDate,
            nextChargeDate: sub.nextChargeDate,
            status: "active",
            updatedAt: new Date(),
          },
        });
        continue;
      }

      if (!isProPlan(user?.plan) && existingCount + subscriptionsCreated >= FREE_SUBSCRIPTION_LIMIT) {
        continue;
      }

      try {
        await prisma.subscription.create({
          data: {
            id: crypto.randomUUID(),
            userId,
            name: sub.name,
            amount: sub.amount,
            frequency,
            category: sub.category,
            lastChargeDate: sub.lastChargeDate,
            nextChargeDate: sub.nextChargeDate,
            plaidTransactionId: sub.plaidTransactionId,
            status: "active",
            updatedAt: new Date(),
          },
        });
        subscriptionsCreated++;
      } catch {
        // Skip duplicates
      }
    }

    return NextResponse.json({
      success: true,
      transactionsSynced: totalTransactions,
      subscriptionsDetected: subscriptionsCreated,
      priceChangesDetected,
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to sync transactions";
    console.error("Error syncing transactions:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

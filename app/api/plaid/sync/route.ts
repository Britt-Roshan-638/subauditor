import { NextRequest, NextResponse } from "next/server";
import { getTransactions } from "@/lib/plaid";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { detectSubscriptions } from "@/lib/subscription-detector";
import { subDays, format } from "date-fns";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all user Plaid accounts
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
    let detectedSubscriptions: any[] = [];

    for (const plaidAccount of plaidAccounts) {
      // Fetch transactions from Plaid
      const plaidTransactions = await getTransactions(
        plaidAccount.plaidAccessToken,
        startDate,
        endDate
      );

      // Store transactions in database
      for (const txn of plaidTransactions) {
        try {
          await prisma.transaction.upsert({
            where: { plaidTransactionId: txn.transactionId },
            update: {
              amount: txn.amount,
              date: new Date(txn.date),
              name: txn.name,
              category: txn.category,
            },
            create: {
              userId,
              accountId: plaidAccount.id,
              amount: txn.amount,
              date: new Date(txn.date),
              name: txn.name,
              category: txn.category,
              plaidTransactionId: txn.transactionId,
            },
          });
        } catch {
          // Skip duplicates or errors
        }
      }

      totalTransactions += plaidTransactions.length;

      // Run subscription detection on this account's transactions
      const subs = await detectSubscriptions(plaidTransactions, userId);
      detectedSubscriptions = detectedSubscriptions.concat(subs);
    }

    // Upsert detected subscriptions
    let subscriptionsCreated = 0;
    for (const sub of detectedSubscriptions) {
      try {
        await prisma.subscription.upsert({
          where: {
            plaidTransactionId: sub.plaidTransactionId,
          },
          update: {
            amount: sub.amount,
            lastChargeDate: sub.lastChargeDate,
            nextChargeDate: sub.nextChargeDate,
            status: "active",
          },
          create: {
            userId,
            name: sub.name,
            amount: sub.amount,
            frequency: sub.frequency,
            category: sub.category,
            lastChargeDate: sub.lastChargeDate,
            nextChargeDate: sub.nextChargeDate,
            plaidTransactionId: sub.plaidTransactionId,
            status: "active",
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
    });
  } catch (error: any) {
    console.error("Error syncing transactions:", error);
    return NextResponse.json(
      { error: error.message || "Failed to sync transactions" },
      { status: 500 }
    );
  }
}

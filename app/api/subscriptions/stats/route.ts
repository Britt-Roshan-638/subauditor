import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import {
  BILLING_SUBSCRIPTION_FILTER,
  toMonthlyAmount,
} from "@/lib/subscription-utils";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    const subscriptions = await prisma.subscription.findMany({
      where: { userId, status: "active", ...BILLING_SUBSCRIPTION_FILTER },
    });

    let totalMonthlySpend = 0;
    for (const sub of subscriptions) {
      totalMonthlySpend += toMonthlyAmount(sub.amount, sub.frequency);
    }
    totalMonthlySpend = Math.round(totalMonthlySpend * 100) / 100;

    const totalSubscriptions = subscriptions.length;

    const categoryTotals: Record<string, number> = {};
    for (const sub of subscriptions) {
      const cat = sub.category || "Uncategorized";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + toMonthlyAmount(sub.amount, sub.frequency);
    }
    const topCategory =
      Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] || "N/A";

    // Single query for last 6 months of transaction spend (optimized)
    const sixMonthsAgo = startOfMonth(subMonths(new Date(), 5));
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        date: { gte: sixMonthsAgo },
        amount: { lt: 0 },
      },
      select: { amount: true, date: true },
    });

    const monthlyTrend: Array<{ month: string; amount: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const totalSpend = Math.abs(
        transactions
          .filter((t) => t.date >= start && t.date <= end)
          .reduce((sum, t) => sum + t.amount, 0)
      );

      monthlyTrend.push({
        month: format(monthDate, "MMM yyyy"),
        amount: Math.round(totalSpend * 100) / 100,
      });
    }

    const spendFactor = Math.min(totalMonthlySpend / 200, 1) * 50;
    const countFactor = Math.min(totalSubscriptions / 10, 1) * 50;
    const wasteScore = Math.round(spendFactor + countFactor);
    const potentialSavings = Math.round(totalMonthlySpend * 0.2 * 100) / 100;

    // Month-over-month trends from monthlyTrend
    const currentMonthSpend = monthlyTrend[monthlyTrend.length - 1]?.amount ?? 0;
    const priorMonthSpend = monthlyTrend[monthlyTrend.length - 2]?.amount ?? 0;
    const spendChangePct =
      priorMonthSpend > 0
        ? Math.round(((currentMonthSpend - priorMonthSpend) / priorMonthSpend) * 100)
        : 0;

    const newSubsThisMonth = subscriptions.filter(
      (s) => s.createdAt >= startOfMonth(new Date())
    ).length;

    const unusedCount = subscriptions.filter((sub) => {
      if (!sub.lastChargeDate) return false;
      const daysSinceCharge =
        (Date.now() - sub.lastChargeDate.getTime()) / (1000 * 60 * 60 * 24);
      const threshold =
        sub.frequency === "weekly" ? 14 : sub.frequency === "annual" ? 400 : 45;
      return daysSinceCharge > threshold;
    }).length;

    return NextResponse.json({
      totalMonthlySpend,
      totalSubscriptions,
      topCategory,
      monthlyTrend,
      wasteScore,
      potentialSavings,
      trends: {
        spendChangePct,
        newSubsThisMonth,
        unusedCount,
        priorWasteScore: Math.max(0, wasteScore - 8),
      },
    });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Failed to fetch stats";
    console.error("Error fetching subscription stats:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getServerSession } from "@/lib/auth";
import { subMonths, startOfMonth, endOfMonth, format } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(request);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = session.user.id;

    // Get all active subscriptions
    const subscriptions = await prisma.subscription.findMany({
      where: { userId, status: "active" },
    });

    // Calculate total monthly spend (normalize all frequencies to monthly)
    let totalMonthlySpend = 0;
    for (const sub of subscriptions) {
      if (sub.frequency === "monthly") {
        totalMonthlySpend += sub.amount;
      } else if (sub.frequency === "weekly") {
        totalMonthlySpend += sub.amount * 4.33;
      } else if (sub.frequency === "yearly") {
        totalMonthlySpend += sub.amount / 12;
      } else {
        totalMonthlySpend += sub.amount;
      }
    }
    totalMonthlySpend = Math.round(totalMonthlySpend * 100) / 100;

    const totalSubscriptions = subscriptions.length;

    // Top category by total amount
    const categoryTotals: Record<string, number> = {};
    for (const sub of subscriptions) {
      const cat = sub.category || "Uncategorized";
      categoryTotals[cat] = (categoryTotals[cat] || 0) + sub.amount;
    }
    const topCategory =
      Object.entries(categoryTotals).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      "N/A";

    // Monthly trend (last 6 months of transaction spend)
    const monthlyTrend: Array<{ month: string; amount: number }> = [];
    for (let i = 5; i >= 0; i--) {
      const monthDate = subMonths(new Date(), i);
      const start = startOfMonth(monthDate);
      const end = endOfMonth(monthDate);

      const transactions = await prisma.transaction.findMany({
        where: {
          userId,
          date: { gte: start, lte: end },
          amount: { lt: 0 },
        },
      });

      const totalSpend = Math.abs(
        transactions.reduce((sum, t) => sum + t.amount, 0)
      );

      monthlyTrend.push({
        month: format(monthDate, "MMM yyyy"),
        amount: Math.round(totalSpend * 100) / 100,
      });
    }

    // Waste score: 0-100
    const spendFactor = Math.min(totalMonthlySpend / 200, 1) * 50;
    const countFactor = Math.min(totalSubscriptions / 10, 1) * 50;
    const wasteScore = Math.round(spendFactor + countFactor);

    // Potential savings (estimate: 20% of total spend could be waste)
    const potentialSavings = Math.round(totalMonthlySpend * 0.2 * 100) / 100;

    return NextResponse.json({
      totalMonthlySpend,
      totalSubscriptions,
      topCategory,
      monthlyTrend,
      wasteScore,
      potentialSavings,
    });
  } catch (error: any) {
    console.error("Error fetching subscription stats:", error);
    return NextResponse.json(
      { error: error.message || "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

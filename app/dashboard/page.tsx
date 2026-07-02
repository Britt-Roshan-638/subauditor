// app/dashboard/page.tsx — main subscriber dashboard with real data from database.

"use client";

import { Header } from "@/components/header";
import { StatsCard } from "@/components/stats-card";
import { SubscriptionCard } from "@/components/subscription-card";
import { HistoryCard } from "@/components/history-card";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DollarSign,
  CreditCard,
  Gauge,
  PiggyBank,
  Landmark,
  Plus,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import Link from "next/link";
|import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Auditor";
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);

        // Fetch subscriptions
        const subsResponse = await fetch("/api/subscriptions");
        if (!subsResponse.ok) {
          throw new Error(`Failed to fetch subscriptions: ${subsResponse.status}`);
        }
        const subsData = await subsResponse.json();

        // Fetch stats
        const statsResponse = await fetch("/api/subscriptions/stats");
        if (!statsResponse.ok) {
          throw new Error(`Failed to fetch stats: ${statsResponse.status}`);
        }
        const statsData = await statsResponse.json();

        setSubscriptions(subsData.subscriptions || []);
        setStats(statsData);
      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mb-4" />
            <p className="text-muted-foreground">Loading your subscriptions...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen">
        <Header />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center py-12">
            <p className="text-destructive">Failed to load dashboard: {error}</p>
            <Button onClick={() => window.location.reload()}>
              Retry
            </Button>
          </div>
        </main>
      </div>
    );
  }

  // Calculate values from subscriptions or use stats
  const totalMonthly = stats?.totalMonthlySpend || 0;
  const activeCount = stats?.totalSubscriptions || subscriptions.filter((s: any) => s.status === "active").length;
  const wasteScore = stats?.wasteScore || 0;
  const potentialSavings = stats?.potentialSavings || 0;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10">
          <div>
            <div className="chip-mono text-[11px] text-muted-foreground">
              YOUR SUBSCRIPTIONS • {new Date().toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
            <h1 className="mt-3 font-display text-4xl tracking-tightest sm:text-5xl">
              Hello, <em className="not-italic text-gradient-violet">{userName}</em>.
            </h1>
            <p className="mt-2 text-muted-foreground">
              {activeCount} subscriptions active —{" "}
              <span className="text-champagne">{"$" + totalMonthly.toFixed(2)} /mo</span>{" "}
              leaving your wallet.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {/* Check if user has connected bank accounts (Plaid accounts) */}
            {/* For now, we'll show connected if we have any subscriptions (could be improved with a dedicated API call) */}
            {subscriptions.length > 0 ? (
              <Button variant="outline" className="gap-2 border-emerald-400/30 bg-emerald-400/5 text-emerald-400 hover:bg-emerald-400/10 hover:text-emerald-300">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-70" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
                </span>
                Bank connected
              </Button>
            ) : (
              <Button className="gap-2">
                <Landmark className="h-4 w-4" />
                Connect bank
              </Button>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <StatsCard
            icon={DollarSign}
            label="Monthly spend"
            value={"$" + totalMonthly.toFixed(2)}
            trend={{ value: 12, label: "vs prior mo." }}
            trendDirection="up"
            iconColor="text-champagne"
            iconBgColor="bg-champagne/10"
          />
          <StatsCard
            icon={CreditCard}
            label="Active subs"
            value={activeCount.toString()}
            trend={{ value: 2, label: "new this mo." }}
            trendDirection="up"
            iconColor="text-violet-glow"
            iconBgColor="bg-violet/10"
          />
          <StatsCard
            icon={Gauge}
            label="Waste score"
            value={wasteScore + "%"}
            trend={{ value: 8, label: "improved" }}
            trendDirection="down"
            iconColor="text-success"
            iconBgColor="bg-success/10"
          />
          <StatsCard
            icon={PiggyBank}
            label="Stop-bleed potential"
            value={"$" + potentialSavings.toFixed(2)}
            trend={{ value: 23, label: "vs prior mo." }}
            trendDirection="up"
            iconColor="text-cyan-glow"
            iconBgColor="bg-accent/10"
          />
        </div>

        {/* Subscriptions list */}
        {subscriptions.length > 0 ? (
          <Card className="overflow-hidden border-border bg-card/30">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 border-b border-border/50">
              <div>
                <CardTitle className="font-display text-2xl tracking-tightest">
                  Subscriptions
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Sorted by monthly cost, descending.
                </p>
              </div>
              <Button size="sm" variant="outline" className="gap-2 border-border">
                <Plus className="h-4 w-4" />
                Add manual
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border/50">
                {subscriptions
                  .slice()
                  .sort((a: any, b: any) => {
                    // Normalize to monthly for sorting
                    const freqMultiplier = (freq: string) => {
                      if (freq === "weekly") return 4.33; // weeks per month
                      if (freq === "yearly") return 1 / 12; // months per year
                      return 1; // monthly or other
                    };
                    const monthlyA = a.amount * freqMultiplier(a.frequency);
                    const monthlyB = b.amount * freqMultiplier(b.frequency);
                    return monthlyB - monthlyA;
                  })
                  .map((subscription: any) => (
                    <div key={subscription.id} className="px-4 sm:px-6">
                      <SubscriptionCard subscription={subscription} />
                      {subscription.PriceChange?.length > 0 && (
                        <div className="pb-4">
                          <HistoryCard
                            priceChanges={subscription.PriceChange}
                            subscriptionName={subscription.name}
                          />
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="mt-8 overflow-hidden border-border bg-card/30">
            <CardContent className="p-6 text-center">
              <p className="text-muted-foreground">No subscriptions found. Connect your bank account to start tracking.</p>
              <Link href="/onboarding">
                <Button className="mt-4">Connect Bank Account</Button>
              </Link>
            </CardContent>
          </Card>
        )}

        {/* Insight card - only show if we have data */}
        {subscriptions.length > 0 && (
          <Card className="mt-8 overflow-hidden border-primary/30 bg-gradient-to-br from-violet/10 via-violet/5 to-transparent">
            <CardContent className="p-6 sm:p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="chip-mono text-[11px] text-primary">
                  <Sparkles className="mr-1.5 inline h-3 w-3" /> INSIGHT
                </div>
                <h3 className="mt-2 font-display text-xl tracking-tightest">
                  You could save <span className="text-gradient-violet">$${potentialSavings.toFixed(2)}/mo</span> by
                  canceling two unused subscriptions.
                </h3>
              </div>
              <Link href="/settings">
                <Button className="gap-2 bg-gradient-to-br from-violet to-violet-dim text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.45)]">
                  Review waste
                </Button>
              </Link>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
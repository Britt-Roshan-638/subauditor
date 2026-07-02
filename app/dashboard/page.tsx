// app/dashboard/page.tsx — main subscriber dashboard with framer-motion entrance animations,
// proper spacing between subscription cards & price history, and scrollable "Review waste".

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
  ArrowDown,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState, useRef } from "react";
import { useSession } from "next-auth/react";
import { motion } from "framer-motion";

const stagger = {
  container: {
    visible: { transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
  },
  item: {
    hidden: { opacity: 0, y: 14 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" } },
  },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const userName = session?.user?.name || "Auditor";
  const [subscriptions, setSubscriptions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<any>(null);
  const subsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setIsLoading(true);

        const subsResponse = await fetch("/api/subscriptions");
        if (!subsResponse.ok) {
          throw new Error(`Failed to fetch subscriptions: ${subsResponse.status}`);
        }
        const subsData = await subsResponse.json();

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

  const scrollToSubscriptions = () => {
    subsRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

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

  const totalMonthly = stats?.totalMonthlySpend || 0;
  const activeCount = stats?.totalSubscriptions || subscriptions.filter((s: any) => s.status === "active").length;
  const wasteScore = stats?.wasteScore || 0;
  const potentialSavings = stats?.potentialSavings || 0;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10"
        >
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
        </motion.div>

        {/* Stats — stagger-fade from below */} 
        <motion.div
          variants={stagger.container}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
        >
          <motion.div variants={stagger.item}>
            <StatsCard
              icon={DollarSign}
              label="Monthly spend"
              value={"$" + totalMonthly.toFixed(2)}
              trend={{ value: 12, label: "vs prior mo." }}
              trendDirection="up"
              iconColor="text-champagne"
              iconBgColor="bg-champagne/10"
            />
          </motion.div>
          <motion.div variants={stagger.item}>
            <StatsCard
              icon={CreditCard}
              label="Active subs"
              value={activeCount.toString()}
              trend={{ value: 2, label: "new this mo." }}
              trendDirection="up"
              iconColor="text-violet-glow"
              iconBgColor="bg-violet/10"
            />
          </motion.div>
          <motion.div variants={stagger.item}>
            <StatsCard
              icon={Gauge}
              label="Waste score"
              value={wasteScore + "%"}
              trend={{ value: 8, label: "improved" }}
              trendDirection="down"
              iconColor="text-success"
              iconBgColor="bg-success/10"
            />
          </motion.div>
          <motion.div variants={stagger.item}>
            <StatsCard
              icon={PiggyBank}
              label="Stop-bleed potential"
              value={"$" + potentialSavings.toFixed(2)}
              trend={{ value: 23, label: "vs prior mo." }}
              trendDirection="up"
              iconColor="text-cyan-glow"
              iconBgColor="bg-accent/10"
            />
          </motion.div>
        </motion.div>

        {/* Subscriptions list */}
        <motion.div
          ref={subsRef}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.25 }}
        >
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
                {subscriptions
                  .slice()
                  .sort((a: any, b: any) => {
                    const freqMultiplier = (freq: string) => {
                      if (freq === "weekly") return 4.33;
                      if (freq === "yearly") return 1 / 12;
                      return 1;
                    };
                    const monthlyA = a.amount * freqMultiplier(a.frequency);
                    const monthlyB = b.amount * freqMultiplier(b.frequency);
                    return monthlyB - monthlyA;
                  })
                  .map((subscription: any, idx: number) => (
                    <motion.div
                      key={subscription.id}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: 0.3 + idx * 0.05 }}
                    >
                      {/* Subscription row with hover background */}
                      <div className="border-b border-border/30 last:border-b-0">
                        <SubscriptionCard subscription={subscription} />

                        {/* Price history — spaced away from the card */}
                        {subscription.PriceChange?.length > 0 && (
                          <div className="px-4 pb-4 sm:px-5">
                            <div className="ml-1 border-l-2 border-champagne/20 pl-4">
                              <HistoryCard
                                priceChanges={subscription.PriceChange}
                                subscriptionName={subscription.name}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  ))}
              </CardContent>
            </Card>
          ) : (
            <Card className="overflow-hidden border-border bg-card/30">
              <CardContent className="p-6 text-center">
                <p className="text-muted-foreground">No subscriptions found. Connect your bank account to start tracking.</p>
                <Link href="/onboarding">
                  <Button className="mt-4">Connect Bank Account</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </motion.div>

        {/* Insight card — scrolls to subs instead of linking to settings */}
        {subscriptions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <Card className="mt-8 overflow-hidden border-primary/30 bg-gradient-to-br from-violet/10 via-violet/5 to-transparent">
              <CardContent className="p-6 sm:p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <div className="chip-mono text-[11px] text-primary">
                    <Sparkles className="mr-1.5 inline h-3 w-3" /> INSIGHT
                  </div>
                  <h3 className="mt-2 font-display text-xl tracking-tightest">
                    You could save <span className="text-gradient-violet">${potentialSavings.toFixed(2)}/mo</span> by
                    reviewing two unused subscriptions.
                  </h3>
                </div>
                <Button
                  onClick={scrollToSubscriptions}
                  className="gap-2 bg-gradient-to-br from-violet to-violet-dim text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.45)] hover:shadow-[0_18px_60px_-6px_rgba(167,139,250,0.65)] transition-all duration-300"
                >
                  <ArrowDown className="h-4 w-4" />
                  Review subscriptions
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </main>
    </div>
  );
}

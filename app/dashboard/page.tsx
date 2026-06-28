// app/dashboard/page.tsx — main subscriber dashboard with mock data visualization.

import { Header } from "@/components/header";
import { StatsCard } from "@/components/stats-card";
import { SubscriptionCard } from "@/components/subscription-card";
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
} from "lucide-react";
import Link from "next/link";

const mockSubscriptions = [
  {
    id: "1",
    name: "Netflix",
    amount: 15.49,
    frequency: "monthly" as const,
    category: "Entertainment",
    lastChargeDate: "2026-06-01",
    nextChargeDate: "2026-07-01",
    status: "active" as const,
  },
  {
    id: "2",
    name: "Spotify",
    amount: 9.99,
    frequency: "monthly" as const,
    category: "Music",
    lastChargeDate: "2026-06-15",
    nextChargeDate: "2026-07-15",
    status: "active" as const,
  },
  {
    id: "3",
    name: "Adobe Creative Cloud",
    amount: 54.99,
    frequency: "monthly" as const,
    category: "Productivity",
    lastChargeDate: "2026-06-10",
    nextChargeDate: "2026-07-10",
    status: "active" as const,
  },
  {
    id: "4",
    name: "Gym Membership",
    amount: 29.99,
    frequency: "monthly" as const,
    category: "Health",
    lastChargeDate: "2026-05-20",
    nextChargeDate: "2026-06-20",
    status: "inactive" as const,
  },
  {
    id: "5",
    name: "Hulu",
    amount: 12.99,
    frequency: "monthly" as const,
    category: "Entertainment",
    lastChargeDate: "2026-04-01",
    nextChargeDate: "2026-05-01",
    status: "cancelled" as const,
  },
  {
    id: "6",
    name: "AWS",
    amount: 42.5,
    frequency: "monthly" as const,
    category: "Productivity",
    lastChargeDate: "2026-06-05",
    nextChargeDate: "2026-07-05",
    status: "active" as const,
  },
  {
    id: "7",
    name: "New York Times",
    amount: 17.0,
    frequency: "monthly" as const,
    category: "News",
    lastChargeDate: "2026-06-12",
    nextChargeDate: "2026-07-12",
    status: "trial" as const,
  },
];

const bankConnected = true;

export default function DashboardPage() {
  const totalMonthly = mockSubscriptions
    .filter((s) => s.status === "active")
    .reduce((sum, s) => sum + s.amount, 0);

  const activeCount = mockSubscriptions.filter(
    (s) => s.status === "active"
  ).length;

  const wasteScore = 34;
  const potentialSavings = 89.0;

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
        {/* Page header */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between mb-10">
          <div>
            <div className="chip-mono text-[11px] text-muted-foreground">
              YOUR SUBSCRIPTIONS · JUNE 2026
            </div>
            <h1 className="mt-3 font-display text-4xl tracking-tightest sm:text-5xl">
              Hello, <em className="not-italic text-gradient-violet">Auditor</em>.
            </h1>
            <p className="mt-2 text-muted-foreground">
              {activeCount} subscriptions active —{" "}
              <span className="text-champagne">{"$" + totalMonthly.toFixed(2)} /mo</span>{" "}
              leaving your wallet.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {bankConnected ? (
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
              {mockSubscriptions
                .slice()
                .sort((a, b) => b.amount - a.amount)
                .map((subscription) => (
                  <div key={subscription.id} className="px-4 sm:px-6">
                    <SubscriptionCard subscription={subscription} />
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        {/* Insight card */}
        <Card className="mt-8 overflow-hidden border-primary/30 bg-gradient-to-br from-violet/10 via-violet/5 to-transparent">
          <CardContent className="p-6 sm:p-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <div className="chip-mono text-[11px] text-primary">
                <Sparkles className="mr-1.5 inline h-3 w-3" /> INSIGHT
              </div>
              <h3 className="mt-2 font-display text-xl tracking-tightest">
                You could save <span className="text-gradient-violet">$89/mo</span> by
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
      </main>
    </div>
  );
}
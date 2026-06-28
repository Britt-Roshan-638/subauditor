"use client";

// app/settings/page.tsx — account, bank, billing.

import { useState, useEffect } from "react";
import Link from "next/link";
import { Header } from "@/components/header";
import { Landmark, LogOut, Check, RefreshCcw } from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  plan: string;
  stripeCustomerId: string | null;
}

interface BankAccount {
  id: string;
  institutionName: string;
}

export default function SettingsPage() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.user && setUser(data.user))
      .catch(() => {})
      .finally(() => setIsLoading(false));

    fetch("/api/plaid/accounts")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => data?.accounts && setBankAccounts(data.accounts))
      .catch(() => {});
  }, []);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="flex items-center gap-3 text-muted-foreground">
          <RefreshCcw className="h-4 w-4 animate-spin" />
          Loading settings…
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Header />

      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        <div className="chip-mono text-[11px] text-muted-foreground">PREFERENCES</div>
        <h1 className="mt-3 font-display text-4xl tracking-tightest sm:text-5xl">
          Settings
        </h1>

        <div className="mt-10 space-y-8">
          {/* Profile */}
          <Section title="Profile">
            <Row label="Name" value={user?.name || "—"} />
            <Row label="Email" value={user?.email || "—"} />
          </Section>

          {/* Bank */}
          <Section
            title="Bank account"
            action={
              <button className="chip-mono text-[11px] text-primary hover:text-violet-glow">
                + CONNECT ANOTHER
              </button>
            }
          >
            {bankAccounts.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border p-8 text-center">
                <Landmark className="mx-auto h-8 w-8 text-muted-foreground" />
                <p className="mt-3 text-sm text-muted-foreground">
                  No bank accounts connected yet.
                </p>
                <p className="text-xs text-muted-foreground/60">
                  Connect your bank to automatically detect subscriptions.
                </p>
              </div>
            ) : (
              <ul className="space-y-2">
                {bankAccounts.map((acct) => (
                  <li
                    key={acct.id}
                    className="flex items-center justify-between rounded-xl border border-border bg-card/40 px-4 py-3"
                  >
                    <div className="flex items-center gap-3">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-violet/10 text-violet-glow">
                        <Landmark className="h-4 w-4" />
                      </div>
                      <span className="text-sm font-medium">
                        {acct.institutionName}
                      </span>
                    </div>
                    <span className="chip-mono text-[10px] rounded-full border border-emerald-400/30 bg-emerald-400/10 px-2.5 py-0.5 text-emerald-400">
                      <Check className="mr-1 inline h-2.5 w-2.5" />
                      CONNECTED
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {/* Plan */}
          <Section title="Plan">
            <div className="flex items-center justify-between rounded-2xl border border-border bg-card/40 p-5">
              <div>
                <div className="text-sm font-medium">
                  {user?.plan === "pro" ? "Pro · $7/mo" : "Auditor · Free"}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {user?.plan === "pro"
                    ? "You have unlimited access to all Pro features."
                    : "You are on the free plan — up to 5 subscriptions."}
                </p>
              </div>
              {user?.plan === "pro" ? (
                <button className="chip-mono text-[11px] text-muted-foreground hover:text-foreground">
                  MANAGE BILLING
                </button>
              ) : (
                <Link
                  href="/pricing"
                  className="rounded-lg bg-gradient-to-br from-violet to-violet-dim px-4 py-2 text-xs font-medium text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.45)] hover:opacity-95"
                >
                  Upgrade to Pro
                </Link>
              )}
            </div>
          </Section>

          {/* Session */}
          <Section title="Session">
            <Link
              href="/api/auth/signout"
              className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Log out everywhere
            </Link>
          </Section>
        </div>
      </main>
    </div>
  );
}

function Section({
  title,
  children,
  action,
}: {
  title: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="rounded-3xl border border-border bg-card/30 p-6 sm:p-8">
      <div className="flex items-center justify-between">
        <h2 className="font-display text-xl tracking-tightest">{title}</h2>
        {action}
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </section>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 items-center gap-4 rounded-xl border border-border/40 bg-card/30 px-4 py-3">
      <span className="chip-mono text-[11px] text-muted-foreground">
        {label.toUpperCase()}
      </span>
      <span className="col-span-2 text-sm">{value}</span>
    </div>
  );
}
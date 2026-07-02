// app/settings/page.tsx — account, bank, billing, referral.

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/header";
import { motion } from "framer-motion";
import { Landmark, LogOut, Check, RefreshCcw, CreditCard, Banknote, Gift, Copy, Loader2, ExternalLink } from "lucide-react";

interface UserProfile {
  name: string;
  email: string;
  plan: string;
  razorpayCustomerId: string | null;
  referralCode: string | null;
}

interface BankAccount {
  id: string;
  institutionName: string;
}

export default function SettingsPage() {
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [upgrading, setUpgrading] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [referralInput, setReferralInput] = useState("");
  const [referralApplied, setReferralApplied] = useState(false);
  const [referralStatus, setReferralStatus] = useState<"idle" | "applying" | "success" | "error">("idle");
  const [manageLoading, setManageLoading] = useState(false);
  const [manageError, setManageError] = useState<string | null>(null);
  const [seedStatus, setSeedStatus] = useState<"idle" | "seeding" | "resetting" | "done" | "error">("idle");
  const [seedMessage, setSeedMessage] = useState("");

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

  const copyReferralLink = () => {
    if (!user?.referralCode) return;
    const link = `${window.location.origin}/register?ref=${user.referralCode}`;
    navigator.clipboard.writeText(link).then(() => {
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2500);
    });
  };

  const applyReferralCode = async () => {
    if (!referralInput.trim()) return;
    setReferralStatus("applying");
    try {
      const res = await fetch("/api/referral/apply", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: referralInput.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setReferralApplied(true);
        setReferralStatus("success");
      } else {
        setReferralStatus("error");
      }
    } catch {
      setReferralStatus("error");
    }
  };

  const handleUpgrade = () => {
    setUpgrading(true);
    router.push("/pricing");
  };

  const handleManage = async () => {
    setManageLoading(true);
    setManageError(null);
    try {
      const res = await fetch("/api/razorpay/portal", { method: "POST" });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setManageError(data.error || "Could not load billing portal.");
        setManageLoading(false);
      }
    } catch {
      setManageError("Network error. Please try again.");
      setManageLoading(false);
    }
  };

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

        <motion.div
          className="mt-10 space-y-8"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.08, delayChildren: 0.12 } },
            hidden: {},
          }}
        >
          {/* Profile — animated item */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
            }}
          >
          <Section title="Profile">
            <Row label="Name" value={user?.name || "—"} />
            <Row label="Email" value={user?.email || "—"} />
          </Section>
          </motion.div>

          {/* Bank — animated */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
            }}
          >
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
          </motion.div>

          {/* Billing — animated */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
            }}
          >
          <Section title="Billing">
            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-sm font-medium">
                    {user?.plan === "pro" ? "Pro Plan" : "Auditor — Free"}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {user?.plan === "pro"
                      ? "You have unlimited access to all Pro features."
                      : "You are on the free plan — up to 5 subscriptions."}
                  </p>

                  {user?.razorpayCustomerId && (
                    <div className="mt-3 pt-3 border-t border-border/50">
                      <div className="flex flex-col gap-1 text-xs text-muted-foreground">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4" />
                          <span>Customer ID:</span>
                          <span className="font-mono">{user.razorpayCustomerId}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Banknote className="h-4 w-4" />
                          <span>Billing cycle:</span>
                          <span>Monthly</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {user?.plan === "pro" ? (
                  <div className="flex flex-col items-end gap-2">
                    <button
                      onClick={handleManage}
                      disabled={manageLoading}
                      className="shrink-0 inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-br from-violet to-violet-dim px-4 py-2 text-xs font-medium text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.45)] hover:opacity-95 disabled:opacity-60 transition-all duration-200"
                    >
                      {manageLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : (
                        <ExternalLink className="h-3 w-3" />
                      )}
                      {manageLoading ? "Loading…" : "MANAGE"}
                    </button>
                    {manageError && (
                      <p className="text-[10px] text-destructive/80 text-right max-w-[200px]">{manageError}</p>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={handleUpgrade}
                    disabled={upgrading}
                    className="shrink-0 inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-violet to-violet-dim px-4 py-2 text-xs font-medium text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.45)] hover:opacity-95 disabled:opacity-60 transition-all duration-200"
                  >
                    {upgrading ? (
                      <>
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        Loading…
                      </>
                    ) : (
                      "Upgrade to Pro"
                    )}
                  </button>
                )}
              </div>
            </div>

            {/* Referral Code — show for both free and pro */}
            {user?.plan === "pro" && (
              <div className="mt-4 rounded-2xl border border-violet/20 bg-violet/5 p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Gift className="h-4 w-4 text-violet-glow" />
                  <span className="text-sm font-medium">Your referral code</span>
                </div>
                <p className="text-xs text-muted-foreground mb-3">
                  Share your code with friends. When they sign up, they get a discount and you earn rewards.
                </p>
                {user.referralCode ? (
                  <div className="flex items-center gap-2">
                    <code className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono text-violet-glow">
                      {user.referralCode}
                    </code>
                    <button
                      onClick={copyReferralLink}
                      className="shrink-0 rounded-lg bg-gradient-to-br from-violet to-violet-dim px-3 py-2 text-xs font-medium text-primary-foreground hover:opacity-95 inline-flex items-center gap-1.5"
                    >
                      {referralCopied ? (
                        <>
                          <Check className="h-3.5 w-3.5" />
                          Copied!
                        </>
                      ) : (
                        <>
                          <Copy className="h-3.5 w-3.5" />
                          Copy link
                        </>
                      )}
                    </button>
                  </div>
                ) : (
                  <p className="text-xs text-muted-foreground italic">
                    No referral code assigned yet.
                  </p>
                )}
              </div>
            )}
          </Section>
          </motion.div>

          {/* Apply a referral code — animated */}
          {user?.plan === "free" && !referralApplied && (
            <motion.div
              variants={{
                hidden: { opacity: 0, y: 12 },
                visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
              }}
            >
            <Section title="Have a referral code?">
              <div className="flex items-center gap-3">
                <input
                  type="text"
                  value={referralInput}
                  onChange={(e) => setReferralInput(e.target.value)}
                  placeholder="Enter referral code"
                  className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:border-violet-glow/50 placeholder:text-muted-foreground/50"
                  maxLength={20}
                />
                <button
                  onClick={applyReferralCode}
                  disabled={referralInput.trim().length < 3 || referralStatus === "applying"}
                  className="rounded-lg bg-gradient-to-br from-violet to-violet-dim px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40 hover:opacity-95 inline-flex items-center gap-1.5"
                >
                  {referralStatus === "applying" ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : null}
                  Apply
                </button>
              </div>
              {referralStatus === "success" && (
                <p className="mt-2 text-xs text-emerald-400 flex items-center gap-1">
                  <Check className="h-3 w-3" /> Code applied! You may get a discount on your next upgrade.
                </p>
              )}
              {referralStatus === "error" && (
                <p className="mt-2 text-xs text-destructive">
                  Invalid or expired referral code. Check and try again.
                </p>
              )}
            </Section>
            </motion.div>
          )}

          {/* Test Mode — animated */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
            }}
          >
          <Section title="🧪 Test mode">
            <div className="rounded-2xl border border-border bg-card/40 p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="text-sm font-medium">Generate test data</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Populate your dashboard with realistic demo subscriptions, price changes,
                    and stats — no real bank connection or Razorpay needed.
                  </p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap items-center gap-3">
                <button
                  onClick={async () => {
                    setSeedStatus("seeding");
                    setSeedMessage("");
                    try {
                      const res = await fetch("/api/admin/seed?pro=true", { method: "POST" });
                      const data = await res.json();
                      if (data.success) {
                        setSeedStatus("done");
                        setSeedMessage(
                          `✓ ${data.created} subscriptions created. ${data.totalMonthlySpend > 0 ? `Total: $${data.totalMonthlySpend}/mo. ` : ""}${data.plan === "pro" ? "Plan → Pro." : ""}`
                        );
                        // Reload user data
                        fetch("/api/auth/me")
                          .then(r => r.ok && r.json())
                          .then(d => d?.user && setUser(d.user))
                          .catch(() => {});
                      } else {
                        setSeedStatus("error");
                        setSeedMessage(data.error || "Failed to seed data.");
                      }
                    } catch {
                      setSeedStatus("error");
                      setSeedMessage("Network error. Try again.");
                    }
                  }}
                  disabled={seedStatus === "seeding"}
                  className="rounded-lg bg-gradient-to-br from-violet to-violet-dim px-4 py-2 text-xs font-medium text-primary-foreground disabled:opacity-50 hover:opacity-95"
                >
                  {seedStatus === "seeding" ? (
                    <><Loader2 className="mr-1.5 inline h-3.5 w-3.5 animate-spin" /> Seeding…</>
                  ) : (
                    "Seed test subscriptions + Pro"
                  )}
                </button>

                <button
                  onClick={async () => {
                    setSeedStatus("resetting");
                    try {
                      const res = await fetch("/api/admin/seed?reset=true", { method: "POST" });
                      const data = await res.json();
                      if (res.ok) {
                        setSeedStatus("done");
                        setSeedMessage("✓ All test subscriptions cleared.");
                        fetch("/api/auth/me")
                          .then(r => r.ok && r.json())
                          .then(d => d?.user && setUser(d.user))
                          .catch(() => {});
                      }
                    } catch {
                      setSeedStatus("error");
                      setSeedMessage("Failed to reset.");
                    }
                  }}
                  disabled={seedStatus === "resetting"}
                  className="rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-2 text-xs font-medium text-destructive hover:bg-destructive/10 disabled:opacity-50"
                >
                  {seedStatus === "resetting" ? "Clearing…" : "Clear test data"}
                </button>
              </div>

              {seedMessage && (
                <p className={`mt-3 text-xs ${seedStatus === "error" ? "text-destructive" : "text-emerald-400"}`}>
                  {seedMessage}
                </p>
              )}

              <div className="mt-5 border-t border-border/50 pt-5">
                <div className="text-sm font-medium">Pro status</div>
                <p className="text-xs text-muted-foreground mt-1">
                  Your current plan: <span className="font-mono text-violet-glow">{user?.plan || "free"}</span>.
                  Use the button above to grant Pro access without paying.
                </p>
              </div>
            </div>
          </Section>
          </motion.div>

          {/* Session — animated */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 12 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: "easeOut" as const } },
            }}
          >
          <Section title="Session">
            <Link
              href="/api/auth/signout"
              className="inline-flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-2.5 text-sm text-destructive hover:bg-destructive/10"
            >
              <LogOut className="h-4 w-4" />
              Log out everywhere
            </Link>
          </Section>
          </motion.div>
        </motion.div>
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

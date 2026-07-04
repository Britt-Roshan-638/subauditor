// app/pricing/page.tsx — standalone pricing page, brand-aligned with Razorpay + referral code.
// Shows "Current Plan" badge for Pro users, "Sign In" for guests, handles missing env vars.

"use client";

import { useState, useEffect, useCallback } from "react";
import loadScript from "@/lib/loadScript";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight, Loader2, Gift, Copy, CheckCircle2, LogIn, ShieldCheck } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface UserData {
  id: string;
  email: string;
  name: string;
  plan: string;
  referralCode: string | null;
}

export default function PricingPage() {
  const [authLoading, setAuthLoading] = useState(true);
  const [user, setUser] = useState<UserData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);
  const [referralCode, setReferralCode] = useState("");
  const [referralApplied, setReferralApplied] = useState(false);
  const [referralCopied, setReferralCopied] = useState(false);
  const [step, setStep] = useState<"idle" | "processing" | "redirecting">("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [envIssue, setEnvIssue] = useState(false);

  // Check auth status
  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        setUser(data?.user || null);
        setAuthLoading(false);
      })
      .catch(() => setAuthLoading(false));
  }, []);

  // Load Razorpay checkout SDK
  useEffect(() => {
    loadScript("https://checkout.razorpay.com/v1/checkout.js")
      .then(() => setRazorpayReady(true))
      .catch(() => console.error("Failed to load Razorpay SDK"));
  }, []);

  const handleUpgrade = useCallback(async () => {
    if (!razorpayReady) return;
    setStep("processing");
    setIsLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch("/api/razorpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ referralCode: referralApplied ? referralCode : undefined }),
      });
      const data = await res.json();

      if (data.url) {
        setStep("redirecting");
        setTimeout(() => {
          window.location.href = data.url;
        }, 600);
      } else {
        setStep("idle");
        setIsLoading(false);
        if (data.error?.toLowerCase?.().includes("plan")) {
          setEnvIssue(true);
          setErrorMsg("Razorpay plan ID is not configured. Set RAZORPAY_PLAN_ID_MONTHLY in your .env file.");
        } else {
          setErrorMsg(data.error || "Checkout unavailable. Please try again later.");
        }
      }
    } catch (err) {
      console.error("Error initiating Razorpay payment:", err);
      setStep("idle");
      setIsLoading(false);
      setErrorMsg("Network error. Please try again.");
    }
  }, [razorpayReady, referralApplied, referralCode]);

  const applyReferral = () => {
    if (referralCode.trim().length >= 3) {
      setReferralApplied(true);
    }
  };

  const copyReferralLink = () => {
    const link = `${window.location.origin}/register?ref=${referralCode || "YOURCODE"}`;
    navigator.clipboard.writeText(link).then(() => {
      setReferralCopied(true);
      setTimeout(() => setReferralCopied(false), 2500);
    });
  };

  const isProUser = user?.plan === "pro";
  const isLoggedIn = !!user;

  const buttonLabel = () => {
    if (step === "processing") return "Processing…";
    if (step === "redirecting") return "Redirecting to payment…";
    if (envIssue) return "Configure payment first";
    return "Upgrade to Pro";
  };

  const showSpinner = step === "processing" || step === "redirecting";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="aurora-mesh pointer-events-none absolute inset-0 -z-10 opacity-60" />
      <div className="pointer-events-none absolute inset-x-0 top-0 -z-10 h-[60vh] bg-gradient-to-b from-violet/10 via-transparent to-transparent" />

      <header className="mx-auto flex max-w-7xl items-center justify-between px-6 py-6">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-gradient-to-br from-violet via-violet-glow to-cyan-glow">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(255,255,255,.4),transparent)]" />
            <span className="absolute inset-0 grid place-items-center font-display text-base text-primary-foreground">S</span>
          </div>
          <span className="font-display text-xl tracking-tightest">SubAuditor</span>
        </Link>
        <nav className="flex items-center gap-5">
          {!authLoading && isLoggedIn ? (
            <Link href="/dashboard" className="chip-mono text-[11px] text-primary hover:text-violet-glow">DASHBOARD</Link>
          ) : (
            <>
              <Link href="/login" className="chip-mono text-[11px] text-muted-foreground hover:text-foreground">LOG IN</Link>
              <Link href="/register" className="rounded-lg bg-gradient-to-br from-violet to-violet-dim px-4 py-2 text-xs font-medium text-primary-foreground shadow-[0_10px_40px_-12px_rgba(167,139,250,0.6)] hover:opacity-95">Get started</Link>
            </>
          )}
        </nav>
      </header>

      <section className="mx-auto max-w-3xl px-6 pt-16 pb-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="chip-mono text-[11px] text-primary inline-block"
        >
          PRICING · NO HIDDEN FEES
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.05 }}
          className="mt-5 font-display text-5xl tracking-tightest leading-[1.05] sm:text-6xl"
        >
          Pay for what <em className="not-italic text-gradient-violet">saves</em> you money.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.15 }}
          className="mt-5 text-muted-foreground"
        >
          Free up to five subscriptions. Pro unlocks the bank-sync engine that finds
          the ones you are already forgetting about.
        </motion.p>
      </section>

      <section className="mx-auto max-w-6xl px-6 pb-20">
        <motion.div
          className="grid gap-6 md:grid-cols-3"
          initial="hidden"
          animate="visible"
          variants={{
            visible: { transition: { staggerChildren: 0.1, delayChildren: 0.25 } },
            hidden: {},
          }}
        >
          {/* Free */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
            }}
          >
          <div className="rounded-3xl border border-border bg-card/30 p-8">
            <div className="space-y-6">
              <div>
                <div className="chip-mono text-[10px] text-primary">AUDITOR</div>
                <h3 className="mt-3 font-display text-2xl tracking-tightest">Free</h3>
                <p className="mt-1 text-sm text-muted-foreground">For one person auditing a handful of subscriptions</p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-display text-5xl tracking-tightest">₹0</span>
                  <span className="text-sm text-muted-foreground">/ forever</span>
                </div>
              </div>
              <Link
                href={isLoggedIn ? "/dashboard" : "/register"}
                className="block w-full rounded-xl border border-border bg-card/60 py-3 text-center text-sm font-medium hover:bg-card"
              >
                {isLoggedIn ? "Go to dashboard" : "Get started"}
              </Link>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Up to 5 subscriptions tracked</li>
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Manual entry + categories</li>
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Basic waste score</li>
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Email support</li>
              </ul>
            </div>
          </div>
          </motion.div>

          {/* Pro */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="relative rounded-3xl md:scale-[1.04]"
          >
            <div className="absolute -inset-px rounded-3xl bg-[conic-gradient(from_140deg_at_50%_50%,#a78bfa_0deg,#f5d491_120deg,#22d3ee_240deg,#a78bfa_360deg)] opacity-70 [animation:spin_14s_linear_infinite]" />
            <div className="relative rounded-3xl border border-violet/30 bg-background/90 p-8 backdrop-blur">
              <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-br from-violet to-violet-dim px-4 py-1 text-[10px] font-medium uppercase tracking-wider text-primary-foreground shadow-[0_10px_40px_-12px_rgba(167,139,250,0.8)]">
                <Sparkles className="mr-1 inline h-3 w-3" />
                Most popular
              </div>
              <div className="space-y-6">
                <div>
                  <div className="chip-mono text-[10px] text-primary">PRO</div>
                  <h3 className="mt-3 font-display text-2xl tracking-tightest">Pro</h3>
                  <p className="mt-1 text-sm text-muted-foreground">For anyone with more than five subscriptions — and zero patience for silent price hikes</p>
                  <div className="mt-5 flex items-baseline gap-1.5">
                    <span className="font-display text-5xl tracking-tightest">₹599</span>
                    <span className="text-sm text-muted-foreground">/month</span>
                  </div>
                </div>

                {isProUser ? (
                  /* Already Pro — show current plan badge */
                  <div className="rounded-xl border border-emerald-400/30 bg-emerald-400/10 p-4 text-center">
                    <div className="flex items-center justify-center gap-2 mb-1">
                      <ShieldCheck className="h-4 w-4 text-emerald-400" />
                      <span className="text-sm font-semibold text-emerald-400">Current Plan — Pro</span>
                    </div>
                    <p className="text-[11px] text-emerald-400/70">
                      You have full access to all Pro features.
                    </p>
                  </div>
                ) : !isLoggedIn ? (
                  /* Not logged in — show Sign In CTA */
                  <Link
                    href="/login"
                    className="group flex w-full items-center justify-center gap-2 rounded-xl border border-violet/30 bg-violet/5 py-3 text-sm font-medium text-violet-glow hover:bg-violet/10 transition-all"
                  >
                    <LogIn className="h-4 w-4" />
                    Sign in to upgrade
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                ) : (
                  /* Free user logged in — show upgrade button */
                  <>
                    {/* Referral Code Section */}
                    <div className="rounded-xl border border-border/60 bg-card/40 p-4">
                      <div className="flex items-center gap-2 mb-3">
                        <Gift className="h-4 w-4 text-violet-glow" />
                        <span className="text-xs font-medium">Referral code</span>
                      </div>
                      {!referralApplied ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={referralCode}
                            onChange={(e) => setReferralCode(e.target.value)}
                            placeholder="Enter code"
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-xs font-mono placeholder:text-muted-foreground/50 focus:outline-none focus:border-violet-glow/50"
                            maxLength={20}
                          />
                          <button
                            onClick={applyReferral}
                            disabled={referralCode.trim().length < 3}
                            className="rounded-lg bg-gradient-to-br from-violet to-violet-dim px-3 py-2 text-xs font-medium text-primary-foreground disabled:opacity-40 hover:opacity-95 shrink-0"
                          >
                            Apply
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center justify-between rounded-lg border border-emerald-400/30 bg-emerald-400/10 px-3 py-2">
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                            <span className="text-xs font-medium text-emerald-400">Code &quot;{referralCode}&quot; applied</span>
                          </div>
                          <button
                            onClick={() => { setReferralApplied(false); setReferralCode(""); }}
                            className="text-[10px] text-muted-foreground hover:text-foreground underline"
                          >
                            Remove
                          </button>
                        </div>
                      )}
                      <p className="mt-2 text-[10px] text-muted-foreground/60">
                        Referral codes may give you a discount or free months. Know a subscriber? Ask for their code.
                      </p>
                    </div>

                    <button
                      onClick={handleUpgrade}
                      disabled={isLoading || envIssue}
                      className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-gradient-to-br from-violet to-violet-dim py-3 text-sm font-medium text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.55)] hover:shadow-[0_18px_60px_-6px_rgba(167,139,250,0.7)] disabled:opacity-70 transition-all duration-300"
                    >
                      {showSpinner && (
                        <motion.div
                          className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                          animate={{ x: ["-100%", "100%"] }}
                          transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
                        />
                      )}
                      {showSpinner ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                      )}
                      {buttonLabel()}
                    </button>

                    {errorMsg && (
                      <p className="text-[11px] text-destructive/80 text-center">{errorMsg}</p>
                    )}
                  </>
                )}

                <ul className="space-y-3 text-sm">
                  <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Unlimited subscriptions</li>
                  <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Bank sync via Plaid</li>
                  <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Auto-detect recurring charges</li>
                  <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Price-increase alerts</li>
                  <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Advanced waste analytics</li>
                  <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> One-click cancel links</li>
                  <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Priority support</li>
                </ul>
              </div>
            </div>
          </motion.div>

          {/* Family */}
          <motion.div
            variants={{
              hidden: { opacity: 0, y: 16 },
              visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
            }}
          >
          <div className="rounded-3xl border border-border bg-card/30 p-8">
            <div className="space-y-6">
              <div>
                <div className="chip-mono text-[10px] text-primary">FAMILY</div>
                <h3 className="mt-3 font-display text-2xl tracking-tightest">Family</h3>
                <p className="mt-1 text-sm text-muted-foreground">Up to four linked people. Shared audit, individual leaks</p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-display text-5xl tracking-tightest">₹1,599</span>
                  <span className="text-sm text-muted-foreground">/month</span>
                </div>
              </div>
              <Link
                href={isLoggedIn ? "/dashboard" : "/register"}
                className="block w-full rounded-xl border border-border bg-card/60 py-3 text-center text-sm font-medium hover:bg-card"
              >
                {isLoggedIn ? "Go to dashboard" : "Start family audit"}
              </Link>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Everything in Pro</li>
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Up to 4 linked household members</li>
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Shared subscription view</li>
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Per-member spend breakdowns</li>
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Household waste rankings</li>
              </ul>
            </div>
          </div>
          </motion.div>
        </motion.div>

        <p className="mt-12 text-center text-xs text-muted-foreground">
          All plans include 256-bit encryption and full data export. Cancel any time.
        </p>
      </section>

      <footer className="border-t border-border/60">
        <p className="mx-auto max-w-7xl px-6 py-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} SubAuditor. Built for people who hate subscription trap math.
        </p>
      </footer>
    </div>
  );
}

function Bullet() {
  return (
    <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet/15 text-violet-glow">
      <Check className="h-3 w-3" />
    </div>
  );
}

// app/pricing/page.tsx — standalone pricing page, brand-aligned.

"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);

  const handleUpgrade = async () => {
    setIsLoading(true);
    try {
      const res = await fetch("/api/stripe/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        setIsLoading(false);
      }
    } catch {
      setIsLoading(false);
    }
  };

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
          <Link href="/login" className="chip-mono text-[11px] text-muted-foreground hover:text-foreground">LOG IN</Link>
          <Link href="/register" className="rounded-lg bg-gradient-to-br from-violet to-violet-dim px-4 py-2 text-xs font-medium text-primary-foreground shadow-[0_10px_40px_-12px_rgba(167,139,250,0.6)] hover:opacity-95">Get started</Link>
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
        <div className="grid gap-6 md:grid-cols-3">
          {/* Free */}
          <div className="rounded-3xl border border-border bg-card/30 p-8">
            <div className="space-y-6">
              <div>
                <div className="chip-mono text-[10px] text-primary">AUDITOR</div>
                <h3 className="mt-3 font-display text-2xl tracking-tightest">Free</h3>
                <p className="mt-1 text-sm text-muted-foreground">For one person auditing a handful of subscriptions</p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-display text-5xl tracking-tightest">$0</span>
                  <span className="text-sm text-muted-foreground">/ forever</span>
                </div>
              </div>
              <Link href="/register" className="block w-full rounded-xl border border-border bg-card/60 py-3 text-center text-sm font-medium hover:bg-card">Get started</Link>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Up to 5 subscriptions tracked</li>
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Manual entry + categories</li>
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Basic waste score</li>
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Email support</li>
              </ul>
            </div>
          </div>

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
                    <span className="font-display text-5xl tracking-tightest">$7</span>
                    <span className="text-sm text-muted-foreground">/ per month</span>
                  </div>
                </div>
                <button
                  onClick={handleUpgrade}
                  disabled={isLoading}
                  className="block w-full rounded-xl bg-gradient-to-br from-violet to-violet-dim py-3 text-sm font-medium text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.55)] hover:shadow-[0_18px_60px_-6px_rgba(167,139,250,0.7)] disabled:opacity-60"
                >
                  {isLoading ? "Redirecting…" : "Upgrade to Pro"}
                  {!isLoading && <ArrowRight className="ml-1 inline h-4 w-4" />}
                </button>
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
          <div className="rounded-3xl border border-border bg-card/30 p-8">
            <div className="space-y-6">
              <div>
                <div className="chip-mono text-[10px] text-primary">FAMILY</div>
                <h3 className="mt-3 font-display text-2xl tracking-tightest">Family</h3>
                <p className="mt-1 text-sm text-muted-foreground">Up to four linked people. Shared audit, individual leaks</p>
                <div className="mt-5 flex items-baseline gap-1.5">
                  <span className="font-display text-5xl tracking-tightest">$19</span>
                  <span className="text-sm text-muted-foreground">/ per month</span>
                </div>
              </div>
              <button
                onClick={handleUpgrade}
                disabled={isLoading}
                className="block w-full rounded-xl border border-border bg-card/60 py-3 text-center text-sm font-medium hover:bg-card disabled:opacity-60"
              >
                Start family audit
              </button>
              <ul className="space-y-3 text-sm">
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Everything in Pro</li>
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Up to 4 linked household members</li>
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Shared subscription view</li>
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Per-member spend breakdowns</li>
                <li className="flex items-start gap-3 text-muted-foreground"><Bullet /> Household waste rankings</li>
              </ul>
            </div>
          </div>
        </div>

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
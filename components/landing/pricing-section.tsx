"use client";

// components/landing/pricing-section.tsx — inline 3-column pricing with Pro highlight.
// Checks auth so logged-in users go to /dashboard instead of /register.

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { Check, Sparkles, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";

const plans = [
  {
    name: "Auditor",
    tag: "FREE",
    blurb: "For one person auditing a handful of subscriptions",
    price: "₹0",
    period: "/ forever",
    features: [
      "Up to 5 subscriptions tracked",
      "Manual entry + categories",
      "Basic waste score",
      "Email support",
    ],
    cta: "Get started",
    authCta: "Go to dashboard",
    href: "/register",
    authHref: "/dashboard",
    popular: false,
    variant: "ghost" as const,
  },
  {
    name: "Pro",
    tag: "PRO",
    blurb: "For anyone with more than five subscriptions — and zero patience for silent price hikes",
    price: "₹599",
    period: "/month",
    features: [
      "Unlimited subscriptions",
      "Bank sync via Plaid",
      "Auto-detect recurring charges",
      "Price-increase alerts",
      "Advanced waste analytics",
      "One-click cancel links",
      "Priority support",
    ],
    cta: "Upgrade to Pro",
    authCta: "View pricing",
    href: "/pricing",
    authHref: "/pricing",
    popular: true,
    variant: "default" as const,
  },
  {
    name: "Family",
    tag: "FAMILY",
    blurb: "Up to four linked people. Shared audit, individual leaks",
    price: "₹1,599",
    period: "/month",
    features: [
      "Everything in Pro",
      "Up to 4 linked household members",
      "Shared subscription view",
      "Per-member spend breakdowns",
      "Household waste rankings",
    ],
    cta: "Start family audit",
    authCta: "Coming soon",
    href: "/register?plan=family",
    authHref: "/dashboard",
    popular: false,
    variant: "outline" as const,
  },
];

const card = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.7, ease: [0.21, 1, 0.45, 1] as const, delay: i * 0.12 },
  }),
};

export function PricingSection() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((r) => r.ok && r.json())
      .then((d) => setIsLoggedIn(!!d?.user))
      .catch(() => setIsLoggedIn(false))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section id="pricing" className="relative py-32 sm:py-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="chip-mono text-xs text-primary"
          >
            <Sparkles className="mr-1.5 inline h-3 w-3" /> PRICING · NO HIDDEN FEES
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mt-4 font-display text-4xl font-normal leading-tight tracking-tightest sm:text-5xl lg:text-6xl"
          >
            Pay for what <em className="not-italic text-gradient-violet">saves</em> you money.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-5 text-lg text-muted-foreground leading-relaxed"
          >
            Free up to five subscriptions. Pro unlocks the bank-sync engine that finds
            the ones you are already forgetting about.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="mt-20 grid gap-6 md:grid-cols-3">
          {plans.map((plan, i) => (
            <motion.div
              key={plan.name}
              variants={card}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              custom={i}
              className="relative rounded-3xl"
            >
              {plan.popular && (
                <div className="absolute -inset-px rounded-3xl bg-[conic-gradient(from_140deg_at_50%_50%,#a78bfa_0deg,#f5d491_120deg,#22d3ee_240deg,#a78bfa_360deg)] opacity-70 [animation:spin_14s_linear_infinite]" />
              )}
              <div
                className={`relative rounded-3xl border ${plan.popular ? "border-violet/30" : "border-border"} ${plan.popular ? "bg-background/90 backdrop-blur" : "bg-card/30"} p-8`}
              >
                {plan.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-gradient-to-br from-violet to-violet-dim px-4 py-1 text-[10px] font-medium uppercase tracking-wider text-primary-foreground shadow-[0_10px_40px_-12px_rgba(167,139,250,0.8)]">
                    <Sparkles className="mr-1 inline h-3 w-3" />
                    Most popular
                  </div>
                )}

                <div className="space-y-6">
                  <div className="pb-4">
                    <div className="chip-mono text-[10px] text-primary">{plan.tag}</div>
                    <h3 className="mt-3 font-display text-2xl tracking-tightest">{plan.name}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{plan.blurb}</p>
                    <div className="mt-5 flex items-baseline gap-1.5">
                      <span className="font-display text-5xl tracking-tightest">{plan.price}</span>
                      <span className="text-sm text-muted-foreground">{plan.period}</span>
                    </div>
                  </div>

                  <Link href={!loading && isLoggedIn ? plan.authHref : plan.href}>
                    <Button
                      variant={plan.variant}
                      className={`h-12 w-full text-base ${
                        plan.variant === "default"
                          ? "text-primary-foreground bg-gradient-to-br from-violet to-violet-dim shadow-[0_18px_60px_-12px_rgba(167,139,250,0.4)] hover:shadow-[0_18px_60px_-6px_rgba(167,139,250,0.7)]"
                          : plan.variant === "outline"
                          ? "text-foreground border-border"
                          : "text-foreground border-border bg-card/60 hover:bg-card"
                      }`}
                    >
                      {!loading && isLoggedIn ? plan.authCta : plan.cta}
                    </Button>
                  </Link>

                  <ul className="space-y-3 text-sm text-muted-foreground">
                    {plan.features.map((feature, j) => (
                      <li key={j} className="flex items-start gap-3">
                        <div className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full bg-violet/15 text-violet-glow">
                          <Check className="h-3 w-3" />
                        </div>
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.div>
          ))}

          <p className="mt-12 text-center text-xs text-muted-foreground col-span-full">
            All plans include 256-bit encryption and full data export. Cancel any time.
          </p>
        </div>
      </div>
    </section>
  );
}

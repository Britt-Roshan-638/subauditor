"use client";

// components/landing/features.tsx — 6 capability cards with scroll-reveal stagger.

import { motion } from "framer-motion";
import {
  Building2,
  ScanLine,
  Bell,
  Gauge,
  ShieldCheck,
  Zap,
  Sparkles,
} from "lucide-react";

const features = [
  {
    icon: Building2,
    eyebrow: "BANK-LINK",
    title: "Read-only bank sync",
    body:
      "Connect any US bank through Plaid in one tap. We see your transactions, your transactions, your money never moves.",
    accent: "#67e8f9",
  },
  {
    icon: ScanLine,
    eyebrow: "DETECT",
    title: "Auto-detect recurring charges",
    body:
      "We surface every recurring charge — from obvious ₹99s to forgotten niche SaaS — within 90 seconds of first sync.",
    accent: "#a78bfa",
  },
  {
    icon: Bell,
    eyebrow: "ALERTS",
    title: "Price-increase radar notifications",
    body:
      "We diff your subscriptions week over week so you catch the subtle creep from ₹149 to ₹199 before the second hit.",
    accent: "#f5d491",
  },
  {
    icon: Gauge,
    eyebrow: "INSIGHT",
    title: "Waste score",
    body:
      "A real number you can act on, weighted by usage frequency, price hike trajectory, and category baseline.",
    accent: "#fb7185",
  },
  {
    icon: ShieldCheck,
    eyebrow: "PRIVACY",
    title: "Local-first storage",
    body:
      "Encrypted at rest, never traded, never sold. Delete your account — and we purge everything within 24 hours.",
    accent: "#86efac",
  },
  {
    icon: Zap,
    eyebrow: "EXIT",
    title: "Direct cancellation links",
    body:
      "One-click deep links into the next-best cancellation path for every service we surface — no email gymnastics.",
    accent: "#fcd34d",
  },
];

const card = {
  hidden: { opacity: 0, y: 28 },
  show: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.8, ease: [0.21, 1, 0.45, 1] as const, delay: i * 0.08 },
  }),
};

export function Features() {
  return (
    <section id="features" className="relative py-32 sm:py-40">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Eyebrow + heading */}
        <div className="mx-auto max-w-3xl text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.7 }}
            className="chip-mono text-xs text-primary"
          >
            <Sparkles className="mr-1.5 inline h-3 w-3" /> THE KIT
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, delay: 0.1 }}
            className="mt-4 font-display text-4xl font-normal leading-tight tracking-tightest sm:text-5xl lg:text-6xl"
          >
            An <em className="not-italic text-gradient-violet">operating system</em> for
            your recurring spend.
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="mt-5 text-lg text-muted-foreground leading-relaxed"
          >
            Six instruments, one quiet dashboard. Built for the people who
            <em> actually</em>
            read their monthly statements.
          </motion.p>
        </div>

        {/* Grid */}
        <div className="mt-20 grid grid-cols-1 gap-px overflow-hidden rounded-3xl border border-border bg-border md:grid-cols-2 lg:grid-cols-3">
          {features.map((f, i) => (
            <motion.article
              key={f.title}
              variants={card}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-100px" }}
              custom={i}
              className="group relative bg-card p-8 transition-colors duration-500 hover:bg-card/60"
            >
              <div
                aria-hidden
                className="absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
                style={{
                  background: `linear-gradient(90deg, transparent 0%, ${f.accent} 50%, transparent 100%)`,
                }}
              />
              <div
                className="inline-flex h-11 w-11 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${f.accent}1A`,
                  border: `1px solid ${f.accent}40`,
                  boxShadow: `inset 0 0 0 1px ${f.accent}10, 0 8px 24px -16px ${f.accent}80`,
                }}
              >
                <f.icon className="h-5 w-5" style={{ color: f.accent }} />
              </div>
              <div className="chip-mono mt-7 text-[11px] text-muted-foreground">
                {f.eyebrow}
              </div>
              <h3 className="mt-2 font-display text-2xl tracking-tightest">
                {f.title}
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </motion.article>
          ))}
        </div>
      </div>
    </section>
  );
}
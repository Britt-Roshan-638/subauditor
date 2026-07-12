"use client";

// components/landing/hero.tsx — asymmetric hero with full Three.js stage + scroll-driven reveal.

import { useSession } from "next-auth/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, PlayCircle, ShieldCheck, Sparkles, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

const HeroScene = dynamic(
  () => import("@/components/3d/HeroScene").then((m) => m.HeroScene),
  {
    ssr: false,
    loading: () => (
      <div className="absolute inset-0 grid place-items-center">
        <div className="h-2 w-32 overflow-hidden rounded-full bg-violet/20">
          <div className="h-full w-1/2 animate-shimmer bg-gradient-to-r from-violet/0 via-violet to-violet/0" />
        </div>
      </div>
    ),
  }
);

const fade = {
  hidden: { opacity: 0, y: 24 },
  show: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.9, ease: [0.21, 1, 0.45, 1] as const, delay: 0.15 * i },
  }),
};

export function Hero() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === "authenticated";

  return (
    <section className="relative isolate overflow-hidden pt-28 pb-24 sm:pt-36 sm:pb-32">
      {/* Three.js stage — fills full hero, sits behind copy. */}
      <div className="absolute inset-0 -z-10">
        <HeroScene />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_55%_45%_at_30%_55%,transparent_55%,hsl(var(--background))_100%)]" />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-1/2 bg-gradient-to-r from-background/95 via-background/70 to-transparent" />
      </div>

      <div className="mx-auto grid max-w-7xl grid-cols-1 gap-10 px-4 sm:px-6 lg:grid-cols-12 lg:px-8">
        {/* LEFT — asymmetric copy column */}
        <div className="relative z-10 lg:col-span-7 xl:col-span-7">
          <motion.div
            variants={fade}
            initial="hidden"
            animate="show"
            custom={0}
            className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/5 px-3.5 py-1.5 text-xs chip-mono text-primary"
          >
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-70" />
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
            </span>
            Tracking live · v2 release
          </motion.div>

          <motion.h1
            variants={fade}
            initial="hidden"
            animate="show"
            custom={1}
            className="mt-6 font-display text-5xl font-normal leading-[0.95] tracking-tightest text-foreground sm:text-6xl lg:text-7xl xl:text-[5.5rem]"
          >
            Find every <em className="not-italic text-gradient-violet">subscription</em>.
            <br />
            Stop the <span className="italic">quiet bleed</span>.
          </motion.h1>

          <motion.p
            variants={fade}
            initial="hidden"
            animate="show"
            custom={2}
            className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground sm:text-xl"
          >
            SubAuditor reads your transactions, surfaces every recurring charge
            <span className="text-foreground/90"> — including the ones you forgot about —</span>
            and tells you when a price quietly climbs. Set up takes ninety seconds.
          </motion.p>

          <motion.div
            variants={fade}
            initial="hidden"
            animate="show"
            custom={3}
            className="mt-9 flex flex-col sm:flex-row items-center gap-3 sm:gap-4"
          >
            {isLoggedIn ? (
              <Link href="/dashboard" className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="group h-12 w-full px-7 text-base gap-2 sm:w-auto bg-gradient-to-br from-violet to-violet-dim text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.5)] hover:shadow-[0_18px_60px_-6px_rgba(167,139,250,0.7)] transition-shadow"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Go to dashboard
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            ) : (
              <Link href="/register" prefetch={true} className="w-full sm:w-auto">
                <Button
                  size="lg"
                  className="group h-12 w-full px-7 text-base gap-2 sm:w-auto bg-gradient-to-br from-violet to-violet-dim text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.5)] hover:shadow-[0_18px_60px_-6px_rgba(167,139,250,0.7)] transition-shadow"
                >
                  Start tracking — Free
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </Button>
              </Link>
            )}
            <Link href="#features" className="w-full sm:w-auto">
              <Button
                variant="ghost"
                size="lg"
                className="h-12 w-full px-6 text-base gap-2 sm:w-auto text-foreground/90 hover:text-foreground"
              >
                <PlayCircle className="h-4 w-4" />
                See how it works
              </Button>
            </Link>
          </motion.div>

          <motion.div
            variants={fade}
            initial="hidden"
            animate="show"
            custom={4}
            className="mt-10 flex flex-wrap items-center gap-x-8 gap-y-3 text-sm text-muted-foreground"
          >
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-400" />
              Read-only bank access via Plaid
            </div>
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-champagne" />
              Average ₹4,000/mo saved
            </div>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-glow/60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-cyan-glow" />
              </span>
              2,500+ active auditors
            </div>
          </motion.div>
        </div>

        {/* RIGHT — empty on purpose so the 3D stage reads. */}
        <div className="hidden lg:col-span-5 lg:block" aria-hidden />
      </div>

      {/* scroll affordance */}
      <motion.div
        variants={fade}
        initial="hidden"
        animate="show"
        custom={5}
        className="absolute bottom-6 left-1/2 -translate-x-1/2 text-xs chip-mono text-muted-foreground"
      >
        scroll · explore
      </motion.div>
    </section>
  );
}

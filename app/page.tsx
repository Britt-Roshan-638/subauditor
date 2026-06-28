// app/page.tsx — landing entry. Wires Hero, Features, Pricing, Footer in dark theme.

import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { PricingSection } from "@/components/landing/pricing-section";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      {/* Sticky header */}
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/70 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-gradient-to-br from-violet via-violet-glow to-cyan-glow">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(255,255,255,.4),transparent)]" />
              <span className="absolute inset-0 grid place-items-center font-display text-base text-primary-foreground">
                S
            </span>
          </div>
            <span className="font-display text-xl tracking-tightest text-foreground">
              SubAuditor
          </span>
        </Link>
          <nav className="hidden items-center gap-7 md:flex">
            <a
              href="#features"
              className="chip-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              FEATURES
          </a>
            <a
              href="#pricing"
              className="chip-mono text-[11px] text-muted-foreground transition-colors hover:text-foreground"
            >
              PRICING
          </a>
        </nav>
          <div className="flex items-center gap-2">
            <Link href="/login">
              <Button variant="ghost" size="sm" className="text-foreground/80">
                Log in
            </Button>
          </Link>
            <Link href="/register">
              <Button
                size="sm"
                className="gap-1.5 bg-gradient-to-br from-violet to-violet-dim text-primary-foreground hover:opacity-95"
              >
                Get started
                <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </header>

      {/* Client-side sections */}
      <Hero />
      <Features />
      <PricingSection />

      {/* Bottom CTA */}
      <section className="relative py-32 sm:py-40">
        <div className="mx-auto max-w-3xl px-4 text-center sm:px-6 lg:px-8">
          <div className="chip-mono text-xs text-primary">FINAL CALL</div>
          <h2 className="mt-5 font-display text-5xl font-normal leading-tight tracking-tightest sm:text-6xl">
            Ready to <em className="not-italic text-gradient-violet">quiet</em>{" "}
            the bleed?
        </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            Ninety seconds to set up. The average user saves{" "}
            <span className="text-champagne">$564 a year</span>.
        </p>
          <div className="mt-10 flex justify-center">
            <Link href="/register">
              <Button
                size="lg"
                className="group h-14 px-9 text-base gap-2 bg-gradient-to-br from-violet to-violet-dim text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.5)] hover:shadow-[0_18px_60px_-6px_rgba(167,139,250,0.7)]"
              >
                Set up free — it takes 90 seconds
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </Button>
          </Link>
        </div>
      </div>
    </section>

      <Footer />
  </main>
  );
}

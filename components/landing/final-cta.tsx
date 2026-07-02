// components/landing/final-cta.tsx — auth-aware bottom CTA for the landing page.
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowRight, LayoutDashboard } from "lucide-react";
import { Button } from "@/components/ui/button";

export function FinalCta() {
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
          {!loading && isLoggedIn ? (
            <Link href="/dashboard">
              <Button
                size="lg"
                className="group h-14 px-9 text-base gap-2 bg-gradient-to-br from-violet to-violet-dim text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.5)] hover:shadow-[0_18px_60px_-6px_rgba(167,139,250,0.7)]"
              >
                <LayoutDashboard className="h-4 w-4" />
                Go to dashboard
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          ) : (
            <Link href="/register">
              <Button
                size="lg"
                className="group h-14 px-9 text-base gap-2 bg-gradient-to-br from-violet to-violet-dim text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.5)] hover:shadow-[0_18px_60px_-6px_rgba(167,139,250,0.7)]"
              >
                Set up free — it takes 90 seconds
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Button>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}

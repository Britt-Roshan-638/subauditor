// app/page.tsx — landing entry. Wires Hero, Features, Pricing, Footer in dark theme.

import { Hero } from "@/components/landing/hero";
import { Features } from "@/components/landing/features";
import { LandingHeader } from "@/components/landing/landing-header";
import { PricingSection } from "@/components/landing/pricing-section";
import { FinalCta } from "@/components/landing/final-cta";
import { Footer } from "@/components/landing/footer";

export default function LandingPage() {
  return (
    <main className="min-h-screen">
      <LandingHeader />

      {/* Client-side sections */}
      <Hero />
      <Features />
      <PricingSection />

      {/* Bottom CTA */}
      <FinalCta />

      <Footer />
  </main>
  );
}

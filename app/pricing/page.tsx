// app/pricing/page.tsx — standalone pricing page, brand-aligned.

"use client";

import { useState, useEffect } from "react";
import loadScript from "@/lib/loadScript";
import Link from "next/link";
import { motion } from "framer-motion";
import { Check, Sparkles, ArrowRight } from "lucide-react";

declare global {
  interface Window {
    Razorpay: any;
  }
}

export default function PricingPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [razorpayReady, setRazorpayReady] = useState(false);

  // Load Razorpay checkout SDK
  useEffect(() => {
    loadScript("https://checkout.razorpay.com/v1/checkout.js")
      .then(() => setRazorpayReady(true))
      .catch(() => console.error("Failed to load Razorpay SDK"));
  }, []);

  const handleUpgrade = async () => {
    if (!razorpayReady) return;
    setIsLoading(true);
    try {
      // Call our API to create a Razorpay subscription
      const res = await fetch("/api/razorpay/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();

      if (data.url) {
        // Redirect to the Razorpay checkout page
        window.location.href = data.url;
      } else {
        setIsLoading(false);
        throw new Error("No URL returned from checkout endpoint");
      }
    } catch (err) {
      console.error("Error initiating Razorpay payment:", err);
      setIsLoading(false);
    }
  };

  return (
    // ... rest of the component remains the same
    <div className="relative min-h-screen overflow-hidden">
      {/* ... existing JSX ... */}

      {/* In the Pro section, update the button to use handleUpgrade */}
      <button
        onClick={handleUpgrade}
        disabled={isLoading}
        className="block w-full rounded-xl bg-gradient-to-br from-violet to-violet-dim py-3 text-sm font-medium text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.55)] hover:shadow-[0_18px_60px_-6px_rgba(167,139,250,0.7)] disabled:opacity-60"
      >
        {isLoading ? "Processing..." : "Upgrade to Pro"}
        {!isLoading && <ArrowRight className="ml-1 inline h-4 w-4" />}
      </button>

      {/* ... rest of component ... */}
    </div>
  );
}
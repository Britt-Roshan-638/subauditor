"use client";

// app/onboarding/page.tsx — Plaid link step with brand-aligned visuals.

import { useState, useCallback, useEffect } from "react";
import { useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { usePlaidLink, type PlaidLinkOnSuccessMetadata } from "react-plaid-link";
import { motion } from "framer-motion";
import { Landmark, Lock, ScanLine, Eye, ChevronRight } from "lucide-react";

const HeroScene = dynamic(
  () => import("@/components/3d/HeroScene").then((m) => m.HeroScene),
  { ssr: false }
);

export default function OnboardingPage() {
  const router = useRouter();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLinkToken() {
      try {
        const res = await fetch("/api/plaid/link-token");
        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          setError(body.error || `Failed to initialize bank connection (${res.status})`);
          setLoading(false);
          return;
        }
        const data = await res.json();
        if (data.linkToken) {
          setLinkToken(data.linkToken);
        } else {
          setError(data.error || "Failed to initialize bank connection");
        }
      } catch (err: any) {
        setError(err.message || "Failed to initialize bank connection");
      } finally {
        setLoading(false);
      }
    }
    fetchLinkToken();
  }, []);

  const handleOnSuccess = useCallback(
    async (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
      try {
        setConnecting(true);
        const res = await fetch("/api/plaid/exchange", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicToken }),
        });
        const data = await res.json();
        if (data.success) {
          await fetch("/api/plaid/sync", { method: "POST" });
          router.push("/dashboard");
        } else {
          setError(data.error || `Failed to link account (${res.status})`);
          setConnecting(false);
        }
      } catch (err: any) {
        setError(err.message || "Failed to link account");
        setConnecting(false);
      }
    },
    [router]
  );

  const { open, ready } = usePlaidLink({
    token: linkToken,
    onSuccess: handleOnSuccess,
  });

  return (
    <main className="relative min-h-screen overflow-hidden">
      {/* 3D background — small panel */}
      <div className="absolute right-0 top-0 -z-10 h-full w-1/2">
        <HeroScene />
        <div className="pointer-events-none absolute inset-y-0 left-0 w-48 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_70%_60%_at_60%_50%,transparent_50%,hsl(var(--background))_100%)]" />
      </div>

      <div className="mx-auto flex min-h-screen max-w-3xl flex-col items-start justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="chip-mono text-[11px] text-primary"
        >
          STEP 1/1 · BANK LINK
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="mt-5 font-display text-5xl leading-[1.05] tracking-tightest"
        >
          Connect a <em className="not-italic text-gradient-violet">bank</em>.
          <br />
          Start the <span className="italic">audit</span>.
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="mt-5 max-w-md text-muted-foreground"
        >
          We use Plaid for read-only access — we see your transactions, your money
          never moves.
        </motion.p>

        <div className="mt-10 grid gap-3 max-w-md">
          <Reason
            icon={Lock}
            color="text-emerald-400"
            title="Bank-level encryption"
            body="256-bit, read-only. Like your bank's own app."
          />
          <Reason
            icon={ScanLine}
            color="text-violet-glow"
            title="Nothing to type"
            body="Existing subscriptions auto-detected in 90 seconds."
          />
          <Reason
            icon={Eye}
            color="text-champagne"
            title="See-only access"
            body="We never move money. You revoke any time."
          />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}

        <motion.button
          onClick={() => open()}
          disabled={connecting || !linkToken || !ready}
          whileTap={{ scale: 0.98 }}
          className="group mt-10 inline-flex h-14 items-center gap-2 rounded-xl bg-gradient-to-br from-violet to-violet-dim px-8 text-base font-medium text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.5)] hover:shadow-[0_18px_60px_-6px_rgba(167,139,250,0.7)] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {connecting ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary-foreground border-t-transparent" />
              Connecting…
            </>
          ) : (
            <>
              <Landmark className="h-4 w-4" />
              Connect bank account
              <ChevronRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
            </>
          )}
        </motion.button>

        <p className="mt-4 text-xs text-muted-foreground">
          Powered by Plaid · You can revoke access at any time from Settings.
        </p>
      </div>
    </main>
  );
}

function Reason({
  icon: Icon,
  color,
  title,
  body,
}: {
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-card/40 p-4">
      <div className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-border bg-card/80">
        <Icon className={`h-4 w-4 ${color}`} />
      </div>
      <div>
        <div className="text-sm font-medium">{title}</div>
        <div className="text-xs text-muted-foreground">{body}</div>
      </div>
    </div>
  );
}
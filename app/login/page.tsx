"use client";

// app/login/page.tsx — splitscreen auth shell, credentials + Google.

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { AuthShell, GoogleSignInButton, FormField } from "@/components/auth-shell";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/callback/credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Invalid credentials");
        return;
      }
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });
      if (result?.error) {
        setError("Sign-in failed. Please try again.");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="WELCOME BACK"
      title={
        <>
          The audit <em className="not-italic text-gradient-violet">continues</em>
          {" "}here.
        </>
      }
      subtitle="Pick up where you left off. Your subscription audit is waiting."
    >
      <div className="lg:hidden">
        <Link href="/" className="flex items-center gap-2.5">
          <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-gradient-to-br from-violet via-violet-glow to-cyan-glow">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(255,255,255,.4),transparent)]" />
            <span className="absolute inset-0 grid place-items-center font-display text-base text-primary-foreground">S</span>
          </div>
          <span className="font-display text-xl tracking-tightest">SubAuditor</span>
        </Link>
        <h1 className="mt-8 font-display text-3xl tracking-tightest lg:hidden">
          Welcome back
        </h1>
      </div>

      <h1 className="hidden font-display text-3xl tracking-tightest lg:block">
        Welcome back
      </h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Sign in to continue auditing your subscriptions.
      </p>

      <div className="mt-8 space-y-4">
        <GoogleSignInButton onClick={() => signIn("google", { callbackUrl: "/dashboard" })} />

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-border" />
          <span className="chip-mono text-[10px] text-muted-foreground">OR</span>
          <div className="h-px flex-1 bg-border" />
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive"
          >
            {error}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <FormField
            label="Email"
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            placeholder="you@example.com"
          />
          <FormField
            label="Password"
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            autoComplete="current-password"
            placeholder="••••••••"
          />

          <motion.button
            type="submit"
            disabled={loading}
            whileTap={{ scale: 0.98 }}
            className="group flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-br from-violet to-violet-dim text-base font-medium text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.45)] transition-shadow hover:shadow-[0_18px_60px_-6px_rgba(167,139,250,0.7)] disabled:opacity-50"
          >
            {loading ? "Signing in…" : "Sign in"}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </motion.button>
        </form>

        <p className="text-sm text-center text-muted-foreground">
          New auditor?{" "}
          <Link href="/register" className="text-primary hover:text-violet-glow">
            Create account
          </Link>
        </p>
      </div>
    </AuthShell>
  );
}
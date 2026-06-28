"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ReactNode } from "react";

export function AuthShell({
  eyebrow,
  title,
  subtitle,
  children,
}: {
  eyebrow: string;
  title: ReactNode;
  subtitle?: string;
  children: ReactNode;
}) {
  return (
    <main className="relative grid min-h-screen grid-cols-1 lg:grid-cols-2">
      {/* LEFT — display panel */}
      <aside className="relative hidden overflow-hidden border-r border-border bg-card lg:block">
        {/* Animated aurora */}
        <div className="aurora-mesh animate-aurora absolute inset-0 opacity-80" />
        <div className="noise-overlay absolute inset-0" />
        <div
          aria-hidden
          className="absolute inset-0 bg-[linear-gradient(180deg,transparent,hsl(0_0%_0%/0.55))]"
        />

        <div className="relative z-10 flex h-full flex-col p-12">
          <Link href="/" className="flex items-center gap-3">
            <div className="relative h-10 w-10 overflow-hidden rounded-xl bg-gradient-to-br from-violet via-violet-glow to-cyan-glow">
              <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(255,255,255,.4),transparent)]" />
              <span className="absolute inset-0 grid place-items-center font-display text-xl text-primary-foreground">
                S
              </span>
            </div>
            <span className="font-display text-2xl tracking-tightest">
              SubAuditor
            </span>
          </Link>

          <div className="my-auto max-w-md">
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="chip-mono text-xs text-primary"
            >
              {eyebrow}
            </motion.div>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.1 }}
              className="mt-5 font-display text-5xl font-normal leading-tight tracking-tightest"
            >
              {title}
            </motion.h2>
            {subtitle && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.25 }}
                className="mt-5 text-lg leading-relaxed text-muted-foreground"
              >
                {subtitle}
              </motion.p>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Track every dollar since 2026.
          </p>
        </div>
      </aside>

      {/* RIGHT — form panel */}
      <section className="flex items-center justify-center bg-background px-4 py-16 sm:px-6 lg:px-12">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="w-full max-w-md"
        >
          {children}
        </motion.div>
      </section>
    </main>
  );
}

export function GoogleSignInButton({ onClick }: { onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center justify-center gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground transition-colors hover:border-primary/40 hover:bg-card/80"
    >
      <svg viewBox="0 0 24 24" className="h-4 w-4">
        <path
          fill="#4285F4"
          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
        />
        <path
          fill="#34A853"
          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        />
        <path
          fill="#FBBC05"
          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        />
        <path
          fill="#EA4335"
          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 2.09 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        />
      </svg>
      Continue with Google
    </button>
  );
}

export function FormField({
  label,
  ...props
}: React.InputHTMLAttributes<HTMLInputElement> & { label: string }) {
  return (
    <label className="block">
      <span className="block text-xs chip-mono text-muted-foreground">
        {label.toUpperCase()}
      </span>
      <input
        {...props}
        className="mt-2 w-full rounded-xl border border-input bg-card/50 px-4 py-3 text-foreground placeholder:text-muted-foreground/60 transition-colors focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/40"
      />
    </label>
  );
}
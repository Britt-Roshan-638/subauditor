// app/not-found.tsx — Custom 404 page with SubAuditor branding.
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Page Not Found | SubAuditor",
};

export default function NotFound() {
  return (
    <div className="relative isolate flex min-h-screen flex-col items-center justify-center overflow-hidden bg-background px-4">
      {/* Ambient glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -inset-x-32 -top-48 mx-auto h-[30rem] w-[30rem] rounded-full bg-violet/10 blur-[128px]"
      />

      <div className="relative z-10 text-center">
        {/* Large 404 */}
        <h1 className="font-display text-[10rem] leading-none font-normal tracking-tightest text-violet/20 sm:text-[14rem] select-none">
          404
        </h1>

        {/* Message */}
        <div className="-mt-6 sm:-mt-10">
          <p className="font-display text-2xl font-normal tracking-tightest text-foreground sm:text-3xl">
            This subscription doesn&apos;t exist
          </p>
          <p className="mt-3 text-base text-muted-foreground leading-relaxed">
            The page you&apos;re looking for has been canceled, moved, or
            never existed in the first place.
          </p>
        </div>

        {/* Actions */}
        <div className="mt-10 flex items-center justify-center gap-4">
          <Link
            href="/"
            className="inline-flex h-11 items-center gap-2 rounded-xl bg-gradient-to-br from-violet to-violet-dim px-6 text-sm font-medium text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.5)] transition-shadow hover:shadow-[0_18px_60px_-6px_rgba(167,139,250,0.7)]"
          >
            Go home
          </Link>
          <Link
            href="/dashboard"
            className="inline-flex h-11 items-center gap-2 rounded-xl border border-border bg-card/60 px-6 text-sm font-medium text-foreground transition-colors hover:bg-card"
          >
            Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}

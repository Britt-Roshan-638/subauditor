"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <html lang="en" className="dark" style={{ colorScheme: "dark" }}>
      <body className="min-h-screen bg-background font-sans antialiased">
        <div className="flex min-h-screen flex-col items-center justify-center px-6">
          <div className="max-w-md text-center">
            <div className="mb-6 text-6xl">💥</div>
            <h1 className="font-display text-3xl tracking-tightest">
              Something went wrong
            </h1>
            <p className="mt-3 text-muted-foreground">
              An unexpected error occurred. Please try again.
            </p>
            {error.digest && (
              <p className="mt-2 font-mono text-xs text-muted-foreground/50">
                Error ID: {error.digest}
              </p>
            )}
            <button
              onClick={reset}
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-gradient-to-br from-violet to-violet-dim px-6 py-3 text-sm font-medium text-primary-foreground shadow-[0_18px_60px_-12px_rgba(167,139,250,0.45)] hover:shadow-[0_18px_60px_-6px_rgba(167,139,250,0.65)] transition-all duration-300"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}

"use client";

import Link from "next/link";
import { Github, Twitter, Send } from "lucide-react";

const columns = [
  {
    label: "Product",
    items: [
      { label: "Features", href: "#features" },
      { label: "Pricing", href: "#pricing" },
      { label: "Changelog", href: "#" },
      { label: "Roadmap", href: "#" },
    ],
  },
  {
    label: "Company",
    items: [
      { label: "About", href: "#" },
      { label: "Privacy", href: "#" },
      { label: "Terms", href: "#" },
      { label: "Contact", href: "#" },
    ],
  },
  {
    label: "Resources",
    items: [
      { label: "Help center", href: "#" },
      { label: "Status", href: "#" },
      { label: "API", href: "#" },
      { label: "Integrations", href: "#" },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-border bg-background">
      <div className="pointer-effects-none absolute inset-x-0 -top-32 h-32 bg-gradient-to-b from-transparent to-background" />
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 gap-12 py-20 md:grid-cols-6">
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-gradient-to-br from-violet via-violet-glow to-cyan-glow">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_30%,rgba(255,255,255,.4),transparent)]" />
                <span className="absolute inset-0 grid place-items-center font-display text-lg text-primary-foreground">
                  S
                </span>
              </div>
              <span className="font-display text-2xl tracking-tightest">
                SubAuditor
              </span>
            </Link>
            <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
              A quiet dashboard for your recurring spend. Built in the open.
            </p>
            <div className="mt-6 flex items-center gap-3 text-muted-foreground">
              {[
                { Icon: Github, label: "GitHub" },
                { Icon: Twitter, label: "Twitter" },
                { Icon: Send, label: "Newsletter" },
              ].map(({ Icon, label }) => (
                <a
                  key={label}
                  href="#"
                  aria-label={label}
                  className="grid h-9 w-9 place-items-center rounded-lg border border-border bg-card transition-colors hover:border-primary/40 hover:text-primary"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          {columns.map((col) => (
            <div key={col.label}>
              <div className="chip-mono text-[11px] text-muted-foreground">
                {col.label.toUpperCase()}
              </div>
              <ul className="mt-4 space-y-2.5">
                {col.items.map((item) => (
                  <li key={item.label}>
                    <Link
                      href={item.href}
                      className="text-sm text-foreground/80 transition-colors hover:text-primary"
                    >
                      {item.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}

        </div>
        <div className="flex flex-col items-center justify-between gap-4 border-t border-border py-8 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SubAuditor. Built with intention.
          </p>
          <p className="text-xs text-muted-foreground">
            Tracking every dollar since 2026.
          </p>
        </div>
      </div>
    </footer>
  );
}
import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import AuthProvider from "@/components/auth-provider";
import "./globals.css";


export const viewport: Viewport = {
  themeColor: "#060611",
};

export const metadata: Metadata = {
  title: "SubAuditor — Track & Audit Your Subscriptions",
  description:
    "Automatically detect recurring subscriptions, track price increases, and stop wasting money on forgotten services.",
  metadataBase: new URL("https://subauditor-mu.vercel.app"),
  openGraph: {
    title: "SubAuditor — Find every subscription. Stop wasting money.",
    description:
      "Automatically detect recurring subscriptions and track price increases.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={`dark ${GeistSans.variable} ${GeistMono.variable}`}
      style={{ colorScheme: "dark" }}
    >
      <body className="min-h-screen bg-background font-sans antialiased">
        <AuthProvider>
          <div
            aria-hidden="true"
            className="noise-overlay fixed inset-0 z-[100] pointer-events-none"
          />
          {children}
      </AuthProvider>
    </body>
  </html>
  );
}

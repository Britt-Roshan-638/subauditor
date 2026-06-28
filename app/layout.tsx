import type { Metadata } from "next";
import { Instrument_Serif } from "next/font/google";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import AuthProvider from "@/components/auth-provider";
import "./globals.css";

const display = Instrument_Serif({
  weight: "400",
  style: ["normal", "italic"],
  subsets: ["latin"],
  display: "swap",
  variable: "--font-display",
});

export const metadata: Metadata = {
  title: "SubAuditor — Track & Audit Your Subscriptions",
  description:
    "Automatically detect recurring subscriptions, track price increases, and stop wasting money on forgotten services.",
  themeColor: "#060611",
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
      className={`dark ${GeistSans}.variable} ${GeistMono}.variable} ${display}.variable}`}
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

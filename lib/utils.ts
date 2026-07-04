import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatCurrency(amount: number, currency = "INR"): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: Date | string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

export function getFrequencyLabel(frequency: string): string {
  const labels: Record<string, string> = {
    monthly: "mo",
    yearly: "yr",
    weekly: "wk",
    quarterly: "qtr",
  };
  return labels[frequency] || frequency;
}

export function formatRelativeDate(date: string | Date): string {
  const now = new Date();
  const d = new Date(date);
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
}

export function calculateWasteScore(
  subscriptions: { amount: number; status: string }[]
): number {
  if (subscriptions.length === 0) return 0;
  const total = subscriptions.reduce((sum, s) => sum + s.amount, 0);
  const active = subscriptions.filter((s) => s.status === "active");
  const activeTotal = active.reduce((sum, s) => sum + s.amount, 0);
  if (total === 0) return 0;
  return Math.round(((total - activeTotal) / total) * 100);
}

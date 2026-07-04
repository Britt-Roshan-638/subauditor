/** Subscriptions linked to Razorpay billing — not user-audited services */
export const BILLING_SUBSCRIPTION_FILTER = {
  razorpaySubscriptionId: null,
} as const;

export const FREE_SUBSCRIPTION_LIMIT = 5;

export function normalizeFrequency(frequency: string): string {
  if (frequency === "yearly") return "annual";
  return frequency;
}

export function toMonthlyAmount(amount: number, frequency: string): number {
  switch (frequency) {
    case "weekly":
      return amount * 4.33;
    case "biweekly":
      return amount * 2.17;
    case "quarterly":
      return amount / 3;
    case "semi_annual":
      return amount / 6;
    case "yearly":
    case "annual":
      return amount / 12;
    default:
      return amount;
  }
}

export function isProPlan(plan: string | null | undefined): boolean {
  return plan === "pro" || plan === "family";
}

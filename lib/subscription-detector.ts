export interface PlaidTransaction {
  transactionId: string;
  accountId: string;
  amount: number;
  date: string;
  name: string;
  merchantName?: string;
  category?: string | null;
  pending?: boolean;
}

export interface DetectedSubscription {
  name: string;
  amount: number;
  frequency: string;
  category: string | null;
  lastChargeDate: Date;
  nextChargeDate: Date | null;
  plaidTransactionId: string;
}

/**
 * Detect recurring subscriptions from transaction patterns.
 * Looks for: same merchant name, similar amounts (±10%), regular intervals (monthly, weekly, yearly).
 */
export async function detectSubscriptions(
  transactions: PlaidTransaction[],
  _userId: string
): Promise<DetectedSubscription[]> {
  // Group transactions by merchant name (normalized)
  const merchantGroups: Record<string, PlaidTransaction[]> = {};

  for (const txn of transactions) {
    // Skip credits/deposits (positive amounts in Plaid = money out for debit accounts,
    // but some accounts use negative for debits. We filter by common subscription patterns.)
    const key = (txn.merchantName || txn.name || '').toLowerCase().trim();
    if (!key || key.length < 2) continue;
    if (!merchantGroups[key]) merchantGroups[key] = [];
    merchantGroups[key].push(txn);
  }

  const detectedSubs: DetectedSubscription[] = [];

  for (const [_merchant, txns] of Object.entries(merchantGroups)) {
    if (txns.length < 2) continue;

    // Sort by date ascending
    txns.sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    // Check for similar amounts (±10%)
    const amounts = txns.map((t) => Math.abs(t.amount));
    const avgAmount = amounts.reduce((s, a) => s + a, 0) / amounts.length;
    const allSimilar = amounts.every(
      (a) => Math.abs(a - avgAmount) / avgAmount <= 0.1
    );

    if (!allSimilar) continue;

    // Calculate intervals between consecutive transactions (in days)
    const intervals: number[] = [];
    for (let i = 1; i < txns.length; i++) {
      const days =
        (new Date(txns[i].date).getTime() -
          new Date(txns[i - 1].date).getTime()) /
        (1000 * 60 * 60 * 24);
      if (days > 0) intervals.push(days);
    }

    if (intervals.length === 0) continue;

    const avgInterval =
      intervals.reduce((s, d) => s + d, 0) / intervals.length;

    // Determine frequency based on average interval
    let frequency = 'unknown';
    if (avgInterval >= 25 && avgInterval <= 35) frequency = 'monthly';
    else if (avgInterval >= 6 && avgInterval <= 8) frequency = 'weekly';
    else if (avgInterval >= 350 && avgInterval <= 380) frequency = 'yearly';
    else continue; // Not a regular pattern — skip

    const lastTxn = txns[txns.length - 1];
    const lastChargeDate = new Date(lastTxn.date);

    // Calculate next charge date based on frequency
    let nextChargeDate: Date | null = null;
    if (frequency === 'monthly') {
      nextChargeDate = new Date(lastChargeDate);
      nextChargeDate.setMonth(nextChargeDate.getMonth() + 1);
    } else if (frequency === 'weekly') {
      nextChargeDate = new Date(lastChargeDate);
      nextChargeDate.setDate(nextChargeDate.getDate() + 7);
    } else if (frequency === 'yearly') {
      nextChargeDate = new Date(lastChargeDate);
      nextChargeDate.setFullYear(nextChargeDate.getFullYear() + 1);
    }

    // Use most common category
    const categories = txns.map((t) => t.category).filter(Boolean) as string[];
    const categoryCounts: Record<string, number> = {};
    for (const c of categories) {
      categoryCounts[c] = (categoryCounts[c] || 0) + 1;
    }
    const topCategory =
      Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0]?.[0] ||
      null;

    detectedSubs.push({
      name: lastTxn.merchantName || lastTxn.name || _merchant,
      amount: Math.round(avgAmount * 100) / 100,
      frequency,
      category: topCategory,
      lastChargeDate,
      nextChargeDate,
      plaidTransactionId: lastTxn.transactionId,
    });
  }

  return detectedSubs;
}

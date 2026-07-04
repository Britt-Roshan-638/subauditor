import { detectSubscriptions, PlaidTransaction } from '../subscription-detector';

// ---------------------------------------------------------------------------
// Helper: build a minimal transaction
// ---------------------------------------------------------------------------
function txn(
  overrides: Partial<PlaidTransaction> & { name: string; amount: number; date: string }
): PlaidTransaction {
  return {
    transactionId: `txn_${Math.random().toString(36).slice(2, 10)}`,
    accountId: 'acct_1',
    merchantName: overrides.name,
    category: null,
    pending: false,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// 1. Monthly subscription detection
// ---------------------------------------------------------------------------
describe('Monthly subscription detection', () => {
  it('detects Netflix at $15.99 with 30-day intervals', async () => {
    const transactions = [
      txn({ name: 'Netflix', amount: 15.99, date: '2025-01-15' }),
      txn({ name: 'Netflix', amount: 15.99, date: '2025-02-14' }), // 30 days
      txn({ name: 'Netflix', amount: 15.99, date: '2025-03-16' }), // 30 days
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Netflix');
    expect(result[0].amount).toBe(15.99);
    expect(result[0].frequency).toBe('monthly');
  });

  it('predicts next charge date correctly for monthly subscription', async () => {
    const transactions = [
      txn({ name: 'Netflix', amount: 15.99, date: '2025-02-01' }),
      txn({ name: 'Netflix', amount: 15.99, date: '2025-03-03' }), // 30 days
      txn({ name: 'Netflix', amount: 15.99, date: '2025-04-02' }), // 30 days
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(1);
    // last charge: 2025-04-02, next: +1 month = 2025-05-02
    const expectedNext = new Date('2025-05-02');
    expect(result[0].nextChargeDate?.toISOString().slice(0, 10)).toBe(
      expectedNext.toISOString().slice(0, 10)
    );
  });
});

// ---------------------------------------------------------------------------
// 2. Weekly subscription detection
// ---------------------------------------------------------------------------
describe('Weekly subscription detection', () => {
  it('detects Spotify at $9.99 with 7-day intervals', async () => {
    const transactions = [
      txn({ name: 'Spotify', amount: 9.99, date: '2025-03-01' }),
      txn({ name: 'Spotify', amount: 9.99, date: '2025-03-08' }), // 7 days
      txn({ name: 'Spotify', amount: 9.99, date: '2025-03-15' }), // 7 days
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Spotify');
    expect(result[0].amount).toBe(9.99);
    expect(result[0].frequency).toBe('weekly');
  });

  it('predicts next charge date correctly for weekly subscription', async () => {
    const transactions = [
      txn({ name: 'Spotify', amount: 9.99, date: '2025-06-01' }),
      txn({ name: 'Spotify', amount: 9.99, date: '2025-06-08' }),
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(1);
    // last charge: 2025-06-08, next: +7 days = 2025-06-15
    const expectedNext = new Date('2025-06-15');
    expect(result[0].nextChargeDate?.toISOString().slice(0, 10)).toBe(
      expectedNext.toISOString().slice(0, 10)
    );
  });
});

// ---------------------------------------------------------------------------
// 3. Yearly subscription detection
// ---------------------------------------------------------------------------
describe('Yearly subscription detection', () => {
  it('detects Amazon Prime at $139 with annual intervals', async () => {
    const transactions = [
      txn({ name: 'Amazon Prime', amount: 139, date: '2023-04-10' }),
      txn({ name: 'Amazon Prime', amount: 139, date: '2024-04-09' }), // ~365 days
      txn({ name: 'Amazon Prime', amount: 139, date: '2025-04-10' }), // ~366 days
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Amazon Prime');
    expect(result[0].amount).toBe(139);
    expect(result[0].frequency).toBe('annual');
  });

  it('predicts next charge date correctly for yearly subscription', async () => {
    const transactions = [
      txn({ name: 'Amazon Prime', amount: 139, date: '2023-01-01' }),
      txn({ name: 'Amazon Prime', amount: 139, date: '2024-01-01' }),
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(1);
    // last charge: 2024-01-01, next: +1 year = 2025-01-01
    const expectedNext = new Date('2025-01-01');
    expect(result[0].nextChargeDate?.toISOString().slice(0, 10)).toBe(
      expectedNext.toISOString().slice(0, 10)
    );
  });
});

// ---------------------------------------------------------------------------
// 4. One-time purchases (NOT detected as subscriptions)
// ---------------------------------------------------------------------------
describe('One-time purchases (should NOT be detected)', () => {
  it('does not detect a single large purchase', async () => {
    const transactions = [
      txn({ name: 'Best Buy', amount: 1299.99, date: '2025-03-15' }),
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(0);
  });

  it('does not detect two purchases from the same merchant with wildly different amounts', async () => {
    const transactions = [
      txn({ name: 'Some Store', amount: 10.0, date: '2025-01-01' }),
      txn({ name: 'Some Store', amount: 200.0, date: '2025-02-01' }),
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(0);
  });

  it('does not detect purchases with same merchant and amount but irregular intervals', async () => {
    const transactions = [
      txn({ name: 'Random Shop', amount: 25.0, date: '2025-01-01' }),
      txn({ name: 'Random Shop', amount: 25.0, date: '2025-01-02' }), // 1 day
      txn({ name: 'Random Shop', amount: 25.0, date: '2025-06-15' }), // 164 days
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    // intervals: 1 and 164 → avg ~82.5 → not matching weekly/monthly/yearly
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 5. Amount variation tolerance (±10% boundary)
// ---------------------------------------------------------------------------
describe('Amount variation tolerance (±10%)', () => {
  it('accepts amounts within 10% of average', async () => {
    // avg = (10 + 10.5 + 9.5) / 3 = 10
    // 10 → diff 0%, 10.5 → diff 5%, 9.5 → diff 5% — all within 10%
    const transactions = [
      txn({ name: 'Newsletter', amount: 10.0, date: '2025-01-01' }),
      txn({ name: 'Newsletter', amount: 10.5, date: '2025-02-01' }),
      txn({ name: 'Newsletter', amount: 9.5, date: '2025-03-01' }),
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(1);
    expect(result[0].frequency).toBe('monthly');
    expect(result[0].amount).toBeCloseTo(10.0, 1);
  });

  it('accepts amounts right at the 10% boundary', async () => {
    // avg = (100 + 110 + 90) / 3 = 100
    // 100 → 0%, 110 → 10% exactly, 90 → 10% exactly → boundary allowed
    const transactions = [
      txn({ name: 'Gym', amount: 100, date: '2025-01-01' }),
      txn({ name: 'Gym', amount: 110, date: '2025-02-01' }),
      txn({ name: 'Gym', amount: 90, date: '2025-03-01' }),
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(1);
    expect(result[0].frequency).toBe('monthly');
  });
});

// ---------------------------------------------------------------------------
// 6. Single transaction (should NOT detect)
// ---------------------------------------------------------------------------
describe('Single transaction', () => {
  it('returns empty array for a single transaction', async () => {
    const transactions = [
      txn({ name: 'Netflix', amount: 15.99, date: '2025-01-15' }),
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(0);
  });

  it('returns empty for multiple merchants each with only one transaction', async () => {
    const transactions = [
      txn({ name: 'Netflix', amount: 15.99, date: '2025-01-15' }),
      txn({ name: 'Spotify', amount: 9.99, date: '2025-01-15' }),
      txn({ name: 'HBO', amount: 14.99, date: '2025-01-15' }),
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 7. Empty transactions array
// ---------------------------------------------------------------------------
describe('Empty transactions array', () => {
  it('returns empty array when no transactions provided', async () => {
    const result = await detectSubscriptions([], 'user1');
    expect(result).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// 8. Edge case: variable amounts just outside 10% tolerance
// ---------------------------------------------------------------------------
describe('Amounts just outside 10% tolerance', () => {
  it('rejects amounts exceeding 10% of average', async () => {
    // avg = (100 + 100 + 120.01) / 3 ≈ 106.67
    // 120.01 → diff ≈ 12.5% > 10%
    const transactions = [
      txn({ name: 'SaaS', amount: 100, date: '2025-01-01' }),
      txn({ name: 'SaaS', amount: 100, date: '2025-02-01' }),
      txn({ name: 'SaaS', amount: 120.01, date: '2025-03-01' }),
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(0);
  });

  it('rejects when one amount is just over 10% below the average', async () => {
    // avg = (100 + 100 + 79.99) / 3 ≈ 93.33
    // 79.99 → diff ≈ 14.3% > 10%
    const transactions = [
      txn({ name: 'SaaS', amount: 100, date: '2025-01-01' }),
      txn({ name: 'SaaS', amount: 100, date: '2025-02-01' }),
      txn({ name: 'SaaS', amount: 79.99, date: '2025-03-01' }),
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// 9. Edge case: irregular intervals that don't match any frequency
// ---------------------------------------------------------------------------
describe('Irregular intervals', () => {
  it('does not detect when average interval falls between known ranges', async () => {
    // intervals: 15 days and 17 days → avg = 16 → not monthly (25-35), not weekly (6-8), not yearly (350-380)
    const transactions = [
      txn({ name: 'Mystery', amount: 20, date: '2025-01-01' }),
      txn({ name: 'Mystery', amount: 20, date: '2025-01-16' }), // 15 days
      txn({ name: 'Mystery', amount: 20, date: '2025-02-02' }), // 17 days
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(0);
  });

  it('does not detect when interval is just below the monthly range (24 days)', async () => {
    const transactions = [
      txn({ name: 'Service', amount: 10, date: '2025-01-01' }),
      txn({ name: 'Service', amount: 10, date: '2025-01-25' }), // 24 days
      txn({ name: 'Service', amount: 10, date: '2025-02-18' }), // 24 days
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(0);
  });

  it('does not detect when interval is just above the monthly range (36 days)', async () => {
    const transactions = [
      txn({ name: 'Service', amount: 10, date: '2025-01-01' }),
      txn({ name: 'Service', amount: 10, date: '2025-02-06' }), // 36 days
      txn({ name: 'Service', amount: 10, date: '2025-03-14' }), // 36 days
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(0);
  });

  it('does not detect when zero-day intervals (same-day charges) exist', async () => {
    const transactions = [
      txn({ name: 'Fast', amount: 5, date: '2025-01-01' }),
      txn({ name: 'Fast', amount: 5, date: '2025-01-01' }), // 0 days (filtered out)
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    // intervals length becomes 0 after filtering, so skipped
    expect(result).toHaveLength(0);
  });
});

// ---------------------------------------------------------------------------
// Additional edge cases
// ---------------------------------------------------------------------------
describe('Additional edge cases', () => {
  it('handles transactions with negative amounts (credits)', async () => {
    // Plaid sometimes reports debits as negative
    const transactions = [
      txn({ name: 'Netflix', amount: -15.99, date: '2025-01-15' }),
      txn({ name: 'Netflix', amount: -15.99, date: '2025-02-14' }),
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(15.99); // abs value used
    expect(result[0].frequency).toBe('monthly');
  });

  it('uses merchantName when available, falls back to name', async () => {
    const transactions = [
      txn({ name: 'NETFLIX.COM', amount: 15.99, date: '2025-01-15' }),
      txn({ name: 'NETFLIX.COM', amount: 15.99, date: '2025-02-14' }),
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('NETFLIX.COM');
  });

  it('groups by normalized (lowercased, trimmed) merchant name', async () => {
    const transactions = [
      txn({ name: '  Netflix  ', amount: 15.99, date: '2025-01-15' }),
      txn({ name: 'netflix', amount: 15.99, date: '2025-02-14' }),
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(1);
    expect(result[0].frequency).toBe('monthly');
  });

  it('skips merchants with empty/short names', async () => {
    const transactions = [
      txn({ name: 'X', amount: 10, date: '2025-01-01' }),
      txn({ name: 'X', amount: 10, date: '2025-02-01' }),
      { transactionId: 'empty', accountId: 'a', name: '', amount: 10, date: '2025-01-01', merchantName: '', category: null, pending: false },
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(0); // both 'X' and '' are too short or empty
  });

  it('uses the most common category', async () => {
    const transactions = [
      txn({ name: 'Netflix', amount: 15.99, date: '2025-01-15', category: 'Entertainment' }),
      txn({ name: 'Netflix', amount: 15.99, date: '2025-02-14', category: 'Entertainment' }),
      txn({ name: 'Netflix', amount: 15.99, date: '2025-03-16', category: 'Utilities' }),
    ];
    const result = await detectSubscriptions(transactions, 'user1');
    expect(result).toHaveLength(1);
    expect(result[0].category).toBe('Entertainment');
  });
});

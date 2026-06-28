import { Configuration, PlaidApi, PlaidEnvironments, Products, CountryCode } from 'plaid';

const plaidEnv = process.env.PLAID_ENV || 'sandbox';

const configuration = new Configuration({
  basePath: PlaidEnvironments[plaidEnv],
  baseOptions: {
    headers: {
      'PLAID-CLIENT-ID': process.env.PLAID_CLIENT_ID,
      'PLAID-SECRET': process.env.PLAID_SECRET,
    },
  },
});

const plaidClient = new PlaidApi(configuration);

export async function createLinkToken(userId: string) {
  const response = await plaidClient.linkTokenCreate({
    user: { client_user_id: userId },
    client_name: 'SubAuditor',
    products: [Products.Transactions],
    country_codes: [CountryCode.Us],
    language: 'en',
  });

  return {
    linkToken: response.data.link_token,
  };
}

export async function exchangePublicToken(publicToken: string, userId: string) {
  const response = await plaidClient.itemPublicTokenExchange({
    public_token: publicToken,
  });

  return {
    accessToken: response.data.access_token,
    itemId: response.data.item_id,
  };
}

export async function getAccounts(accessToken: string) {
  const response = await plaidClient.accountsGet({
    access_token: accessToken,
  });

  return response.data.accounts.map((account) => ({
    id: account.account_id,
    name: account.name,
    type: account.type,
    subtype: account.subtype,
    mask: account.mask,
    balances: {
      available: account.balances.available,
      current: account.balances.current,
      limit: account.balances.limit,
    },
  }));
}

export async function getTransactions(
  accessToken: string,
  startDate: string,
  endDate: string
) {
  let allTransactions: any[] = [];
  let hasMore = true;
  let offset = 0;
  const count = 500;

  while (hasMore) {
    const response = await plaidClient.transactionsGet({
      access_token: accessToken,
      start_date: startDate,
      end_date: endDate,
      options: {
        count,
        offset,
      },
    });

    allTransactions = allTransactions.concat(response.data.transactions);
    hasMore = allTransactions.length < response.data.total_transactions;
    offset += count;
  }

  return allTransactions.map((txn) => ({
    transactionId: txn.transaction_id,
    accountId: txn.account_id,
    amount: txn.amount,
    date: txn.date,
    name: txn.name,
    merchantName: txn.merchant_name,
    category: txn.category ? txn.category.join(' > ') : null,
    pending: txn.pending,
  }));
}

export { plaidClient };

import { NextRequest, NextResponse } from 'next/server';
import { PlaidService } from '@/lib/plaid-service';
import { createClient } from '@/utils/supabase/server';
import { getPlaidSecret } from '@/lib/plaid-connect';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    const userId = user?.id;
    if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const plaidSecret = await getPlaidSecret(userId);
    const { publicToken, metadata } = await request.json();

    if (!publicToken) {
      return NextResponse.json(
        { error: 'publicToken is required' },
        { status: 400 }
      );
    }

    // Exchange public token for access token
    const exchangeResult = await PlaidService.exchangePublicToken(publicToken, plaidSecret);

    // Get accounts for this item
    const accountsResult = await PlaidService.getAccounts(exchangeResult.accessToken, plaidSecret);

    // Plaid Link can return multiple accounts, but a processor token must be
    // created only for the account(s) the user selected. Creating tokens for
    // every returned account can fail on non-debitable accounts and can hand a
    // payment processor an account the user did not choose.
    const selectedAccountIds = new Set(
      Array.isArray(metadata?.accounts)
        ? metadata.accounts
            .map((account: any) => account?.id || account?.account_id)
            .filter((accountId: unknown): accountId is string => typeof accountId === 'string' && accountId.length > 0)
        : [],
    );
    if (selectedAccountIds.size === 0) {
      throw new Error('Select at least one checking or savings account to continue.');
    }

    const selectedAccounts = accountsResult.accounts.filter((account) =>
      selectedAccountIds.has(account.accountId),
    );
    const eligibleAccounts = selectedAccounts.filter(
      (account) => account.type === 'depository' && ['checking', 'savings', 'cash management'].includes(account.subtype),
    );

    if (eligibleAccounts.length === 0) {
      throw new Error('Select a checking or savings account to continue.');
    }

    const processor = process.env.PLAID_PROCESSOR || 'adyen';
    const processorTokens = [];
    for (const account of eligibleAccounts) {
      await PlaidService.saveAccount(
        userId,
        exchangeResult.itemId,
        exchangeResult.accessToken,
        accountsResult.item.institutionId,
        {
          accountId: account.accountId,
          name: account.name,
          mask: account.mask,
          type: account.type,
          subtype: account.subtype,
          balances: account.balances,
          institutionName: metadata?.institution?.name || metadata?.institutionName || 'Bank',
        }
      );

      const processorToken = await PlaidService.createProcessorToken({
        accessToken: exchangeResult.accessToken,
        accountId: account.accountId,
        processor,
        plaidSecret,
      });
      processorTokens.push(processorToken);
    }

    // Transactions may still be processing immediately after Link completes.
    // Account linking must succeed even when Plaid returns PRODUCT_NOT_READY.
    let transactionCount = 0;
    try {
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
      const transactionsResult = await PlaidService.getTransactions(
        exchangeResult.accessToken,
        startDate,
        endDate,
        undefined,
        plaidSecret
      );
      transactionCount = transactionsResult.transactions.length;
    } catch (transactionError) {
      console.warn('[v0] Transactions are not ready yet; account linking completed:', transactionError);
    }

    return NextResponse.json({
      success: true,
      itemId: exchangeResult.itemId,
      accountCount: accountsResult.accounts.length,
      transactionCount,
      processor,
      processorTokenCount: processorTokens.length,
      // Adyen needs the processor token to create its payment method. Return
      // only tokens for accounts explicitly selected in Plaid Link.
      processorTokens,
    });
  } catch (error: any) {
    console.error('[v0] Error exchanging token:', error);
    const message = error instanceof Error ? error.message : 'Failed to exchange token';
    const status = /required|Unauthorized|invalid|not configured/i.test(message) ? 400 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}

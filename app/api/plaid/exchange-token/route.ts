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

    // Save each account to database
    for (const account of accountsResult.accounts) {
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
          institutionName: metadata?.institutionName || 'Bank',
        }
      );
    }

    // Get transactions for the last 30 days
    const endDate = new Date().toISOString().split('T')[0];
    const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const transactionsResult = await PlaidService.getTransactions(
      exchangeResult.accessToken,
      startDate,
      endDate,
      undefined,
      plaidSecret
    );

    console.log(`[v0] Retrieved ${transactionsResult.transactions.length} transactions`);

    return NextResponse.json({
      success: true,
      itemId: exchangeResult.itemId,
      accountCount: accountsResult.accounts.length,
      transactionCount: transactionsResult.transactions.length,
    });
  } catch (error: any) {
    console.error('[v0] Error exchanging token:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to exchange token' },
      { status: 500 }
    );
  }
}

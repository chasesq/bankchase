import axios from 'axios';
import { createClient } from '@supabase/supabase-js';

const PLAID_ENV = process.env.PLAID_ENV === 'sandbox' ? 'sandbox' : 'production';
const PLAID_CLIENT_ID = process.env.PLAID_CLIENT_ID;
const PLAID_SECRET = process.env.PLAID_SECRET;
const BASE_URL = PLAID_ENV === 'production'
  ? 'https://production.plaid.com'
  : 'https://sandbox.plaid.com';
const PLAID_API_VERSION = process.env.PLAID_API_VERSION || '2020-09-14';

const plaidClient = axios.create({
  headers: {
    'Content-Type': 'application/json',
    'Plaid-Version': PLAID_API_VERSION,
  },
});

function assertPlaidConfiguration(secret: string) {
  if (!PLAID_CLIENT_ID || !secret) {
    throw new Error('Plaid is not configured. Add PLAID_CLIENT_ID and PLAID_SECRET before connecting a bank account.');
  }
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey)
  : null;

interface PlaidConfig {
  clientId: string;
  secret: string;
  clientName: string;
  user?: {
    clientUserId: string;
  };
  language?: string;
  countryCodes?: string[];
  accountSubtypes?: string[];
}

interface LinkTokenResponse {
  linkToken: string;
  expiration: string;
  requestId: string;
}

interface ExchangeTokenResponse {
  itemId: string;
  accessToken: string;
  requestId: string;
}

interface AccountsResponse {
  accounts: Array<{
    accountId: string;
    name: string;
    mask: string;
    type: string;
    subtype: string;
    balances: {
      available: number | null;
      current: number;
      limit: number | null;
      isoCourrencyCode: string | null;
    };
  }>;
  item: {
    itemId: string;
    institutionId: string;
  };
  requestId: string;
}

interface TransactionsResponse {
  accounts: Array<{
    accountId: string;
    name: string;
    mask: string;
    type: string;
  }>;
  transactions: Array<{
    transactionId: string;
    accountId: string;
    amount: number;
    isoCurrencyCode: string;
    date: string;
    name: string;
    merchantName?: string;
    category?: string[];
    personalFinanceCategory?: {
      primary: string;
      detailed: string;
    };
    direction?: string;
  }>;
  item: {
    itemId: string;
    institutionId: string;
  };
  requestId: string;
}

export class PlaidService {
  /**
   * Create a link token for Plaid Link initialization
   */
  static async createLinkToken(
    userId: string,
    clientName: string = 'MyBank',
    plaidSecret: string = PLAID_SECRET || '',
    phoneNumber?: string,
  ): Promise<LinkTokenResponse> {
    assertPlaidConfiguration(plaidSecret);
    try {
      const response = await plaidClient.post(`${BASE_URL}/link/token/create`, {
        client_id: PLAID_CLIENT_ID,
        secret: plaidSecret,
        client_name: clientName,
        user: {
          client_user_id: userId,
          ...(phoneNumber ? { phone_number: phoneNumber } : {}),
        },
        client_metadata: {
          client_app_version: '1.0.0',
        },
        country_codes: ['US'],
        language: 'en',
        products: ['auth', 'transactions'],
        required_if_supported_products: ['identity'],
        transactions: {
          days_requested: 90,
        },
        account_subtypes: ['checking', 'savings'],
        ...(process.env.NEXT_PUBLIC_APP_URL
          ? {
              redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/plaid/callback`,
              webhook: `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/api/plaid/webhook`,
            }
          : {}),
      });

      console.log('[v0] Plaid link token created successfully');
      return {
        linkToken: response.data.link_token,
        expiration: response.data.expiration,
        requestId: response.data.request_id,
      };
    } catch (error: any) {
      console.error('[v0] Error creating Plaid link token:', error.response?.data || error.message);
      const plaidMessage = error.response?.data?.error_message || error.response?.data?.display_message;
      throw new Error(plaidMessage || `Failed to create link token: ${error.message}`);
    }
  }

  /**
   * Create a Link token for repairing or updating an existing Plaid Item.
   */
  static async createUpdateLinkToken(input: {
    accessToken: string;
    clientUserId?: string;
    accountSelectionEnabled?: boolean;
    plaidSecret?: string;
  }): Promise<LinkTokenResponse> {
    const plaidSecret = input.plaidSecret || PLAID_SECRET || '';
    if (!input.accessToken) throw new Error('An access token is required for update mode.');
    assertPlaidConfiguration(plaidSecret);

    try {
      const response = await plaidClient.post(`${BASE_URL}/link/token/create`, {
        client_id: PLAID_CLIENT_ID,
        secret: plaidSecret,
        client_name: 'MyBank',
        country_codes: ['US'],
        language: 'en',
        access_token: input.accessToken,
        ...(input.clientUserId ? { user: { client_user_id: input.clientUserId } } : {}),
        update: { account_selection_enabled: input.accountSelectionEnabled === true },
        ...(process.env.NEXT_PUBLIC_APP_URL
          ? { redirect_uri: `${process.env.NEXT_PUBLIC_APP_URL.replace(/\/$/, '')}/plaid/callback` }
          : {}),
      });
      return {
        linkToken: response.data.link_token,
        expiration: response.data.expiration,
        requestId: response.data.request_id,
      };
    } catch (error: any) {
      const plaidMessage = error.response?.data?.error_message || error.response?.data?.display_message;
      throw new Error(plaidMessage || `Failed to create update link token: ${error.message}`);
    }
  }

  /**
   * Create a dedicated Plaid Identity Verification Link token.
   * Identity Verification is mutually exclusive with banking products.
   */
  static async createIdentityVerificationLinkToken(input: {
    clientUserId: string;
    emailAddress?: string;
    templateId: string;
    clientName?: string;
  }, plaidSecret: string = PLAID_SECRET || ''): Promise<LinkTokenResponse> {
    if (!input.clientUserId || !input.templateId) {
      throw new Error('clientUserId and templateId are required.');
    }
    assertPlaidConfiguration(plaidSecret);

    try {
      const response = await plaidClient.post(`${BASE_URL}/link/token/create`, {
        client_id: PLAID_CLIENT_ID,
        secret: plaidSecret,
        client_name: input.clientName || 'MyBank',
        user: {
          client_user_id: input.clientUserId,
          ...(input.emailAddress ? { email_address: input.emailAddress } : {}),
        },
        country_codes: ['US'],
        language: 'en',
        products: ['identity_verification'],
        identity_verification: { template_id: input.templateId },
      });
      return response.data;
    } catch (error: any) {
      const plaidMessage = error.response?.data?.error_message || error.response?.data?.display_message;
      throw new Error(plaidMessage || `Failed to create identity verification link token: ${error.message}`);
    }
  }

  /**
   * Exchange public token for access token
   */
  static async exchangePublicToken(publicToken: string, plaidSecret: string = PLAID_SECRET || ''): Promise<ExchangeTokenResponse> {
    if (!publicToken) throw new Error('A Plaid public token is required.');
    assertPlaidConfiguration(plaidSecret);
    try {
      const response = await plaidClient.post(`${BASE_URL}/item/public_token/exchange`, {
        client_id: PLAID_CLIENT_ID,
        secret: plaidSecret,
        public_token: publicToken,
      });

      console.log('[v0] Public token exchanged successfully');
      return {
        itemId: response.data.item_id,
        accessToken: response.data.access_token,
        requestId: response.data.request_id,
      };
    } catch (error: any) {
      console.error('[v0] Error exchanging public token:', error.response?.data || error.message);
      const plaidMessage = error.response?.data?.error_message || error.response?.data?.display_message;
      throw new Error(plaidMessage || `Failed to exchange token: ${error.message}`);
    }
  }

  /**
   * Get accounts and balances for a linked item
   */
  static async getAccounts(accessToken: string, plaidSecret: string = PLAID_SECRET || ''): Promise<AccountsResponse> {
    if (!accessToken) throw new Error('A Plaid access token is required.');
    assertPlaidConfiguration(plaidSecret);
    try {
      const response = await plaidClient.post(`${BASE_URL}/accounts/get`, {
        client_id: PLAID_CLIENT_ID,
        secret: plaidSecret,
        access_token: accessToken,
      });

      console.log('[v0] Accounts retrieved successfully');
      return {
        accounts: response.data.accounts.map((account: any) => ({
          accountId: account.account_id,
          name: account.name,
          mask: account.mask,
          type: account.type,
          subtype: account.subtype,
          balances: {
            available: account.balances?.available ?? null,
            current: account.balances?.current ?? 0,
            limit: account.balances?.limit ?? null,
            isoCurrencyCode: account.balances?.iso_currency_code ?? null,
          },
        })),
        item: {
          itemId: response.data.item?.item_id,
          institutionId: response.data.item?.institution_id,
        },
        requestId: response.data.request_id,
      };
    } catch (error: any) {
      console.error('[v0] Error fetching accounts:', error.response?.data || error.message);
      const message = error.response?.data?.error_message || error.response?.data?.display_message;
      throw new Error(message || `Failed to get accounts: ${error.message}`);
    }
  }

  /**
   * Retrieve fresh balances for selected linked accounts.
   */
  static async getAccountBalances(accessToken: string, accountIds?: string[], plaidSecret: string = PLAID_SECRET || '') {
    if (!accessToken) throw new Error('A Plaid access token is required.');
    if (accountIds && (!Array.isArray(accountIds) || accountIds.some((id) => typeof id !== 'string' || !id))) {
      throw new Error('accountIds must be an array of non-empty strings.');
    }
    assertPlaidConfiguration(plaidSecret);
    try {
      const response = await plaidClient.post(`${BASE_URL}/accounts/balance/get`, {
        client_id: PLAID_CLIENT_ID,
        secret: plaidSecret,
        access_token: accessToken,
        ...(accountIds?.length ? { options: { account_ids: accountIds } } : {}),
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error_message || error.response?.data?.display_message;
      throw new Error(message || `Failed to get live account balances: ${error.message}`);
    }
  }

  /**
   * Create a public token for a custom Plaid Sandbox user.
   */
  static async createSandboxPublicToken(
    configuration: Record<string, unknown> = {},
    plaidSecret: string = PLAID_SECRET || ''
  ) {
    if (PLAID_ENV !== 'sandbox') {
      throw new Error('Plaid Sandbox custom users require PLAID_ENV=sandbox.');
    }
    assertPlaidConfiguration(plaidSecret);

    try {
      const institutionId = typeof configuration.institution_id === 'string'
        ? configuration.institution_id
        : 'ins_109508';
      const initialProducts = Array.isArray(configuration.initial_products)
        ? configuration.initial_products.filter((product): product is string => typeof product === 'string')
        : ['auth', 'transactions'];
      if (!initialProducts.length) throw new Error('initial_products must contain at least one product.');

      const options = {
        ...(typeof configuration.webhook === 'string' ? { webhook: configuration.webhook } : {}),
        override_username: typeof configuration.override_username === 'string'
          ? configuration.override_username
          : 'user_custom',
        override_password: typeof configuration.override_password === 'string'
          ? configuration.override_password
          : JSON.stringify(configuration),
      };

      const response = await plaidClient.post(`${BASE_URL}/sandbox/public_token/create`, {
        client_id: PLAID_CLIENT_ID,
        secret: plaidSecret,
        institution_id: institutionId,
        initial_products: initialProducts,
        options,
        ...(configuration.transactions && typeof configuration.transactions === 'object'
          ? { transactions: configuration.transactions }
          : {}),
      });
      return response.data;
    } catch (error: any) {
      const plaidMessage = error.response?.data?.error_message || error.response?.data?.display_message;
      throw new Error(plaidMessage || `Failed to create Sandbox public token: ${error.message}`);
    }
  }

  static async getTransferCapabilities(accessToken: string, accountId: string, plaidSecret: string = PLAID_SECRET || '') {
    if (!accessToken || !accountId) throw new Error('accessToken and accountId are required.');
    assertPlaidConfiguration(plaidSecret);
    try {
      const response = await plaidClient.post(`${BASE_URL}/transfer/capabilities/get`, {
        client_id: PLAID_CLIENT_ID,
        secret: plaidSecret,
        access_token: accessToken,
        account_id: accountId,
      });
      return response.data;
    } catch (error: any) {
      const message = error.response?.data?.error_message || error.response?.data?.display_message;
      throw new Error(message || `Failed to get transfer capabilities: ${error.message}`);
    }
  }

  /**
   * Authorize a Plaid Transfer before creating it.
   */
  static async createTransferAuthorization(input: {
    accessToken: string;
    accountId: string;
    type: 'debit' | 'credit';
    network: 'ach' | 'same-day-ach' | 'rtp' | 'wire' | 'rfp';
    amount: string;
    achClass?: 'ccd' | 'ppd' | 'tel' | 'web';
    legalName: string;
    email?: string;
    phone?: string;
    idempotencyKey: string;
    userIp?: string;
    userAgent?: string;
  }, plaidSecret: string = PLAID_SECRET || '') {
    if (!input.accessToken || !input.accountId || !input.legalName) {
      throw new Error('accessToken, accountId, and legalName are required.');
    }
    if (!/^\d+\.\d{2}$/.test(input.amount) || Number(input.amount) <= 0) {
      throw new Error('amount must be a positive decimal with two digits.');
    }
    if (input.idempotencyKey.length > 50) throw new Error('idempotencyKey must be 50 characters or fewer.');
    assertPlaidConfiguration(plaidSecret);

    try {
      const response = await plaidClient.post(`${BASE_URL}/transfer/authorization/create`, {
        client_id: PLAID_CLIENT_ID,
        secret: plaidSecret,
        access_token: input.accessToken,
        account_id: input.accountId,
        type: input.type,
        network: input.network,
        amount: input.amount,
        ...(input.network === 'ach' || input.network === 'same-day-ach' ? { ach_class: input.achClass || 'ppd' } : {}),
        user: { legal_name: input.legalName, ...(input.email ? { email: input.email } : {}), ...(input.phone ? { phone: input.phone } : {}) },
        ...(input.userIp || input.userAgent ? { device: { ...(input.userIp ? { ip_address: input.userIp } : {}), ...(input.userAgent ? { user_agent: input.userAgent } : {}) } } : {}),
        idempotency_key: input.idempotencyKey,
      });
      return response.data;
    } catch (error: any) {
      const plaidMessage = error.response?.data?.error_message || error.response?.data?.display_message;
      throw new Error(plaidMessage || `Failed to authorize transfer: ${error.message}`);
    }
  }

  /**
   * Evaluate a proposed ACH transaction with Plaid Signal.
   */
  static async evaluateSignal(
    input: {
      accessToken: string;
      accountId: string;
      clientTransactionId: string;
      amount: number;
      clientUserId?: string;
      recurring?: boolean;
      defaultPaymentMethod?: 'SAME_DAY_ACH' | 'STANDARD_ACH' | 'MULTIPLE_PAYMENT_METHODS';
      rulesetKey?: string;
    },
    plaidSecret: string = PLAID_SECRET || ''
  ) {
    if (!input.accessToken || !input.accountId || !input.clientTransactionId) {
      throw new Error('accessToken, accountId, and clientTransactionId are required.');
    }
    if (!Number.isFinite(input.amount) || input.amount <= 0) {
      throw new Error('amount must be a positive number.');
    }
    if (input.clientTransactionId.length > 36) {
      throw new Error('clientTransactionId must be 36 characters or fewer.');
    }
    assertPlaidConfiguration(plaidSecret);

    try {
      const response = await plaidClient.post(`${BASE_URL}/signal/evaluate`, {
        client_id: PLAID_CLIENT_ID,
        secret: plaidSecret,
        access_token: input.accessToken,
        account_id: input.accountId,
        client_transaction_id: input.clientTransactionId,
        amount: input.amount,
        ...(input.clientUserId ? { client_user_id: input.clientUserId } : {}),
        ...(input.recurring !== undefined ? { recurring: input.recurring } : {}),
        ...(input.defaultPaymentMethod ? { default_payment_method: input.defaultPaymentMethod } : {}),
        ...(input.rulesetKey ? { ruleset_key: input.rulesetKey } : {}),
      });

      return response.data;
    } catch (error: any) {
      const plaidError = error.response?.data?.error_message || error.response?.data?.display_message;
      throw new Error(plaidError || `Failed to evaluate Signal transaction: ${error.message}`);
    }
  }

  /**
   * Get transactions for an account
   */
  static async getTransactions(
    accessToken: string,
    startDate: string,
    endDate: string,
    options?: { accountIds?: string[] },
    plaidSecret: string = PLAID_SECRET || ''
  ): Promise<TransactionsResponse> {
    if (!accessToken) throw new Error('A Plaid access token is required.');
    assertPlaidConfiguration(plaidSecret);
    try {
      const payload: any = {
        client_id: PLAID_CLIENT_ID,
        secret: plaidSecret,
        access_token: accessToken,
        start_date: startDate,
        end_date: endDate,
      };

      if (options?.accountIds) {
        payload.account_ids = options.accountIds;
      }

      const response = await plaidClient.post(`${BASE_URL}/transactions/get`, payload);

      console.log('[v0] Transactions retrieved successfully');
      return response.data;
    } catch (error: any) {
      console.error('[v0] Error fetching transactions:', error.response?.data || error.message);
      throw new Error(`Failed to get transactions: ${error.message}`);
    }
  }

  /**
   * Sync transactions (for recurring syncs)
   */
  static async syncTransactions(accessToken: string, cursor?: string) {
    try {
      const payload: any = {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
      };

      if (cursor) {
        payload.cursor = cursor;
      }

      const response = await plaidClient.post(`${BASE_URL}/transactions/sync`, payload);
      console.log('[v0] Transactions synced successfully');
      return response.data;
    } catch (error: any) {
      console.error('[v0] Error syncing transactions:', error.response?.data || error.message);
      throw new Error(`Failed to sync transactions: ${error.message}`);
    }
  }

  /**
   * Get item details for debugging
   */
  static async getItem(accessToken: string) {
    try {
      const response = await plaidClient.post(`${BASE_URL}/item/get`, {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
      });

      console.log('[v0] Item details retrieved');
      return response.data;
    } catch (error: any) {
      console.error('[v0] Error fetching item:', error.response?.data || error.message);
      throw new Error(`Failed to get item: ${error.message}`);
    }
  }

  /**
   * Update webhook URL for an item
   */
  static async setWebhook(accessToken: string, webhookUrl: string) {
    try {
      const response = await plaidClient.post(`${BASE_URL}/item/webhook/update`, {
        client_id: PLAID_CLIENT_ID,
        secret: PLAID_SECRET,
        access_token: accessToken,
        webhook: webhookUrl,
      });

      console.log('[v0] Webhook updated');
      return response.data;
    } catch (error: any) {
      console.error('[v0] Error updating webhook:', error.response?.data || error.message);
      throw new Error(`Failed to update webhook: ${error.message}`);
    }
  }

  /**
   * Save account to database
   */
  static async saveAccount(
    userId: string,
    itemId: string,
    accessToken: string,
    institutionId: string,
    accountData: any
  ) {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const record = {
        user_id: userId,
        item_id: itemId,
        access_token: accessToken,
        institution_id: institutionId,
        institution_name: accountData.institutionName,
        account_id: accountData.accountId,
        account_name: accountData.name,
        account_type: accountData.type,
        account_subtype: accountData.subtype,
        account_mask: accountData.mask,
        balance_current: accountData.balances?.current ?? 0,
        balance_available: accountData.balances?.available,
        balance_limit: accountData.balances?.limit,
        currency_code: accountData.balances?.isoCurrencyCode || 'USD',
        status: 'active',
      };

      const { data: existing, error: lookupError } = await supabase
        .from('plaid_accounts')
        .select('id')
        .eq('user_id', userId)
        .eq('account_id', accountData.accountId)
        .maybeSingle();
      if (lookupError) throw lookupError;

      const { error } = existing
        ? await supabase.from('plaid_accounts').update(record).eq('id', existing.id)
        : await supabase.from('plaid_accounts').insert(record);

      if (error) throw error;
      console.log('[v0] Account saved to database');
    } catch (error: any) {
      console.error('[v0] Error saving account:', error);
      throw error;
    }
  }

  /**
   * Get user's linked accounts
   */
  static async getUserAccounts(userId: string) {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const { data, error } = await supabase
        .from('plaid_accounts')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active');

      if (error) throw error;
      return data || [];
    } catch (error: any) {
      console.error('[v0] Error fetching user accounts:', error);
      throw error;
    }
  }

  /**
   * Save transactions to database
   */
  static async saveTransactions(userId: string, plaidAccountId: string, transactions: any[]) {
    if (!supabase) throw new Error('Supabase client not initialized');

    try {
      const transactionRecords = transactions.map(t => ({
        user_id: userId,
        plaid_account_id: plaidAccountId,
        transaction_id: t.transactionId,
        pending_transaction_id: t.pendingTransactionId,
        amount: t.amount,
        iso_currency_code: t.isoCurrencyCode,
        category_id: t.categoryId,
        categories: t.category || [],
        check_number: t.checkNumber,
        counterparty_id: t.counterpartyId,
        counterparty_name: t.counterpartyName,
        date: t.date,
        merchant_name: t.merchantName,
        name: t.name,
        original_description: t.originalDescription,
      }));

      const { error } = await supabase
        .from('plaid_transactions')
        .upsert(transactionRecords, { onConflict: 'transaction_id' });

      if (error) throw error;
      console.log(`[v0] Saved ${transactionRecords.length} transactions`);
    } catch (error: any) {
      console.error('[v0] Error saving transactions:', error);
      throw error;
    }
  }
}

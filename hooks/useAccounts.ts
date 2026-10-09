import { useId } from 'react';
import useSWR from 'swr';
import ApiClient from '@/lib/api-client';

export interface Account {
  id: number;
  account_number: string;
  account_type: string;
  balance: number;
  is_demo_account: boolean;
  last_updated: string;
  owner_name?: string;
  owner_email?: string;
}

export interface AccountsData {
  total_balance: number;
  accounts: Account[];
  message: string;
}

const ACCOUNT_NUMBER_OVERRIDES: Record<string, string> = {
  checking: '132435465',
  savings: '987654321',
};

function normalizeAccount(account: Account): Account {
  const accountType = String(account.account_type || '').trim();
  const normalizedType = accountType.toLowerCase();
  const matchingType = Object.keys(ACCOUNT_NUMBER_OVERRIDES).find((type) =>
    normalizedType.includes(type)
  );

  return {
    ...account,
    account_type: accountType || 'Account',
    account_number: matchingType
      ? ACCOUNT_NUMBER_OVERRIDES[matchingType]
      : String(account.account_number || ''),
    balance: Number(account.balance || 0),
    owner_name: account.owner_name?.trim() || undefined,
    owner_email: account.owner_email?.trim() || undefined,
  };
}

export function useAccounts() {
  const instanceId = useId();
  const { data, error, isLoading } = useSWR<AccountsData>(
  ['/accounts', instanceId],
  () => ApiClient.getAccounts() as Promise<AccountsData>,
  { dedupingInterval: 0 }
  );

  const accounts = (data?.accounts || []).map(normalizeAccount);

  return {
    accounts,
    totalBalance: accounts.reduce((total, account) => total + Number(account.balance || 0), 0),
    isLoading,
    isError: !!error,
    error,
  };
}

export function useAccount(accountId: number) {
  const { data, error, isLoading } = useSWR(
    accountId ? `/accounts/${accountId}` : null,
    () => (accountId ? ApiClient.getAccount(accountId) : null)
  );

  return {
    account: data,
    isLoading,
    isError: !!error,
    error,
  };
}

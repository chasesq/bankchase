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

export function useAccounts() {
  const instanceId = useId();
  const { data, error, isLoading } = useSWR<AccountsData>(
  ['/accounts', instanceId],
  () => ApiClient.getAccounts() as Promise<AccountsData>,
  { dedupingInterval: 0 }
  );

  const accounts = (data?.accounts || []).map((account) => {
    const normalizedType = account.account_type.toLowerCase();
    const requestedNumber = normalizedType.includes('checking')
      ? '132435465'
      : normalizedType.includes('savings')
        ? '987654321'
        : account.account_number;

    return { ...account, account_number: requestedNumber };
  });

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

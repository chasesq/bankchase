'use client';

import React, { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PlaidLinkButton } from './plaid-link-button';
import { AlertCircle, Loader2, Trash2, DollarSign } from 'lucide-react';

interface PlaidAccount {
  id: string;
  account_name: string;
  account_mask: string;
  account_type: string;
  institution_name: string;
  balance_current: number;
  balance_available: number;
  currency_code: string;
  status: string;
}

const SANDBOX_PROFILES = [
  {
    id: 'college-student',
    label: 'College Student',
    phone: '+1 (415) 555-0131',
    description: 'Campus checking and a small student card for early financial history.',
  },
  {
    id: 'risk-review',
    label: 'Risk Review',
    phone: '+1 (415) 555-0134',
    description: 'Low available cash, NSF activity, peer payments, and contact-data churn.',
  },
] as const;

export function PlaidAccountsManager() {
  const [selectedProfile, setSelectedProfile] = useState<(typeof SANDBOX_PROFILES)[number]['id']>('college-student');
  const [accounts, setAccounts] = useState<PlaidAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [totalBalance, setTotalBalance] = useState(0);

  const fetchAccounts = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/plaid/accounts', {
        credentials: 'include',
        cache: 'no-store',
      });

      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error || 'Failed to fetch accounts');

      setAccounts(data.accounts || []);

      // Calculate total balance
      const total = (data.accounts || []).reduce(
        (sum: number, acc: PlaidAccount) => sum + (acc.balance_current || 0),
        0
      );
      setTotalBalance(total);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAccounts();
  }, []);

  const getAccountIcon = (type: string) => {
    return <DollarSign className="h-6 w-6 text-blue-600" />;
  };

  const selectedSandboxProfile = SANDBOX_PROFILES.find((profile) => profile.id === selectedProfile) ?? SANDBOX_PROFILES[0];

  const handleAccountLinked = () => {
    void fetchAccounts();
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Linked Bank Accounts</h2>
        <p className="text-muted-foreground">Manage your connected financial accounts</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 p-4 border border-red-200">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <span className="text-red-700">{error}</span>
        </div>
      )}

      {/* Total Balance Card */}
      {!loading && accounts.length > 0 && (
        <Card className="p-6 bg-gradient-to-br from-blue-50 to-blue-100">
          <div className="space-y-2">
            <p className="text-sm text-blue-700 font-medium">Total Balance</p>
            <p className="text-4xl font-bold text-blue-900">
              ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </p>
            <p className="text-xs text-blue-700">{accounts.length} account{accounts.length !== 1 ? 's' : ''}</p>
          </div>
        </Card>
      )}

      {/* Accounts List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : accounts.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {accounts.map((account) => (
            <Card key={account.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {getAccountIcon(account.account_type)}
                  <div>
                    <p className="font-semibold">{account.account_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {account.institution_name}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="capitalize">
                  {account.account_type}
                </Badge>
              </div>

              <div className="space-y-3 mb-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Account Number</span>
                  <span className="font-mono text-sm">••••{account.account_mask}</span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Current Balance</span>
                  <span className="font-bold">
                    {account.balance_current.toLocaleString('en-US', {
                      style: 'currency',
                      currency: account.currency_code,
                    })}
                  </span>
                </div>

                {account.balance_available != null && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Available Balance</span>
                    <span>
                      {account.balance_available.toLocaleString('en-US', {
                        style: 'currency',
                        currency: account.currency_code,
                      })}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="flex-1">
                  View Details
                </Button>
                <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="p-6">
          <div className="flex flex-col gap-4 text-left">
            <div>
              <h3 className="font-semibold">Choose a Plaid Sandbox profile</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Select a starter profile before opening Link. The phone number seeds the matching Plaid sandbox client.
              </p>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="sandbox-profile">
              Starter profile
              <select
                id="sandbox-profile"
                value={selectedProfile}
                onChange={(event) => setSelectedProfile(event.target.value as typeof selectedProfile)}
                className="h-10 rounded-md border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
              >
                {SANDBOX_PROFILES.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label} — {profile.phone}
                  </option>
                ))}
              </select>
            </label>
            <p className="text-sm text-muted-foreground">{selectedSandboxProfile.description}</p>
          </div>
        </Card>
      )}

      {/* Link New Account */}
      {(
        <Card className="p-6">
          <div className="flex flex-col gap-4">
            <div>
              <h3 className="font-semibold">Link Another Account</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Choose the sandbox profile you want Plaid Link to continue using.
              </p>
            </div>
            <label className="flex flex-col gap-2 text-sm font-medium" htmlFor="sandbox-profile-existing">
              Starter profile
              <select
                id="sandbox-profile-existing"
                value={selectedProfile}
                onChange={(event) => setSelectedProfile(event.target.value as typeof selectedProfile)}
                className="h-10 rounded-md border bg-background px-3 font-normal outline-none focus:ring-2 focus:ring-ring"
              >
                {SANDBOX_PROFILES.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.label} — {profile.phone}
                  </option>
                ))}
              </select>
            </label>
            <PlaidLinkButton
              phoneNumber={selectedSandboxProfile.phone}
              onSuccess={handleAccountLinked}
            />
          </div>
        </Card>
      )}
    </div>
  );
}

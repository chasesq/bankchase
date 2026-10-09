'use client';

import { useState } from 'react';
import { useAccounts } from '@/hooks/useAccounts';
import { useTransactions } from '@/hooks/useTransactions';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { Navigation } from '@/components/Navigation';
import { ArrowUpRight, ArrowDownLeft, TrendingUp, Wallet, Copy, Check } from 'lucide-react';
import { format } from 'date-fns';
import Link from 'next/link';

function AccountsContent() {
  const { accounts, totalBalance, isLoading } = useAccounts();
  const { transactions } = useTransactions(undefined, 10);
  const [copiedAccountId, setCopiedAccountId] = useState<number | null>(null);

  const copyAccountNumber = async (accountId: number, accountNumber: string) => {
    try {
      await navigator.clipboard.writeText(accountNumber);
      setCopiedAccountId(accountId);
      window.setTimeout(() => setCopiedAccountId(null), 1800);
    } catch {
      // Clipboard access can be unavailable in an embedded preview.
      const input = document.createElement('input');
      input.value = accountNumber;
      input.setAttribute('readonly', 'true');
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      document.execCommand('copy');
      input.remove();
      setCopiedAccountId(accountId);
      window.setTimeout(() => setCopiedAccountId(null), 1800);
    }
  };

  return (
    <main className="min-h-screen bg-background pb-24 md:pb-8">
      <div className="max-w-6xl mx-auto p-4 md:p-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-2">Accounts</h1>
          <p className="text-muted-foreground">Manage your accounts and view transactions</p>
        </div>

        {/* Total Balance Card */}
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 mb-8 text-background shadow-lg">
          <p className="text-background/80 mb-2 text-sm font-medium">Total Balance</p>
          <h2 className="text-5xl font-bold mb-6">
            ${totalBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </h2>
          <div className="flex justify-between items-end">
            <div className="flex gap-4">
              <button className="bg-background/20 hover:bg-background/30 px-4 py-2 rounded-lg transition">
                Send Money
              </button>
              <button className="bg-background/20 hover:bg-background/30 px-4 py-2 rounded-lg transition">
                Request
              </button>
            </div>
            <TrendingUp className="w-6 h-6 opacity-50" />
          </div>
        </div>

        {/* Accounts Grid */}
        <div className="mb-8">
          <h3 className="text-2xl font-bold text-foreground mb-4">Your Accounts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {isLoading ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                Loading accounts...
              </div>
            ) : accounts.length > 0 ? (
              accounts.map((account) => (
                <div
                  key={account.id}
                  className="bg-card border border-border rounded-xl p-6 hover:border-primary/50 transition"
                >
                  <div className="flex justify-between items-start mb-4">
                    <Link href={`/accounts/${account.id}`} className="group min-w-0">
                      <p className="text-sm text-muted-foreground mb-1">
                        {account.account_type}
                      </p>
                      <p className="text-lg font-semibold text-foreground font-mono break-all group-hover:text-primary transition">
                        {account.account_number}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        Owner: {account.owner_name || 'Primary account owner'}
                      </p>
                    </Link>
                    <button
                      type="button"
                      aria-label={`Copy ${account.account_type} account number`}
                      title="Copy account number"
                      onClick={() => copyAccountNumber(account.id, account.account_number)}
                      className="ml-3 shrink-0 rounded-md p-2 text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    >
                      {copiedAccountId === account.id ? (
                        <Check className="w-5 h-5 text-green-600" aria-hidden="true" />
                      ) : (
                        <Copy className="w-5 h-5" aria-hidden="true" />
                      )}
                    </button>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground mb-1">Balance</p>
                    <p className="text-2xl font-bold text-foreground">
                      ${account.balance.toFixed(2)}
                    </p>
                    {account.is_demo_account && (
                      <p className="text-xs text-muted-foreground mt-2 font-medium">Simulated account</p>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-8">
                <Wallet className="w-12 h-12 mx-auto text-muted-foreground mb-3 opacity-50" />
                <p className="text-muted-foreground">No accounts found</p>
              </div>
            )}
          </div>
        </div>

        {/* Transactions */}
        <div>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-2xl font-bold text-foreground">Transactions</h3>
            <Link href="/transactions" className="text-sm text-primary hover:underline">
              View All
            </Link>
          </div>

          <div className="space-y-2">
            {transactions.length > 0 ? (
              transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between bg-card border border-border rounded-lg p-4 hover:border-primary/30 transition"
                >
                  <div className="flex items-center gap-4">
                    <div
                      className={`p-2 rounded-lg ${
                        tx.type === 'credit'
                          ? 'bg-green-100 dark:bg-green-950'
                          : 'bg-red-100 dark:bg-red-950'
                      }`}
                    >
                      {tx.type === 'credit' ? (
                        <ArrowDownLeft className={`w-5 h-5 text-green-600 dark:text-green-400`} />
                      ) : (
                        <ArrowUpRight className={`w-5 h-5 text-red-600 dark:text-red-400`} />
                      )}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{tx.description}</p>
                      <p className="text-sm text-muted-foreground">
                        {format(new Date(tx.date), 'MMM d, yyyy')}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-semibold ${
                      tx.type === 'credit' ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                    }`}
                  >
                    {tx.type === 'credit' ? '+' : '-'}${tx.amount.toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No transactions yet
              </div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}

export default function AccountsPage() {
  return (
    <ProtectedRoute>
      <Navigation />
      <AccountsContent />
    </ProtectedRoute>
  );
}

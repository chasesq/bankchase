'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Calendar, Download, FileText } from 'lucide-react'
import { Card } from '@/components/ui/card'
import { useAccounts } from '@/hooks/useAccounts'
import { useTransactions } from '@/hooks/useTransactions'

const csvEscape = (value: string | number) => `"${String(value).replaceAll('"', '""')}"`

export default function StatementsPage() {
  const router = useRouter()
  const { accounts, isLoading: accountsLoading } = useAccounts()
  const { transactions, isLoading: transactionsLoading } = useTransactions(undefined, 500)
  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'csv'>('csv')
  const [selectedAccountId, setSelectedAccountId] = useState('all')

  const selectedAccount = accounts.find((account) => String(account.id) === selectedAccountId)
  const accountTransactions = useMemo(
    () => selectedAccountId === 'all' ? transactions : transactions.filter((transaction) => transaction.accountId === selectedAccountId),
    [selectedAccountId, transactions],
  )

  const statements = useMemo(() => {
    const groups = new Map<string, { month: string; year: number; date: string; accountIds: string[] }>()
    for (const transaction of accountTransactions) {
      const date = new Date(transaction.date)
      if (Number.isNaN(date.getTime())) continue
      const key = `${date.getFullYear()}-${date.getMonth()}`
      const current = groups.get(key) ?? {
        month: date.toLocaleString('en-US', { month: 'long' }),
        year: date.getFullYear(),
        date: new Date(date.getFullYear(), date.getMonth() + 1, 10).toISOString(),
        accountIds: [],
      }
      if (transaction.accountId && !current.accountIds.includes(transaction.accountId)) current.accountIds.push(transaction.accountId)
      groups.set(key, current)
    }
    return [...groups.values()].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [accountTransactions])

  const downloadStatement = (statement: (typeof statements)[number]) => {
    if (selectedFormat === 'pdf') {
      window.print()
      return
    }
    const periodTransactions = accountTransactions.filter((transaction) => {
      const date = new Date(transaction.date)
      return date.getFullYear() === statement.year && date.toLocaleString('en-US', { month: 'long' }) === statement.month
    })
    const account = selectedAccount ?? accounts.find((item) => statement.accountIds.includes(String(item.id))) ?? accounts[0]
    const rows = [
      ['Date', 'Amount', 'Payee', 'Description', 'Reference', 'Check Number'],
      ...periodTransactions.map((transaction) => [
        new Date(transaction.date).toISOString().slice(0, 10),
        transaction.type === 'debit' ? `-${transaction.amount.toFixed(2)}` : transaction.amount.toFixed(2),
        transaction.recipientName ?? transaction.senderName ?? transaction.bankName ?? '',
        transaction.description,
        transaction.reference ?? transaction.id,
        '',
      ]),
    ]
    const csv = rows.map((row) => row.map(csvEscape).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `${account?.account_type ?? 'account'}-${statement.year}-${statement.month}.csv`.replaceAll(' ', '-').toLowerCase()
    link.click()
    URL.revokeObjectURL(url)
  }

  const loading = accountsLoading || transactionsLoading
  return (
    <main className="min-h-screen bg-gradient-to-br from-background to-card pb-8">
      <div className="max-w-6xl mx-auto p-6">
        <div className="flex items-center gap-4 mb-8">
          <button type="button" aria-label="Go back" onClick={() => router.back()} className="p-2 hover:bg-background rounded-lg transition"><ArrowLeft className="w-6 h-6" /></button>
          <div><h1 className="text-3xl font-bold">Account Statements</h1><p className="text-muted-foreground">Download transaction history tied to your account details.</p></div>
        </div>
        <Card className="p-6 mb-8 space-y-4">
          <div className="flex flex-wrap gap-4 items-end">
            <label className="grid gap-2 text-sm font-medium">Account
              <select value={selectedAccountId} onChange={(event) => setSelectedAccountId(event.target.value)} className="px-3 py-2 border border-border rounded-lg bg-background">
                <option value="all">All accounts</option>
                {accounts.map((account) => <option key={account.id} value={account.id}>{account.account_type} ••••{account.account_number.slice(-4)}</option>)}
              </select>
            </label>
            <label className="grid gap-2 text-sm font-medium">Format
              <select value={selectedFormat} onChange={(event) => setSelectedFormat(event.target.value as 'pdf' | 'csv')} className="px-3 py-2 border border-border rounded-lg bg-background"><option value="csv">CSV</option><option value="pdf">PDF / Print</option></select>
            </label>
          </div>
          {selectedAccount && <p className="text-sm text-muted-foreground">{selectedAccount.name} · Account ending in {selectedAccount.account_number.slice(-4)} · Routing {selectedAccount.routing_number}</p>}
        </Card>
        <div className="space-y-4">
          <h2 className="text-2xl font-bold mb-6">Statements</h2>
          {loading ? <p className="text-muted-foreground">Loading account transactions…</p> : statements.length === 0 ? <Card className="p-8 text-center text-muted-foreground">No transactions are available for a statement yet.</Card> : statements.map((statement) => <Card key={`${statement.year}-${statement.month}`} className="p-6 hover:shadow-lg transition"><div className="flex flex-wrap items-center justify-between gap-4"><div className="flex items-center gap-4"><div className="p-3 bg-card rounded-lg"><FileText className="w-6 h-6 text-primary" /></div><div><h3 className="font-semibold text-lg">{statement.month} {statement.year}</h3><p className="text-muted-foreground text-sm">{selectedAccount?.name ?? 'All linked accounts'}</p><div className="flex items-center gap-2 text-muted-foreground text-xs mt-1"><Calendar className="w-3 h-3" /> Available {new Date(statement.date).toLocaleDateString()}</div></div></div><button type="button" onClick={() => downloadStatement(statement)} className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-medium rounded-lg hover:opacity-90"><Download className="w-4 h-4" />Download {selectedFormat.toUpperCase()}</button></div></Card>)}
        </div>
        <Card className="mt-8 p-6"><h3 className="font-semibold mb-2">Statement format</h3><p className="text-sm text-muted-foreground">CSV downloads follow the supplied template: Date, Amount, Payee, Description, Reference, and Check Number. Amounts are positive for credits and negative for debits.</p></Card>
      </div>
    </main>
  )
}

'use client'

import { useState, useEffect, useMemo } from 'react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Search, Filter, Calendar, Tag } from 'lucide-react'

interface Transaction {
  id: string
  description: string
  amount: number
  date: string
  category: string
  type: 'debit' | 'credit'
}

interface TransactionSearchProps {
  transactions?: Transaction[]
  onFilterChange?: (filtered: Transaction[]) => void
}

export function TransactionSearch({ transactions = [], onFilterChange }: TransactionSearchProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState<string>('')
  const [dateRange, setDateRange] = useState({ start: '', end: '' })
  const [amountRange, setAmountRange] = useState({ min: '', max: '' })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const categories = useMemo(
    () => [...new Set(transactions.map((transaction) => transaction.category))].sort(),
    [transactions],
  )

  const filteredTransactions = useMemo(() => {
    const query = searchQuery.trim().toLowerCase()
    const startTime = dateRange.start ? new Date(`${dateRange.start}T00:00:00`).getTime() : null
    const endTime = dateRange.end ? new Date(`${dateRange.end}T23:59:59.999`).getTime() : null
    const minAmount = amountRange.min === '' ? null : Number(amountRange.min)
    const maxAmount = amountRange.max === '' ? null : Number(amountRange.max)

    return transactions.filter((transaction) => {
      const transactionTime = new Date(transaction.date).getTime()
      const matchesSearch = !query ||
        transaction.description.toLowerCase().includes(query) ||
        transaction.category.toLowerCase().includes(query)
      const matchesCategory = !selectedCategory || transaction.category === selectedCategory
      const matchesDateStart = startTime === null || transactionTime >= startTime
      const matchesDateEnd = endTime === null || transactionTime <= endTime
      const matchesAmountMin = minAmount === null || (Number.isFinite(minAmount) && transaction.amount >= minAmount)
      const matchesAmountMax = maxAmount === null || (Number.isFinite(maxAmount) && transaction.amount <= maxAmount)

      return matchesSearch && matchesCategory && matchesDateStart && matchesDateEnd && matchesAmountMin && matchesAmountMax
    })
  }, [transactions, searchQuery, selectedCategory, dateRange, amountRange])

  useEffect(() => {
    onFilterChange?.(filteredTransactions)
  }, [filteredTransactions, onFilterChange])

  const handleReset = () => {
    setSearchQuery('')
    setSelectedCategory('')
    setDateRange({ start: '', end: '' })
    setAmountRange({ min: '', max: '' })
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search transactions by name or category..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {/* Advanced Filters Toggle */}
      <Button
        variant="outline"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="w-full flex items-center gap-2"
      >
        <Filter className="w-4 h-4" />
        {showAdvanced ? 'Hide Advanced Filters' : 'Show Advanced Filters'}
      </Button>

      {/* Advanced Filters */}
      {showAdvanced && (
        <Card className="p-4 bg-muted space-y-4">
          {/* Category Filter */}
          <div>
            <label className="text-sm font-medium text-foreground block mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
            >
              <option value="">All Categories</option>
              {categories.map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>

          {/* Date Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> From
              </label>
              <input
                type="date"
                value={dateRange.start}
                onChange={(e) => setDateRange({ ...dateRange, start: e.target.value })}
                className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                <Calendar className="w-4 h-4" /> To
              </label>
              <input
                type="date"
                value={dateRange.end}
                onChange={(e) => setDateRange({ ...dateRange, end: e.target.value })}
                className="w-full px-3 py-2 border border-input bg-background text-foreground rounded-md text-sm"
              />
            </div>
          </div>

          {/* Amount Range */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Min Amount
              </label>
              <Input
                type="number"
                placeholder="0"
                value={amountRange.min}
                onChange={(e) => setAmountRange({ ...amountRange, min: e.target.value })}
                className="text-sm"
              />
            </div>
            <div>
              <label className="text-sm font-medium text-foreground block mb-2 flex items-center gap-2">
                <Tag className="w-4 h-4" /> Max Amount
              </label>
              <Input
                type="number"
                placeholder="0"
                value={amountRange.max}
                onChange={(e) => setAmountRange({ ...amountRange, max: e.target.value })}
                className="text-sm"
              />
            </div>
          </div>

          <Button
            variant="ghost"
            onClick={handleReset}
            className="w-full text-muted-foreground hover:text-foreground"
          >
            Reset Filters
          </Button>
        </Card>
      )}

      {/* Results */}
      <div className="mt-4">
        <h3 className="text-sm font-medium text-muted-foreground mb-3">
          Found {filteredTransactions.length} transaction{filteredTransactions.length !== 1 ? 's' : ''}
        </h3>
        
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {filteredTransactions.length > 0 ? (
            filteredTransactions.map(transaction => (
              <Card key={transaction.id} className="p-3 flex items-center justify-between bg-card hover:bg-muted transition-colors">
                <div>
                  <div className="font-medium text-foreground text-sm">{transaction.description}</div>
                  <div className="text-xs text-muted-foreground">{transaction.category} • {new Date(transaction.date).toLocaleDateString()}</div>
                </div>
                <div className={`font-medium text-sm ${transaction.type === 'debit' ? 'text-red-600' : 'text-green-600'}`}>
                  {transaction.type === 'debit' ? '-' : '+'}${Math.abs(transaction.amount).toFixed(2)}
                </div>
              </Card>
            ))
          ) : (
            <Card className="p-4 bg-muted text-center text-muted-foreground">
              No transactions match your filters
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}

'use client'

import { useEffect, useId, useRef, useState } from 'react'
import { Building2, ChevronDown, Check, CreditCard, Plus, Wallet, X } from 'lucide-react'

export type BankOption = {
  id: string
  name: string
  type: 'Internal' | 'External' | 'Action'
  code: string
  icon: 'building' | 'wallet' | 'card' | 'plus'
}

const BANK_OPTIONS: BankOption[] = [
  { id: 'checking', name: 'Chase Total Checking (...4892)', type: 'Internal', code: 'INTERNAL', icon: 'building' },
  { id: 'savings', name: 'Chase Savings (...1029)', type: 'Internal', code: 'INTERNAL', icon: 'wallet' },
  { id: 'boa', name: 'Bank of America (...8831)', type: 'External', code: 'ACH', icon: 'card' },
  { id: 'add', name: 'Add external bank account', type: 'Action', code: 'EXTERNAL', icon: 'plus' },
]

const icons = {
  building: Building2,
  wallet: Wallet,
  card: CreditCard,
  plus: Plus,
}

type BankPickerProps = {
  value?: string
  onChange: (bank: BankOption) => void
  onAddExternal?: () => void
}

export function BankPicker({ value = BANK_OPTIONS[0].id, onChange, onAddExternal }: BankPickerProps) {
  const [open, setOpen] = useState(false)
  const menuId = useId()
  const triggerRef = useRef<HTMLButtonElement>(null)
  const selectedBank = BANK_OPTIONS.find((bank) => bank.id === value) ?? BANK_OPTIONS[0]
  const SelectedIcon = icons[selectedBank.icon]

  useEffect(() => {
    if (!open) return
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
        triggerRef.current?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [open])

  const handleSelect = (bank: BankOption) => {
    setOpen(false)
    triggerRef.current?.focus()
    if (bank.type === 'Action') {
      onAddExternal?.()
      return
    }
    onChange(bank)
  }

  return (
    <div className="relative">
      <label htmlFor="destination-bank" className="mb-2 block text-sm font-medium text-foreground">
        Destination bank
      </label>
      <button
        ref={triggerRef}
        id="destination-bank"
        type="button"
        aria-haspopup="listbox"
        aria-controls={menuId}
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        onKeyDown={(event) => {
          if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
            event.preventDefault()
            setOpen(true)
          }
        }}
        className="flex w-full items-center justify-between rounded-lg border border-border bg-background px-4 py-3 text-left text-foreground transition hover:border-primary focus:outline-none focus:ring-2 focus:ring-primary"
      >
        <span className="flex min-w-0 items-center gap-3">
          <SelectedIcon className="size-5 shrink-0 text-primary" aria-hidden="true" />
          <span className="truncate">{selectedBank.name}</span>
        </span>
        <ChevronDown className={`size-4 shrink-0 text-muted-foreground transition-transform ${open ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>

      {open && (
        <>
          <button type="button" aria-label="Close destination bank menu" className="fixed inset-0 z-10 cursor-default" onClick={() => setOpen(false)} />
          <div id={menuId} className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-border bg-card p-1 shadow-lg" role="listbox" aria-label="Destination banks">
            <div className="flex items-center justify-between px-3 py-2">
              <p className="text-sm font-semibold text-foreground">Select destination bank</p>
              <button type="button" aria-label="Close" onClick={() => setOpen(false)} className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground">
                <X className="size-4" aria-hidden="true" />
              </button>
            </div>
            {BANK_OPTIONS.map((bank) => {
              const Icon = icons[bank.icon]
              const isSelected = bank.id === selectedBank.id
              return (
                <button
                  key={bank.id}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(bank)}
                  className={`flex w-full items-center justify-between rounded-lg px-3 py-3 text-left transition hover:bg-muted ${bank.type === 'Action' ? 'text-primary' : 'text-foreground'}`}
                >
                  <span className="flex items-center gap-3">
                    <Icon className="size-5 shrink-0" aria-hidden="true" />
                    <span>
                      <span className="block text-sm font-medium">{bank.name}</span>
                      {bank.type !== 'Action' && <span className="block text-xs text-muted-foreground">{bank.type} account</span>}
                    </span>
                  </span>
                  {isSelected && <Check className="size-4 text-primary" aria-hidden="true" />}
                </button>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

export { BANK_OPTIONS }

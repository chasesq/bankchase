'use client'

import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, Check, Loader2, Send, Smartphone, Banknote } from 'lucide-react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

interface TransferDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  transferType: 'zelle' | 'bank_transfer' | 'internal'
  userId: string
  userAccounts?: any[]
  onTransferComplete?: (transferId: string) => void
}

export function TransferDialog({
  open,
  onOpenChange,
  transferType,
  userId,
  userAccounts = [],
  onTransferComplete,
}: TransferDialogProps) {
  const [step, setStep] = useState(1) // 1: Enter details, 2: Confirm, 3: Success
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [transferId, setTransferId] = useState<string | null>(null)

  // Form state
  const [senderAccountId, setSenderAccountId] = useState(userAccounts[0]?.id || '')
  const [receiverAccountId, setReceiverAccountId] = useState('')
  const [recipientEmail, setRecipientEmail] = useState('')
  const [recipientName, setRecipientName] = useState('')
  const [amount, setAmount] = useState('')
  const [description, setDescription] = useState('')

  const handleTransfer = async () => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/transfers/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          senderId: userId,
          senderAccountId,
          receiverAccountId: transferType === 'internal' ? receiverAccountId : undefined,
          recipientEmail: transferType === 'zelle' ? recipientEmail : undefined,
          recipientName,
          amount: parseFloat(amount),
          description: description || `${transferType} transfer`,
          transferType,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        setError(data.error || 'Transfer failed')
        setLoading(false)
        return
      }

      setTransferId(data.transferId)
      setStep(3)
      onTransferComplete?.(data.transferId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Transfer failed')
      setLoading(false)
    }
  }

  const senderAccount = userAccounts.find(a => a.id === senderAccountId)
  const receiverAccount = userAccounts.find(a => a.id === receiverAccountId)
  const fee = transferType === 'zelle' ? 0 : 2.50
  const totalAmount = parseFloat(amount || '0') + fee

  const canProceed =
    amount &&
    recipientName &&
    (transferType === 'zelle' ? recipientEmail : receiverAccountId) &&
    senderAccount &&
    parseFloat(amount) > 0 &&
    parseFloat(senderAccount?.balance || '0') >= totalAmount

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {transferType === 'zelle' ? (
              <>
                <Smartphone className="h-5 w-5" />
                Send with Zelle®
              </>
            ) : (
              <>
                <Banknote className="h-5 w-5" />
                Transfer Funds
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            {step === 1 && 'Enter recipient details and amount'}
            {step === 2 && 'Review transfer details'}
            {step === 3 && 'Transfer completed successfully'}
          </DialogDescription>
        </DialogHeader>

        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {step === 1 && (
          <div className="space-y-4">
            {/* From Account */}
            <div className="space-y-2">
              <label className="text-sm font-medium">From Account</label>
              <Select value={senderAccountId} onValueChange={setSenderAccountId}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {userAccounts.map(account => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.accountName} - ${parseFloat(account.balance).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {senderAccount && (
                <p className="text-xs text-muted-foreground">
                  Available: ${parseFloat(senderAccount.balance).toFixed(2)}
                </p>
              )}
            </div>

            {/* To Account / Recipient */}
            {transferType === 'internal' ? (
              <div className="space-y-2">
                <label className="text-sm font-medium">To Account</label>
                <Select value={receiverAccountId} onValueChange={setReceiverAccountId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {userAccounts
                      .filter(a => a.id !== senderAccountId)
                      .map(account => (
                        <SelectItem key={account.id} value={account.id}>
                          {account.accountName}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
            ) : (
              <>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipient Email</label>
                  <Input
                    type="email"
                    placeholder="recipient@example.com"
                    value={recipientEmail}
                    onChange={e => setRecipientEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Recipient Name</label>
                  <Input
                    placeholder="Full name"
                    value={recipientName}
                    onChange={e => setRecipientName(e.target.value)}
                  />
                </div>
              </>
            )}

            {/* Amount */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Amount</label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  $
                </span>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="pl-7"
                  step="0.01"
                  min="0"
                />
              </div>
            </div>

            {/* Description */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Description (optional)</label>
              <Input
                placeholder="What's this for?"
                value={description}
                onChange={e => setDescription(e.target.value)}
              />
            </div>

            {/* Fee Summary */}
            {amount && (
              <Card className="bg-muted/50">
                <CardContent className="pt-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Amount</span>
                    <span>${parseFloat(amount).toFixed(2)}</span>
                  </div>
                  {fee > 0 && (
                    <div className="flex justify-between">
                      <span>Fee</span>
                      <span>${fee.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="border-t pt-2 flex justify-between font-semibold">
                    <span>Total</span>
                    <span>${totalAmount.toFixed(2)}</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => onOpenChange(false)}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={() => setStep(2)}
                disabled={!canProceed}
                className="flex-1"
              >
                Next
              </Button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-4">
            <Card className="bg-muted/30">
              <CardContent className="pt-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground">From</p>
                  <p className="font-semibold">{senderAccount?.accountName}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">To</p>
                  <p className="font-semibold">
                    {transferType === 'internal'
                      ? receiverAccount?.accountName
                      : recipientEmail || recipientName}
                  </p>
                </div>
                <div className="border-t pt-3">
                  <p className="text-xs text-muted-foreground mb-2">Summary</p>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Transfer Amount</span>
                      <span>${parseFloat(amount).toFixed(2)}</span>
                    </div>
                    {fee > 0 && (
                      <div className="flex justify-between">
                        <span>Fee</span>
                        <span>${fee.toFixed(2)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold">
                      <span>Total</span>
                      <span>${totalAmount.toFixed(2)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setStep(1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button
                onClick={handleTransfer}
                disabled={loading}
                className="flex-1"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4 mr-2" />
                    Confirm Transfer
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4 py-4">
            <div className="flex justify-center">
              <div className="h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-semibold">Transfer Sent Successfully!</h3>
              <p className="text-sm text-muted-foreground">
                ${parseFloat(amount).toFixed(2)} transferred to {recipientName}
              </p>
              {transferId && (
                <div className="bg-muted/50 p-3 rounded-lg mt-4">
                  <p className="text-xs text-muted-foreground mb-1">Reference ID</p>
                  <p className="font-mono text-xs break-all">{transferId}</p>
                </div>
              )}
            </div>

            <Button onClick={() => onOpenChange(false)} className="w-full">
              Done
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

import { useState, useCallback, useEffect } from 'react'
import useSWR from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export interface Transfer {
  id: string
  senderId: string
  senderAccountId: string
  receiverId?: string
  receiverAccountId: string
  recipientEmail?: string
  recipientName: string
  amount: string
  fee: string
  description: string
  transferType: 'zelle' | 'bank_transfer' | 'internal'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  createdAt: Date
  updatedAt: Date
}

export interface BankAccount {
  id: string
  userId: string
  accountName: string
  accountNumber: string
  routingNumber: string
  bankName: string
  accountType: string
  balance: string
  isDefault: boolean
  createdAt: Date
  updatedAt: Date
}

export interface Notification {
  id: string
  userId: string
  type: string
  title: string
  message: string
  relatedTransferId?: string
  isRead: boolean
  createdAt: Date
}

export function useTransfers(userId?: string) {
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  // Fetch transfers
  const { data: transfersData, mutate: mutateTransfers, isLoading: transfersLoading } = useSWR(
    userId ? `/api/transfers/mock?action=transfers&userId=${userId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Fetch accounts
  const { data: accountsData, mutate: mutateAccounts, isLoading: accountsLoading } = useSWR(
    userId ? `/api/transfers/mock?action=accounts&userId=${userId}` : null,
    fetcher,
    { revalidateOnFocus: false }
  )

  // Fetch notifications
  const { data: notificationsData, mutate: mutateNotifications } = useSWR(
    userId ? `/api/transfers/mock?action=notifications&userId=${userId}` : null,
    fetcher,
    { revalidateOnFocus: false, refreshInterval: 3000 }
  )

  // Create transfer
  const createTransfer = useCallback(async (transferData: {
    senderId: string
    senderAccountId: string
    receiverAccountId?: string
    recipientEmail?: string
    recipientName: string
    amount: number
    description?: string
    transferType: 'zelle' | 'bank_transfer' | 'internal'
  }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/transfers/mock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transferData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Transfer failed')
        return { success: false, error: result.error }
      }

      // Refresh data
      await mutateTransfers()
      await mutateAccounts()
      await mutateNotifications()

      return { success: true, transferId: result.transferId }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Transfer failed'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [mutateTransfers, mutateAccounts, mutateNotifications])

  // Add bank account
  const addBankAccount = useCallback(async (accountData: {
    userId: string
    accountName: string
    accountNumber: string
    routingNumber: string
    bankName: string
    accountType?: string
    balance?: string
  }) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/accounts/list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(accountData),
      })

      const result = await response.json()

      if (!response.ok) {
        setError(result.error || 'Failed to add account')
        return { success: false, error: result.error }
      }

      // Refresh accounts
      await mutateAccounts()

      return { success: true, account: result.account }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to add account'
      setError(message)
      return { success: false, error: message }
    } finally {
      setLoading(false)
    }
  }, [mutateAccounts])

  // Mark notification as read
  const markNotificationRead = useCallback(async (notificationId: string) => {
    try {
      await fetch('/api/notifications/list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, isRead: true }),
      })

      await mutateNotifications()
    } catch (err) {
      console.error('[v0] Failed to mark notification as read:', err)
    }
  }, [mutateNotifications])

  return {
    // Transfers
    transfers: transfersData?.transfers || [],
    transfersLoading: transfersLoading || transfersData === undefined,
    createTransfer,

    // Accounts
    accounts: accountsData?.accounts || [],
    accountsLoading: accountsLoading || accountsData === undefined,
    addBankAccount,

    // Notifications
    notifications: notificationsData?.notifications || [],
    unreadCount: notificationsData?.unread || 0,
    markNotificationRead,

    // State
    loading,
    error,
  }
}

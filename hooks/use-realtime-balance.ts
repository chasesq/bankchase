import { useEffect, useState, useCallback } from 'react'
import useSWR, { mutate } from 'swr'

const fetcher = (url: string) => fetch(url).then(r => r.json())

export interface RealTimeBalance {
  accountId: string
  balance: string
  lastUpdated: Date
}

export function useRealtimeBalance(userId?: string, accountId?: string) {
  const [isConnected, setIsConnected] = useState(false)
  const [realtimeBalance, setRealtimeBalance] = useState<RealTimeBalance | null>(null)

  // Fetch initial balance
  const { data: accountsData, mutate: mutateAccounts } = useSWR(
    userId ? `/api/accounts/list?userId=${userId}` : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true }
  )

  // Poll for balance updates every 3 seconds
  useEffect(() => {
    if (!accountId) return

    const interval = setInterval(async () => {
      try {
        const response = await fetch(`/api/accounts/list?userId=${userId}`)
        const data = await response.json()

        if (data.success && data.accounts) {
          const account = data.accounts.find((a: any) => a.id === accountId)
          if (account) {
            setRealtimeBalance({
              accountId: account.id,
              balance: account.balance,
              lastUpdated: new Date(),
            })
          }
        }
      } catch (error) {
        console.error('[v0] Failed to fetch balance update:', error)
      }
    }, 3000)

    return () => clearInterval(interval)
  }, [userId, accountId])

  // Mark as connected when data is available
  useEffect(() => {
    if (realtimeBalance) {
      setIsConnected(true)
    }
  }, [realtimeBalance])

  const refreshBalance = useCallback(async () => {
    if (userId) {
      await mutateAccounts()
    }
  }, [userId, mutateAccounts])

  return {
    balance: realtimeBalance?.balance || accountsData?.accounts?.find((a: any) => a.id === accountId)?.balance,
    lastUpdated: realtimeBalance?.lastUpdated,
    isConnected,
    refreshBalance,
  }
}

export function useRealtimeTransfers(userId?: string) {
  const [transfers, setTransfers] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(false)

  // Fetch initial transfers
  const { data: transfersData, mutate: mutateTransfers } = useSWR(
    userId ? `/api/transfers/list?userId=${userId}` : null,
    fetcher,
    { revalidateOnFocus: false, revalidateOnReconnect: true, refreshInterval: 5000 }
  )

  // Update transfers when data changes
  useEffect(() => {
    if (transfersData?.transfers) {
      setTransfers(transfersData.transfers)
      setIsConnected(true)
    }
  }, [transfersData])

  const refreshTransfers = useCallback(async () => {
    if (userId) {
      await mutateTransfers()
    }
  }, [userId, mutateTransfers])

  return {
    transfers,
    isConnected,
    refreshTransfers,
  }
}

export function useRealtimeNotifications(userId?: string) {
  const [notifications, setNotifications] = useState<any[]>([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isConnected, setIsConnected] = useState(false)

  // Fetch notifications with polling
  const { data: notificationsData, mutate: mutateNotifications } = useSWR(
    userId ? `/api/notifications/list?userId=${userId}` : null,
    fetcher,
    { 
      revalidateOnFocus: false,
      revalidateOnReconnect: true,
      refreshInterval: 3000  // Poll every 3 seconds for new notifications
    }
  )

  // Update notifications when data changes
  useEffect(() => {
    if (notificationsData?.notifications) {
      setNotifications(notificationsData.notifications)
      setUnreadCount(notificationsData.unread || 0)
      setIsConnected(true)
    }
  }, [notificationsData])

  const markAsRead = useCallback(async (notificationId: string) => {
    try {
      const response = await fetch('/api/notifications/list', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notificationId, isRead: true }),
      })

      if (response.ok) {
        await mutateNotifications()
      }
    } catch (error) {
      console.error('[v0] Failed to mark notification as read:', error)
    }
  }, [mutateNotifications])

  return {
    notifications,
    unreadCount,
    isConnected,
    markAsRead,
  }
}

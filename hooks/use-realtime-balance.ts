import { useCallback, useEffect, useState } from 'react'
import useSWR, { mutate as mutateCache } from 'swr'
import { subscribeToUserRealtime, type RealtimeConnectionStatus } from '@/lib/realtime'

const fetcher = async (url: string) => {
  const response = await fetch(url)
  if (!response.ok) throw new Error(`Request failed with status ${response.status}`)
  return response.json()
}

const getRefreshInterval = (status: RealtimeConnectionStatus) =>
  status === 'connected' ? 0 : 5000

export interface RealTimeBalance {
  accountId: string
  balance: string
  lastUpdated: Date
}

function useUserRealtime(
  userId: string | undefined,
  resources: Array<'accounts' | 'transactions' | 'notifications'>,
  onChange: () => void,
) {
  const [connectionStatus, setConnectionStatus] = useState<RealtimeConnectionStatus>('disconnected')

  useEffect(() => {
    if (!userId) {
      setConnectionStatus('disconnected')
      return
    }

    return subscribeToUserRealtime({
      userId,
      resources,
      onChange,
      onStatus: setConnectionStatus,
    })
  }, [userId, resources.join(','), onChange])

  return {
    connectionStatus,
    isConnected: connectionStatus === 'connected',
  }
}

export function useRealtimeBalance(userId?: string, accountId?: string) {
  const [lastUpdated, setLastUpdated] = useState<Date>()
  const endpoint = userId ? `/api/accounts/list?userId=${encodeURIComponent(userId)}` : null

  const refreshBalance = useCallback(async () => {
    if (!userId) return
    await mutateCache(endpoint)
    setLastUpdated(new Date())
  }, [endpoint, userId])

  const handleChange = useCallback(() => {
    void refreshBalance()
  }, [refreshBalance])

  const { connectionStatus, isConnected } = useUserRealtime(userId, ['accounts'], handleChange)
  const { data: accountsData } = useSWR(endpoint, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: getRefreshInterval(connectionStatus),
  })

  useEffect(() => {
    if (accountsData?.accounts) setLastUpdated(new Date())
  }, [accountsData])

  const account = accountsData?.accounts?.find((item: { id: string }) => item.id === accountId)

  return {
    balance: account?.balance,
    lastUpdated,
    isConnected,
    connectionStatus,
    refreshBalance,
  }
}

export function useRealtimeTransfers(userId?: string) {
  const endpoint = userId ? `/api/transfers/list?userId=${encodeURIComponent(userId)}` : null

  const refreshTransfers = useCallback(async () => {
    await mutateCache(endpoint)
  }, [endpoint])

  const handleChange = useCallback(() => {
    void refreshTransfers()
  }, [refreshTransfers])

  const { connectionStatus, isConnected } = useUserRealtime(userId, ['transactions'], handleChange)
  const { data: transfersData } = useSWR(endpoint, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: getRefreshInterval(connectionStatus),
  })

  return {
    transfers: transfersData?.transfers ?? [],
    isConnected,
    connectionStatus,
    refreshTransfers,
  }
}

export function useRealtimeNotifications(userId?: string) {
  const endpoint = userId ? `/api/notifications/list?userId=${encodeURIComponent(userId)}` : null

  const refreshNotifications = useCallback(async () => {
    await mutateCache(endpoint)
  }, [endpoint])

  const handleChange = useCallback(() => {
    void refreshNotifications()
  }, [refreshNotifications])

  const { connectionStatus, isConnected } = useUserRealtime(userId, ['notifications'], handleChange)
  const { data: notificationsData } = useSWR(endpoint, fetcher, {
    revalidateOnFocus: false,
    revalidateOnReconnect: true,
    refreshInterval: getRefreshInterval(connectionStatus),
  })

  const markAsRead = useCallback(async (notificationId: string) => {
    const response = await fetch('/api/notifications/list', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId, isRead: true }),
    })

    if (!response.ok) throw new Error('Unable to update notification')
    await mutateCache(endpoint)
  }, [endpoint])

  return {
    notifications: notificationsData?.notifications ?? [],
    unreadCount: notificationsData?.unread ?? 0,
    isConnected,
    connectionStatus,
    markAsRead,
  }
}

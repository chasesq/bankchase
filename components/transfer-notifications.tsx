'use client'

import { useEffect, useState } from 'react'
import { useRealtimeNotifications } from '@/hooks/use-realtime-balance'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { AlertCircle, CheckCircle, Send, DollarSign, X } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface TransferNotificationsProps {
  userId?: string
  maxDisplayed?: number
}

export function TransferNotifications({ 
  userId = "demo-user",
  maxDisplayed = 3
}: TransferNotificationsProps) {
  const { notifications, markAsRead } = useRealtimeNotifications(userId)
  const [displayedNotifications, setDisplayedNotifications] = useState<any[]>([])
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  useEffect(() => {
    const active = notifications.filter(n => !dismissed.has(n.id))
    setDisplayedNotifications(active.slice(0, maxDisplayed))
  }, [notifications, dismissed, maxDisplayed])

  if (displayedNotifications.length === 0) {
    return null
  }

  return (
    <div className="fixed bottom-24 right-4 space-y-2 z-40 max-w-sm">
      {displayedNotifications.map((notification) => (
        <Card 
          key={notification.id} 
          className={`dashboard-card-shadow border-l-4 ${
            notification.type.includes('received')
              ? 'border-l-green-500 bg-green-50 dark:bg-green-900/20'
              : notification.type.includes('sent')
              ? 'border-l-blue-500 bg-blue-50 dark:bg-blue-900/20'
              : 'border-l-yellow-500 bg-yellow-50 dark:bg-yellow-900/20'
          }`}
        >
          <CardContent className="p-3">
            <div className="flex items-start gap-3">
              <div className="flex-shrink-0 mt-0.5">
                {notification.type.includes('received') ? (
                  <CheckCircle className="h-5 w-5 text-green-600 dark:text-green-400" />
                ) : notification.type.includes('sent') ? (
                  <Send className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-yellow-600 dark:text-yellow-400" />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm">
                  {notification.title}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">
                  {notification.message}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="flex-shrink-0 h-6 w-6 p-0"
                onClick={() => {
                  setDismissed(prev => new Set([...prev, notification.id]))
                  markAsRead(notification.id)
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

export function TransferNotificationCenter({
  userId = "demo-user"
}: {
  userId?: string
}) {
  const { notifications, unreadCount, markAsRead } = useRealtimeNotifications(userId)

  return (
    <div className="space-y-3">
      {unreadCount > 0 && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold text-sm">Notifications</h3>
          <Badge variant="default">{unreadCount}</Badge>
        </div>
      )}

      <div className="space-y-2">
        {notifications.slice(0, 5).map((notification) => (
          <Card
            key={notification.id}
            className={`cursor-pointer transition-colors ${
              !notification.isRead ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-card'
            }`}
            onClick={() => markAsRead(notification.id)}
          >
            <CardContent className="p-3">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0 mt-0.5">
                  {notification.type.includes('received') ? (
                    <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  ) : notification.type.includes('sent') ? (
                    <Send className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-sm">{notification.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{notification.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(notification.createdAt).toLocaleTimeString()}
                  </p>
                </div>
                {!notification.isRead && (
                  <div className="h-2 w-2 rounded-full bg-blue-600 flex-shrink-0 mt-2" />
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}

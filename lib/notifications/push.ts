import { createClient } from '@/lib/supabase/server'

interface PushNotificationPayload {
  userId: string
  type: 'credit' | 'debit' | 'transfer' | 'deposit' | 'transfer_failed' | 'system'
  title: string
  message: string
  data?: {
    transactionId?: string
    amount?: number
    currency?: string
    reference?: string
    recipientName?: string
  }
  actionUrl?: string
}

/**
 * Store push notification in database
 * Client app can poll or use real-time subscriptions to display
 */
export async function sendPushNotification({
  userId,
  type,
  title,
  message,
  data,
  actionUrl
}: PushNotificationPayload) {
  try {
    const supabase = await createClient()

    const { data: notification, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        data: data || {},
        action_url: actionUrl,
        read: false,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (error) {
      console.error('[PUSH ✗] Failed to save notification:', error.message)
      return { success: false, error: error.message }
    }

    console.log(`[PUSH ✓] Notification saved for user ${userId}`, {
      notificationId: notification?.id,
      type
    })

    return { success: true, notificationId: notification?.id }
  } catch (error: any) {
    console.error('[PUSH ✗] Error sending push notification:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Send Credit Notification
 * Triggered when user receives money
 */
export async function sendCreditNotification({
  userId,
  amount,
  currency = 'NGN',
  senderName,
  reference,
  transactionId
}: {
  userId: string
  amount: number
  currency?: string
  senderName: string
  reference: string
  transactionId: string
}) {
  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency
  }).format(amount)

  return sendPushNotification({
    userId,
    type: 'credit',
    title: 'Money Received',
    message: `You received ${formattedAmount} from ${senderName}`,
    data: {
      transactionId,
      amount,
      currency,
      recipientName: senderName,
      reference
    },
    actionUrl: `/dashboard/transactions/${transactionId}`
  })
}

/**
 * Send Debit Notification
 * Triggered when user sends money
 */
export async function sendDebitNotification({
  userId,
  amount,
  currency = 'NGN',
  recipientName,
  reference,
  transactionId
}: {
  userId: string
  amount: number
  currency?: string
  recipientName: string
  reference: string
  transactionId: string
}) {
  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency
  }).format(amount)

  return sendPushNotification({
    userId,
    type: 'debit',
    title: 'Money Sent',
    message: `You sent ${formattedAmount} to ${recipientName}`,
    data: {
      transactionId,
      amount,
      currency,
      recipientName,
      reference
    },
    actionUrl: `/dashboard/transactions/${transactionId}`
  })
}

/**
 * Send Transfer Failed Notification
 * Triggered when transfer fails
 */
export async function sendTransferFailedNotification({
  userId,
  amount,
  currency = 'NGN',
  recipientName,
  reference,
  transactionId
}: {
  userId: string
  amount: number
  currency?: string
  recipientName: string
  reference: string
  transactionId: string
}) {
  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency
  }).format(amount)

  return sendPushNotification({
    userId,
    type: 'transfer_failed',
    title: 'Transfer Failed',
    message: `Transfer of ${formattedAmount} to ${recipientName} failed. Your account was not debited.`,
    data: {
      transactionId,
      amount,
      currency,
      recipientName,
      reference
    },
    actionUrl: `/support?transaction=${transactionId}`
  })
}

/**
 * Send Deposit Notification
 * Triggered when money is deposited to virtual account
 */
export async function sendDepositNotification({
  userId,
  amount,
  currency = 'NGN',
  senderName,
  reference,
  transactionId
}: {
  userId: string
  amount: number
  currency?: string
  senderName: string
  reference: string
  transactionId: string
}) {
  const formattedAmount = new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency
  }).format(amount)

  return sendPushNotification({
    userId,
    type: 'deposit',
    title: 'Deposit Received',
    message: `Deposit of ${formattedAmount} received from ${senderName}`,
    data: {
      transactionId,
      amount,
      currency,
      recipientName: senderName,
      reference
    },
    actionUrl: `/dashboard/transactions/${transactionId}`
  })
}

/**
 * Send System Notification
 * For general system messages
 */
export async function sendSystemNotification({
  userId,
  title,
  message,
  actionUrl
}: {
  userId: string
  title: string
  message: string
  actionUrl?: string
}) {
  return sendPushNotification({
    userId,
    type: 'system',
    title,
    message,
    actionUrl
  })
}

/**
 * Retrieve user notifications with pagination
 */
export async function getUserNotifications({
  userId,
  limit = 20,
  offset = 0,
  unreadOnly = false
}: {
  userId: string
  limit?: number
  offset?: number
  unreadOnly?: boolean
}) {
  try {
    const supabase = await createClient()

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (unreadOnly) {
      query = query.eq('read', false)
    }

    const { data, count, error } = await query.range(offset, offset + limit - 1)

    if (error) {
      console.error('[PUSH ✗] Failed to retrieve notifications:', error.message)
      return { success: false, error: error.message }
    }

    return {
      success: true,
      notifications: data,
      total: count,
      hasMore: (offset + limit) < (count || 0)
    }
  } catch (error: any) {
    console.error('[PUSH ✗] Error retrieving notifications:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Mark notification as read
 */
export async function markNotificationAsRead(notificationId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('id', notificationId)

    if (error) {
      console.error('[PUSH ✗] Failed to mark notification as read:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('[PUSH ✗] Error marking notification as read:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Mark all notifications as read for user
 */
export async function markAllNotificationsAsRead(userId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', userId)
      .eq('read', false)

    if (error) {
      console.error('[PUSH ✗] Failed to mark all notifications as read:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('[PUSH ✗] Error marking all notifications as read:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Delete notification
 */
export async function deleteNotification(notificationId: string) {
  try {
    const supabase = await createClient()

    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', notificationId)

    if (error) {
      console.error('[PUSH ✗] Failed to delete notification:', error.message)
      return { success: false, error: error.message }
    }

    return { success: true }
  } catch (error: any) {
    console.error('[PUSH ✗] Error deleting notification:', error.message)
    return { success: false, error: error.message }
  }
}

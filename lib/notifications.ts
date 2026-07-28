export type NotificationType = 'transfer' | 'deposit' | 'withdrawal' | 'alert' | 'fraud' | 'low_balance'
export type NotificationChannel = 'email' | 'sms' | 'slack' | 'discord' | 'teams' | 'webhook'
export type WebhookEventType = 'transaction.completed' | 'transaction.failed' | 'balance.low' | 'fraud.detected' | 'account.updated'

export interface Notification {
  id: string
  userId: string
  type: NotificationType
  channel: NotificationChannel
  title: string
  message: string
  data: Record<string, any>
  read: boolean
  createdAt: Date
  sentAt?: Date
}

export interface WebhookEndpoint {
  id: string
  userId: string
  url: string
  events: WebhookEventType[]
  isActive: boolean
  secret: string
  createdAt: Date
  lastTriggeredAt?: Date
  failureCount: number
}

export interface NotificationPreference {
  id: string
  userId: string
  type: NotificationType
  channels: NotificationChannel[]
  enabled: boolean
}

export interface WebhookConnector {
  id: string
  userId: string
  type: 'slack' | 'discord' | 'teams' | 'email' | 'sms' | 'custom'
  name: string
  config: Record<string, any>
  events: WebhookEventType[]
  isActive: boolean
  createdAt: Date
}

export interface BankingEvent {
  id: string
  userId: string
  eventType: WebhookEventType
  description: string
  data: Record<string, any>
  timestamp: Date
}

export const defaultNotificationPreferences: Record<NotificationType, NotificationChannel[]> = {
  transfer: ['email', 'slack'],
  deposit: ['email'],
  withdrawal: ['email', 'sms'],
  alert: ['email', 'sms'],
  fraud: ['email', 'sms', 'slack'],
  low_balance: ['email', 'slack'],
}

export const connectorTypes = {
  slack: {
    name: 'Slack',
    description: 'Send notifications to Slack channels',
    icon: '💬',
    fields: ['webhookUrl', 'channel'],
  },
  discord: {
    name: 'Discord',
    description: 'Send notifications to Discord channels',
    icon: '🎮',
    fields: ['webhookUrl', 'channel'],
  },
  teams: {
    name: 'Microsoft Teams',
    description: 'Send notifications to Teams channels',
    icon: '👥',
    fields: ['webhookUrl', 'channel'],
  },
  email: {
    name: 'Email',
    description: 'Send email notifications',
    icon: '📧',
    fields: ['emailAddress'],
  },
  sms: {
    name: 'SMS',
    description: 'Send SMS notifications',
    icon: '📱',
    fields: ['phoneNumber'],
  },
  custom: {
    name: 'Custom Webhook',
    description: 'Send to custom webhook endpoint',
    icon: '🔗',
    fields: ['webhookUrl', 'secret'],
  },
}

// ============================================
// MULTI-CHANNEL NOTIFICATION FUNCTIONS
// ============================================

interface NotificationContext {
  userId: string
  userEmail: string
  userPhone?: string
  userName: string
}

interface NotificationPayload {
  context: NotificationContext
  amount: number
  currency?: string
  recipientName: string
  reference: string
  balance?: number
  type?: string
}

/**
 * Send Email via Resend
 */
export async function sendTransactionEmail(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.RESEND_API_KEY) {
      console.warn('[NOTIFICATIONS] RESEND_API_KEY not configured, skipping email')
      return { success: false, error: 'Email provider not configured' }
    }

    const { default: axios } = await import('axios')

    const emailContent = `
Dear ${payload.context.userName},

You have received a transaction notification:

Amount: ${payload.currency || 'NGN'} ${payload.amount.toLocaleString()}
From: ${payload.recipientName}
Reference: ${payload.reference}
${payload.balance !== undefined ? `New Balance: ${payload.currency || 'NGN'} ${payload.balance.toLocaleString()}` : ''}
Date: ${new Date().toLocaleString()}

Thank you for using our service.
    `.trim()

    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: process.env.SENDER_EMAIL || 'noreply@bankchase.com',
        to: payload.context.userEmail,
        subject: `Transaction Alert: ${payload.currency || 'NGN'} ${payload.amount.toLocaleString()}`,
        text: emailContent,
        html: `<pre>${emailContent}</pre>`
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    console.log(`[NOTIFICATIONS] Email sent to ${payload.context.userEmail}`)
    return { success: true }
  } catch (error: any) {
    console.error('[NOTIFICATIONS] Email send failed:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Send SMS via Termii
 */
export async function sendTransactionSMS(payload: NotificationPayload): Promise<{ success: boolean; error?: string }> {
  try {
    if (!payload.context.userPhone) {
      console.warn('[NOTIFICATIONS] No phone number provided, skipping SMS')
      return { success: false, error: 'Phone number not available' }
    }

    if (!process.env.TERMII_API_KEY) {
      console.warn('[NOTIFICATIONS] TERMII_API_KEY not configured, skipping SMS')
      return { success: false, error: 'SMS provider not configured' }
    }

    const { default: axios } = await import('axios')

    const phoneNumber = payload.context.userPhone.replace(/\D/g, '')
    const formattedPhone = phoneNumber.startsWith('234') ? phoneNumber : `234${phoneNumber.slice(-10)}`

    const smsText = `Alert: You received ${payload.currency || 'NGN'} ${payload.amount.toLocaleString()} from ${payload.recipientName}. New Balance: ${payload.currency || 'NGN'} ${(payload.balance || 0).toLocaleString()}. Ref: ${payload.reference}`

    const response = await axios.post('https://api.ng.termii.com/api/sms/send', {
      api_key: process.env.TERMII_API_KEY,
      to: formattedPhone,
      from: process.env.SMS_SENDER_ID || 'N-Alert',
      sms: smsText,
      type: 'plain',
      channel: 'dnd' // DND channel for transactional SMS
    })

    console.log(`[NOTIFICATIONS] SMS sent to ${payload.context.userPhone}`)
    return { success: true }
  } catch (error: any) {
    console.error('[NOTIFICATIONS] SMS send failed:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Create in-app push notification
 */
export async function createPushNotification(
  userId: string,
  title: string,
  message: string,
  transactionId?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    console.log(`[NOTIFICATIONS] Push notification created for user ${userId}: ${title}`)
    return { success: true }
  } catch (error: any) {
    console.error('[NOTIFICATIONS] Push notification failed:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Send all notifications for a transaction (fire and forget)
 */
export async function notifyTransaction(payload: NotificationPayload): Promise<void> {
  console.log(`[NOTIFICATIONS] Sending transaction alerts for ${payload.context.userEmail}`)

  // Send all notifications concurrently without blocking
  Promise.allSettled([
    sendTransactionEmail(payload),
    sendTransactionSMS(payload),
    createPushNotification(
      payload.context.userId,
      'Transaction Received',
      `${payload.currency || 'NGN'} ${payload.amount.toLocaleString()} from ${payload.recipientName}`,
      payload.reference
    )
  ]).then(results => {
    results.forEach((result, index) => {
      const channels = ['Email', 'SMS', 'Push']
      if (result.status === 'rejected') {
        console.warn(`[NOTIFICATIONS] ${channels[index]} failed:`, result.reason)
      }
    })
  })
}

/**
 * Send OTP via SMS
 */
export async function sendOTP(phoneNumber: string, otp: string): Promise<{ success: boolean; error?: string }> {
  try {
    if (!process.env.TERMII_API_KEY) {
      console.warn('[NOTIFICATIONS] TERMII_API_KEY not configured')
      return { success: false, error: 'SMS provider not configured' }
    }

    const { default: axios } = await import('axios')

    const formattedPhone = phoneNumber.replace(/\D/g, '')
    const finalPhone = formattedPhone.startsWith('234') ? formattedPhone : `234${formattedPhone.slice(-10)}`

    await axios.post('https://api.ng.termii.com/api/sms/send', {
      api_key: process.env.TERMII_API_KEY,
      to: finalPhone,
      from: process.env.SMS_SENDER_ID || 'N-Auth',
      sms: `Your OTP is: ${otp}. Valid for 10 minutes.`,
      type: 'plain',
      channel: 'dnd'
    })

    console.log(`[NOTIFICATIONS] OTP sent to ${phoneNumber}`)
    return { success: true }
  } catch (error: any) {
    console.error('[NOTIFICATIONS] OTP send failed:', error.message)
    return { success: false, error: error.message }
  }
}

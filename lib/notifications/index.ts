/**
 * Notification System Orchestrator
 * 
 * Coordinates multi-channel notifications (Email, SMS, Push)
 * with non-blocking async execution
 */

import {
  sendCreditAlertEmail,
  sendDebitAlertEmail,
  sendTransferFailedEmail
} from './email'
import {
  sendCreditAlertSMS,
  sendDebitAlertSMS,
  sendTransferFailedSMS,
  sendOTPSMS
} from './sms'
import {
  sendCreditNotification,
  sendDebitNotification,
  sendTransferFailedNotification,
  sendDepositNotification,
  sendSystemNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
} from './push'

export interface NotificationContext {
  userId: string
  userEmail: string
  userPhone?: string
  userName: string
}

export interface TransactionNotificationPayload {
  context: NotificationContext
  transactionId: string
  amount: number
  currency?: string
  recipientName?: string
  reference: string
  balance?: number
  type: 'credit' | 'debit' | 'transfer_failed' | 'deposit'
}

/**
 * Send multi-channel notification on successful credit (received money)
 * Executes asynchronously without blocking the main transaction flow
 */
export async function notifyOnCredit({
  context,
  transactionId,
  amount,
  currency = 'NGN',
  recipientName = 'Bank Transfer',
  reference,
  balance
}: TransactionNotificationPayload) {
  console.log(`[NOTIFY] Credit event - User: ${context.userId}, Amount: ${amount}`)

  // Execute all notifications in parallel (non-blocking)
  const promises = [
    // Email notification
    sendCreditAlertEmail({
      recipientEmail: context.userEmail,
      recipientName: context.userName,
      amount,
      currency,
      senderName: recipientName,
      reference,
      timestamp: new Date(),
      balance,
      alertType: 'credit'
    }).catch(err => console.error('[NOTIFY] Email failed:', err)),

    // SMS notification (if phone available)
    ...(context.userPhone
      ? [
          sendCreditAlertSMS({
            recipientPhone: context.userPhone,
            amount,
            currency,
            senderName: recipientName,
            reference,
            newBalance: balance,
            alertType: 'credit'
          }).catch(err => console.error('[NOTIFY] SMS failed:', err))
        ]
      : []),

    // Push notification
    sendCreditNotification({
      userId: context.userId,
      amount,
      currency,
      senderName: recipientName,
      reference,
      transactionId
    }).catch(err => console.error('[NOTIFY] Push failed:', err))
  ]

  try {
    const results = await Promise.allSettled(promises)
    const successful = results.filter(r => r.status === 'fulfilled').length
    console.log(
      `[NOTIFY ✓] Credit notifications sent - ${successful}/${results.length} channels succeeded`
    )
    return { success: true, channelResults: results }
  } catch (error) {
    console.error('[NOTIFY ✗] Error in credit notification:', error)
    return { success: false, error }
  }
}

/**
 * Send multi-channel notification on debit (sent money)
 * Executes asynchronously without blocking the main transaction flow
 */
export async function notifyOnDebit({
  context,
  transactionId,
  amount,
  currency = 'NGN',
  recipientName = 'Recipient',
  reference,
  balance
}: TransactionNotificationPayload) {
  console.log(`[NOTIFY] Debit event - User: ${context.userId}, Amount: ${amount}`)

  const promises = [
    // Email notification
    sendDebitAlertEmail({
      recipientEmail: context.userEmail,
      recipientName: context.userName,
      amount,
      currency,
      senderName: recipientName,
      reference,
      timestamp: new Date(),
      balance,
      alertType: 'debit',
      description: `Transfer to ${recipientName}`
    }).catch(err => console.error('[NOTIFY] Email failed:', err)),

    // SMS notification (if phone available)
    ...(context.userPhone
      ? [
          sendDebitAlertSMS({
            recipientPhone: context.userPhone,
            amount,
            currency,
            senderName: recipientName,
            reference,
            newBalance: balance,
            alertType: 'debit'
          }).catch(err => console.error('[NOTIFY] SMS failed:', err))
        ]
      : []),

    // Push notification
    sendDebitNotification({
      userId: context.userId,
      amount,
      currency,
      recipientName,
      reference,
      transactionId
    }).catch(err => console.error('[NOTIFY] Push failed:', err))
  ]

  try {
    const results = await Promise.allSettled(promises)
    const successful = results.filter(r => r.status === 'fulfilled').length
    console.log(
      `[NOTIFY ✓] Debit notifications sent - ${successful}/${results.length} channels succeeded`
    )
    return { success: true, channelResults: results }
  } catch (error) {
    console.error('[NOTIFY ✗] Error in debit notification:', error)
    return { success: false, error }
  }
}

/**
 * Send multi-channel notification on transfer failure
 * Executes asynchronously without blocking the main transaction flow
 */
export async function notifyOnTransferFailed({
  context,
  transactionId,
  amount,
  currency = 'NGN',
  recipientName = 'Recipient',
  reference
}: TransactionNotificationPayload) {
  console.log(`[NOTIFY] Transfer failed - User: ${context.userId}, Amount: ${amount}`)

  const promises = [
    // Email notification
    sendTransferFailedEmail({
      recipientEmail: context.userEmail,
      recipientName: context.userName,
      amount,
      currency,
      reference,
      timestamp: new Date(),
      alertType: 'transfer'
    }).catch(err => console.error('[NOTIFY] Email failed:', err)),

    // SMS notification (if phone available)
    ...(context.userPhone
      ? [
          sendTransferFailedSMS({
            recipientPhone: context.userPhone,
            amount,
            currency,
            reference,
            alertType: 'transfer'
          }).catch(err => console.error('[NOTIFY] SMS failed:', err))
        ]
      : []),

    // Push notification
    sendTransferFailedNotification({
      userId: context.userId,
      amount,
      currency,
      recipientName,
      reference,
      transactionId
    }).catch(err => console.error('[NOTIFY] Push failed:', err))
  ]

  try {
    const results = await Promise.allSettled(promises)
    const successful = results.filter(r => r.status === 'fulfilled').length
    console.log(
      `[NOTIFY ✓] Transfer failed notifications sent - ${successful}/${results.length} channels succeeded`
    )
    return { success: true, channelResults: results }
  } catch (error) {
    console.error('[NOTIFY ✗] Error in transfer failed notification:', error)
    return { success: false, error }
  }
}

/**
 * Send multi-channel notification on deposit
 * Executes asynchronously without blocking the main transaction flow
 */
export async function notifyOnDeposit({
  context,
  transactionId,
  amount,
  currency = 'NGN',
  recipientName = 'Deposit',
  reference,
  balance
}: TransactionNotificationPayload) {
  console.log(`[NOTIFY] Deposit event - User: ${context.userId}, Amount: ${amount}`)

  const promises = [
    // Email notification
    sendCreditAlertEmail({
      recipientEmail: context.userEmail,
      recipientName: context.userName,
      amount,
      currency,
      senderName: recipientName,
      reference,
      timestamp: new Date(),
      balance,
      alertType: 'deposit'
    }).catch(err => console.error('[NOTIFY] Email failed:', err)),

    // SMS notification (if phone available)
    ...(context.userPhone
      ? [
          sendCreditAlertSMS({
            recipientPhone: context.userPhone,
            amount,
            currency,
            senderName: recipientName,
            reference,
            newBalance: balance,
            alertType: 'deposit'
          }).catch(err => console.error('[NOTIFY] SMS failed:', err))
        ]
      : []),

    // Push notification
    sendDepositNotification({
      userId: context.userId,
      amount,
      currency,
      senderName: recipientName,
      reference,
      transactionId
    }).catch(err => console.error('[NOTIFY] Push failed:', err))
  ]

  try {
    const results = await Promise.allSettled(promises)
    const successful = results.filter(r => r.status === 'fulfilled').length
    console.log(
      `[NOTIFY ✓] Deposit notifications sent - ${successful}/${results.length} channels succeeded`
    )
    return { success: true, channelResults: results }
  } catch (error) {
    console.error('[NOTIFY ✗] Error in deposit notification:', error)
    return { success: false, error }
  }
}

// Export individual utilities for direct use
export {
  // Email
  sendCreditAlertEmail,
  sendDebitAlertEmail,
  sendTransferFailedEmail,
  // SMS
  sendCreditAlertSMS,
  sendDebitAlertSMS,
  sendTransferFailedSMS,
  sendOTPSMS,
  // Push
  sendCreditNotification,
  sendDebitNotification,
  sendTransferFailedNotification,
  sendDepositNotification,
  sendSystemNotification,
  getUserNotifications,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  deleteNotification
}

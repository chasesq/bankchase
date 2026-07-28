import axios, { AxiosError } from 'axios'

const TERMII_API_KEY = process.env.TERMII_API_KEY
const SMS_SENDER_ID = process.env.SMS_SENDER_ID || 'BankChase'
const TERMII_BASE_URL = 'https://api.ng.termii.com/api'

interface SMSAlertPayload {
  recipientPhone: string
  amount: number
  currency?: string
  senderName?: string
  reference: string
  alertType: 'credit' | 'debit' | 'transfer' | 'deposit'
  newBalance?: number
  recipientName?: string
}

/**
 * Format Nigerian phone number to Termii format
 * Converts +234812345678 or 0812345678 to 2348012345678
 */
function formatPhoneNumber(phone: string): string {
  // Remove all non-digits
  const cleaned = phone.replace(/\D/g, '')

  // Handle different formats
  if (cleaned.startsWith('234')) {
    return cleaned // Already in correct format
  }
  if (cleaned.startsWith('0')) {
    return '234' + cleaned.substring(1) // Replace 0 with 234
  }
  if (cleaned.length === 10) {
    return '234' + cleaned // Add 234 prefix
  }

  return cleaned // Return as-is if unsure
}

/**
 * Send Credit Alert SMS
 * Triggered when user receives money
 */
export async function sendCreditAlertSMS({
  recipientPhone,
  amount,
  currency = 'NGN',
  senderName = 'BankChase',
  reference,
  newBalance,
  recipientName
}: SMSAlertPayload) {
  try {
    if (!TERMII_API_KEY) {
      console.warn('[SMS ⚠] TERMII_API_KEY not configured')
      return { success: false, error: 'TERMII_API_KEY not configured' }
    }

    const formattedPhone = formatPhoneNumber(recipientPhone)

    // Construct SMS message (160 chars = 1 SMS credit)
    let message = `Credit Alert! Amt: ${currency} ${amount.toLocaleString()} from ${senderName}. `
    if (newBalance) {
      message += `Bal: ${currency} ${newBalance.toLocaleString()}. `
    }
    message += `Ref: ${reference}`

    // Truncate to 160 chars if needed (1 SMS credit)
    if (message.length > 160) {
      message = message.substring(0, 157) + '...'
    }

    const response = await axios.post(
      `${TERMII_BASE_URL}/sms/send`,
      {
        to: formattedPhone,
        from: SMS_SENDER_ID,
        sms: message,
        type: 'plain',
        channel: 'dnd' // DND route ensures delivery for transactional alerts
      },
      {
        headers: {
          'Authorization': `Bearer ${TERMII_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    console.log(`[SMS ✓] Credit alert sent to ${recipientPhone}`, {
      reference,
      messageId: response.data?.message_id
    })

    return {
      success: response.data?.status === 'success' || response.status === 200,
      messageId: response.data?.message_id,
      smsCount: Math.ceil(message.length / 160)
    }
  } catch (error: any) {
    const axiosError = error as AxiosError
    console.error(`[SMS ✗] Failed to send credit alert to ${recipientPhone}:`, {
      status: axiosError.response?.status,
      message: axiosError.message
    })
    return { success: false, error: axiosError.message }
  }
}

/**
 * Send Debit Alert SMS
 * Triggered when user sends money
 */
export async function sendDebitAlertSMS({
  recipientPhone,
  amount,
  currency = 'NGN',
  senderName = 'Transfer',
  reference,
  newBalance,
  recipientName
}: SMSAlertPayload) {
  try {
    if (!TERMII_API_KEY) {
      console.warn('[SMS ⚠] TERMII_API_KEY not configured')
      return { success: false, error: 'TERMII_API_KEY not configured' }
    }

    const formattedPhone = formatPhoneNumber(recipientPhone)

    // Construct SMS message
    let message = `Debit Alert! ${currency} ${amount.toLocaleString()} sent to ${senderName}. `
    if (newBalance) {
      message += `Bal: ${currency} ${newBalance.toLocaleString()}. `
    }
    message += `Ref: ${reference}`

    // Truncate if needed
    if (message.length > 160) {
      message = message.substring(0, 157) + '...'
    }

    const response = await axios.post(
      `${TERMII_BASE_URL}/sms/send`,
      {
        to: formattedPhone,
        from: SMS_SENDER_ID,
        sms: message,
        type: 'plain',
        channel: 'dnd'
      },
      {
        headers: {
          'Authorization': `Bearer ${TERMII_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    console.log(`[SMS ✓] Debit alert sent to ${recipientPhone}`, {
      reference,
      messageId: response.data?.message_id
    })

    return {
      success: response.data?.status === 'success' || response.status === 200,
      messageId: response.data?.message_id,
      smsCount: Math.ceil(message.length / 160)
    }
  } catch (error: any) {
    const axiosError = error as AxiosError
    console.error(`[SMS ✗] Failed to send debit alert to ${recipientPhone}:`, {
      status: axiosError.response?.status,
      message: axiosError.message
    })
    return { success: false, error: axiosError.message }
  }
}

/**
 * Send Transfer Failed SMS
 * Triggered when transfer fails
 */
export async function sendTransferFailedSMS({
  recipientPhone,
  amount,
  currency = 'NGN',
  reference,
  recipientName
}: SMSAlertPayload) {
  try {
    if (!TERMII_API_KEY) {
      console.warn('[SMS ⚠] TERMII_API_KEY not configured')
      return { success: false, error: 'TERMII_API_KEY not configured' }
    }

    const formattedPhone = formatPhoneNumber(recipientPhone)

    const message = `Transfer Failed! ${currency} ${amount.toLocaleString()} transfer failed. Account not debited. Ref: ${reference}. Contact support.`

    const response = await axios.post(
      `${TERMII_BASE_URL}/sms/send`,
      {
        to: formattedPhone,
        from: SMS_SENDER_ID,
        sms: message.substring(0, 160),
        type: 'plain',
        channel: 'dnd'
      },
      {
        headers: {
          'Authorization': `Bearer ${TERMII_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    console.log(`[SMS ✓] Transfer failed alert sent to ${recipientPhone}`, {
      reference
    })

    return {
      success: response.data?.status === 'success' || response.status === 200,
      messageId: response.data?.message_id
    }
  } catch (error: any) {
    const axiosError = error as AxiosError
    console.error(`[SMS ✗] Failed to send transfer failed alert:`, {
      status: axiosError.response?.status,
      message: axiosError.message
    })
    return { success: false, error: axiosError.message }
  }
}

/**
 * Send OTP via SMS
 * Used for 2FA and verification
 */
export async function sendOTPSMS({
  recipientPhone,
  otp,
  expiryMinutes = 10
}: {
  recipientPhone: string
  otp: string
  expiryMinutes?: number
}) {
  try {
    if (!TERMII_API_KEY) {
      console.warn('[SMS ⚠] TERMII_API_KEY not configured')
      return { success: false, error: 'TERMII_API_KEY not configured' }
    }

    const formattedPhone = formatPhoneNumber(recipientPhone)
    const message = `Your BankChase verification code is ${otp}. It expires in ${expiryMinutes} minutes. Do not share this code.`

    const response = await axios.post(
      `${TERMII_BASE_URL}/sms/send`,
      {
        to: formattedPhone,
        from: SMS_SENDER_ID,
        sms: message,
        type: 'plain',
        channel: 'dnd'
      },
      {
        headers: {
          'Authorization': `Bearer ${TERMII_API_KEY}`,
          'Content-Type': 'application/json'
        },
        timeout: 10000
      }
    )

    console.log(`[SMS ✓] OTP sent to ${recipientPhone}`)

    return {
      success: response.data?.status === 'success' || response.status === 200,
      messageId: response.data?.message_id
    }
  } catch (error: any) {
    const axiosError = error as AxiosError
    console.error('[SMS ✗] Failed to send OTP:', axiosError.message)
    return { success: false, error: axiosError.message }
  }
}

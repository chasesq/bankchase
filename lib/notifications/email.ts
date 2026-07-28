import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)

interface EmailAlertPayload {
  recipientEmail: string
  recipientName: string
  amount: number
  currency?: string
  senderName?: string
  reference: string
  alertType: 'credit' | 'debit' | 'transfer' | 'deposit'
  timestamp?: Date
  description?: string
  balance?: number
}

/**
 * Send Credit Alert Email
 * Triggered when user receives money
 */
export async function sendCreditAlertEmail({
  recipientEmail,
  recipientName,
  amount,
  currency = 'NGN',
  senderName = 'BankChase Transfer',
  reference,
  timestamp = new Date(),
  balance
}: EmailAlertPayload) {
  try {
    const formattedAmount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount)

    const formattedBalance = balance
      ? new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: currency
        }).format(balance)
      : null

    const emailResult = await resend.emails.send({
      from: `BankChase Alerts <${process.env.SENDER_EMAIL || 'alerts@bankchase.app'}>`,
      to: [recipientEmail],
      subject: `Credit Alert: ${formattedAmount} received`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Money Received</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Credit Alert</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px 20px; background-color: white; margin: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
              Hi <strong>${recipientName}</strong>,
            </p>

            <p style="margin: 0 0 20px 0; color: #555; font-size: 14px; line-height: 1.6;">
              Your account has been credited. See details below:
            </p>

            <!-- Transaction Details -->
            <div style="background-color: #f5f7fa; padding: 20px; border-left: 4px solid #667eea; margin: 20px 0; border-radius: 4px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #e0e6ed;">
                  <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: 500;">Amount</td>
                  <td style="padding: 10px 0; color: #667eea; font-size: 16px; font-weight: bold; text-align: right;">${formattedAmount}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e0e6ed;">
                  <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: 500;">From</td>
                  <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right;">${senderName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #e0e6ed;">
                  <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: 500;">Reference</td>
                  <td style="padding: 10px 0; color: #333; font-size: 12px; font-family: 'Courier New', monospace; text-align: right;">${reference}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: 500;">Date & Time</td>
                  <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right;">${timestamp.toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</td>
                </tr>
                ${
                  formattedBalance
                    ? `
                <tr style="background-color: white;">
                  <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: 500;">New Balance</td>
                  <td style="padding: 10px 0; color: #22863a; font-size: 16px; font-weight: bold; text-align: right;">${formattedBalance}</td>
                </tr>
                `
                    : ''
                }
              </table>
            </div>

            <p style="margin: 20px 0; color: #555; font-size: 14px; line-height: 1.6;">
              If you didn't expect this transfer or have any questions, please contact our support team immediately.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL || 'https://bankchase.app'}/dashboard" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                View Transaction
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e0e6ed; font-size: 12px; color: #666;">
            <p style="margin: 0 0 10px 0;">
              This is an automated alert. Please do not reply to this email.
            </p>
            <p style="margin: 0;">
              © ${new Date().getFullYear()} BankChase. All rights reserved.
            </p>
            <p style="margin: 10px 0 0 0;">
              <a href="${process.env.APP_URL || 'https://bankchase.app'}/settings/notifications" style="color: #667eea; text-decoration: none;">Manage Notifications</a>
            </p>
          </div>
        </div>
      `
    })

    console.log(`[EMAIL ✓] Credit alert sent to ${recipientEmail}`, { reference })
    return { success: true, messageId: emailResult.id }
  } catch (error: any) {
    console.error(`[EMAIL ✗] Failed to send credit alert to ${recipientEmail}:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Send Debit Alert Email
 * Triggered when user sends money
 */
export async function sendDebitAlertEmail({
  recipientEmail,
  recipientName,
  amount,
  currency = 'NGN',
  senderName = 'Money Transfer',
  reference,
  timestamp = new Date(),
  balance,
  description
}: EmailAlertPayload) {
  try {
    const formattedAmount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount)

    const formattedBalance = balance
      ? new Intl.NumberFormat('en-NG', {
          style: 'currency',
          currency: currency
        }).format(balance)
      : null

    const emailResult = await resend.emails.send({
      from: `BankChase Alerts <${process.env.SENDER_EMAIL || 'alerts@bankchase.app'}>`,
      to: [recipientEmail],
      subject: `Transaction Confirmed: ${formattedAmount} sent`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Money Sent</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Transaction Confirmation</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px 20px; background-color: white; margin: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
              Hi <strong>${recipientName}</strong>,
            </p>

            <p style="margin: 0 0 20px 0; color: #555; font-size: 14px; line-height: 1.6;">
              Your money transfer has been successfully processed. Here are the details:
            </p>

            <!-- Transaction Details -->
            <div style="background-color: #fff3f4; padding: 20px; border-left: 4px solid #f5576c; margin: 20px 0; border-radius: 4px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #fce0e1;">
                  <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: 500;">Amount Sent</td>
                  <td style="padding: 10px 0; color: #f5576c; font-size: 16px; font-weight: bold; text-align: right;">${formattedAmount}</td>
                </tr>
                <tr style="border-bottom: 1px solid #fce0e1;">
                  <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: 500;">Recipient</td>
                  <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right;">${senderName}</td>
                </tr>
                <tr style="border-bottom: 1px solid #fce0e1;">
                  <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: 500;">Reference</td>
                  <td style="padding: 10px 0; color: #333; font-size: 12px; font-family: 'Courier New', monospace; text-align: right;">${reference}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: 500;">Date & Time</td>
                  <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right;">${timestamp.toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</td>
                </tr>
                ${
                  formattedBalance
                    ? `
                <tr style="background-color: white;">
                  <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: 500;">Remaining Balance</td>
                  <td style="padding: 10px 0; color: #22863a; font-size: 16px; font-weight: bold; text-align: right;">${formattedBalance}</td>
                </tr>
                `
                    : ''
                }
              </table>
            </div>

            ${
              description
                ? `
            <div style="background-color: #f5f7fa; padding: 15px; border-radius: 4px; margin: 15px 0;">
              <p style="margin: 0; color: #666; font-size: 13px;"><strong>Note:</strong> ${description}</p>
            </div>
            `
                : ''
            }

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL || 'https://bankchase.app'}/dashboard" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                View Details
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e0e6ed; font-size: 12px; color: #666;">
            <p style="margin: 0 0 10px 0;">
              This is an automated confirmation. Please do not reply to this email.
            </p>
            <p style="margin: 0;">
              © ${new Date().getFullYear()} BankChase. All rights reserved.
            </p>
          </div>
        </div>
      `
    })

    console.log(`[EMAIL ✓] Debit alert sent to ${recipientEmail}`, { reference })
    return { success: true, messageId: emailResult.id }
  } catch (error: any) {
    console.error(`[EMAIL ✗] Failed to send debit alert to ${recipientEmail}:`, error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Send Transfer Failed Email
 * Triggered when transfer fails
 */
export async function sendTransferFailedEmail({
  recipientEmail,
  recipientName,
  amount,
  currency = 'NGN',
  reference,
  timestamp = new Date()
}: EmailAlertPayload & { reason?: string }) {
  try {
    const formattedAmount = new Intl.NumberFormat('en-NG', {
      style: 'currency',
      currency: currency
    }).format(amount)

    const emailResult = await resend.emails.send({
      from: `BankChase Alerts <${process.env.SENDER_EMAIL || 'alerts@bankchase.app'}>`,
      to: [recipientEmail],
      subject: `Transfer Failed: ${formattedAmount} - Action Required`,
      html: `
        <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 0; background-color: #f9fafb;">
          <!-- Header -->
          <div style="background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); padding: 30px 20px; text-align: center; color: white;">
            <h1 style="margin: 0; font-size: 28px; font-weight: bold;">Transfer Failed</h1>
            <p style="margin: 10px 0 0 0; font-size: 14px; opacity: 0.9;">Action Required</p>
          </div>

          <!-- Content -->
          <div style="padding: 30px 20px; background-color: white; margin: 20px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
            <p style="margin: 0 0 20px 0; color: #333; font-size: 16px;">
              Hi <strong>${recipientName}</strong>,
            </p>

            <p style="margin: 0 0 20px 0; color: #c41c3b; font-size: 14px; line-height: 1.6; font-weight: 500;">
              Unfortunately, your transfer could not be completed.
            </p>

            <!-- Alert Box -->
            <div style="background-color: #fff5f5; padding: 20px; border-left: 4px solid #c41c3b; margin: 20px 0; border-radius: 4px;">
              <table style="width: 100%; border-collapse: collapse;">
                <tr style="border-bottom: 1px solid #fce0e1;">
                  <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: 500;">Amount</td>
                  <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right;">${formattedAmount}</td>
                </tr>
                <tr style="border-bottom: 1px solid #fce0e1;">
                  <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: 500;">Reference</td>
                  <td style="padding: 10px 0; color: #333; font-size: 12px; font-family: 'Courier New', monospace; text-align: right;">${reference}</td>
                </tr>
                <tr>
                  <td style="padding: 10px 0; color: #666; font-size: 14px; font-weight: 500;">Date & Time</td>
                  <td style="padding: 10px 0; color: #333; font-size: 14px; text-align: right;">${timestamp.toLocaleString('en-NG', { timeZone: 'Africa/Lagos' })}</td>
                </tr>
              </table>
            </div>

            <p style="margin: 15px 0; color: #555; font-size: 14px; line-height: 1.6;">
              Your account has not been debited. Please try again or contact our support team for assistance.
            </p>

            <!-- CTA Button -->
            <div style="text-align: center; margin: 30px 0;">
              <a href="${process.env.APP_URL || 'https://bankchase.app'}/support" style="display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #fa709a 0%, #fee140 100%); color: white; text-decoration: none; border-radius: 6px; font-weight: 600; font-size: 14px;">
                Contact Support
              </a>
            </div>
          </div>

          <!-- Footer -->
          <div style="background-color: #f9fafb; padding: 20px; text-align: center; border-top: 1px solid #e0e6ed; font-size: 12px; color: #666;">
            <p style="margin: 0;">
              © ${new Date().getFullYear()} BankChase. All rights reserved.
            </p>
          </div>
        </div>
      `
    })

    console.log(`[EMAIL ✓] Transfer failed alert sent to ${recipientEmail}`, { reference })
    return { success: true, messageId: emailResult.id }
  } catch (error: any) {
    console.error(`[EMAIL ✗] Failed to send transfer failed alert:`, error.message)
    return { success: false, error: error.message }
  }
}

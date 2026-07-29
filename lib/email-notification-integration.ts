/**
 * Email Notification Integration
 * Bridges the email management system with the notification system
 */

import { createClient } from '@/lib/supabase/server'
import axios from 'axios'

interface SendEmailOptions {
  userId: string
  templateId?: string
  recipientEmail: string
  recipientName?: string
  subject?: string
  htmlBody?: string
  textBody?: string
  variables?: Record<string, any>
  metadata?: Record<string, any>
}

interface EmailTemplate {
  id: string
  name: string
  subject: string
  html_body?: string
  text_body?: string
  variables?: string[]
}

interface SenderIdentity {
  id: string
  from_email: string
  from_name?: string
}

interface EmailSettings {
  default_domain_id?: string
  default_template_id?: string
  default_sender_id?: string
  enable_delivery_tracking: boolean
  enable_open_tracking: boolean
  enable_click_tracking: boolean
}

/**
 * Send an email using the email management system
 */
export async function sendEmailWithManagement(options: SendEmailOptions) {
  try {
    const supabase = await createClient()
    const {
      userId,
      templateId,
      recipientEmail,
      recipientName,
      subject,
      htmlBody,
      textBody,
      variables,
      metadata
    } = options

    // Fetch user settings
    const { data: settings } = await supabase
      .from('email_settings')
      .select('*')
      .eq('user_id', userId)
      .single()

    let template: EmailTemplate | null = null
    let finalFromEmail = 'noreply@bankchase.com'
    let finalFromName = 'BankChase'
    let finalSubject = subject || 'Notification'
    let finalHtmlBody = htmlBody || ''
    let finalTextBody = textBody || ''

    // Load template if specified
    if (templateId || settings?.default_template_id) {
      const templateToLoad = templateId || settings?.default_template_id
      const { data: tmpl } = await supabase
        .from('email_templates')
        .select('*')
        .eq('id', templateToLoad)
        .eq('user_id', userId)
        .single()

      if (tmpl) {
        template = tmpl
        finalSubject = tmpl.subject
        finalHtmlBody = tmpl.html_body || ''
        finalTextBody = tmpl.text_body || ''
      }
    }

    // Load sender identity if configured
    if (settings?.default_sender_id) {
      const { data: sender } = await supabase
        .from('sender_identities')
        .select('*')
        .eq('id', settings.default_sender_id)
        .eq('user_id', userId)
        .single()

      if (sender) {
        finalFromEmail = sender.from_email
        finalFromName = sender.from_name || 'BankChase'
      }
    }

    // Replace template variables
    const interpolateVariables = (text: string, vars: Record<string, any> = {}) => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return vars[key] ?? match
      })
    }

    if (variables) {
      finalSubject = interpolateVariables(finalSubject, variables)
      finalHtmlBody = interpolateVariables(finalHtmlBody, variables)
      finalTextBody = interpolateVariables(finalTextBody, variables)
    }

    // Send via Resend
    if (!process.env.RESEND_API_KEY) {
      console.warn('[EMAIL] Resend API key not configured')
      return { success: false, error: 'Email provider not configured' }
    }

    const response = await axios.post(
      'https://api.resend.com/emails',
      {
        from: `${finalFromName} <${finalFromEmail}>`,
        to: recipientEmail,
        subject: finalSubject,
        html: finalHtmlBody,
        text: finalTextBody,
        reply_to: finalFromEmail,
        headers: {
          'X-Entity-Ref-ID': metadata?.transactionId || ''
        }
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    )

    const messageId = response.data?.id

    // Log email
    const { data: log } = await supabase
      .from('email_logs')
      .insert({
        user_id: userId,
        template_id: templateId,
        recipient_email: recipientEmail,
        recipient_name: recipientName,
        subject: finalSubject,
        message_id: messageId,
        metadata: {
          ...metadata,
          from_email: finalFromEmail,
          from_name: finalFromName,
          has_html: !!finalHtmlBody
        },
        status: 'sent'
      })
      .select()
      .single()

    console.log(`[EMAIL] Email sent to ${recipientEmail}`, { messageId })

    return {
      success: true,
      messageId,
      logId: log?.id
    }
  } catch (error: any) {
    console.error('[EMAIL] Failed to send email:', error.response?.data || error.message)
    return {
      success: false,
      error: error.response?.data?.message || error.message
    }
  }
}

/**
 * Render email template with variables
 */
export async function renderEmailTemplate(
  userId: string,
  templateId: string,
  variables: Record<string, any>
) {
  try {
    const supabase = await createClient()

    const { data: template, error } = await supabase
      .from('email_templates')
      .select('*')
      .eq('id', templateId)
      .eq('user_id', userId)
      .single()

    if (error || !template) {
      throw new Error('Template not found')
    }

    const interpolateVariables = (text: string, vars: Record<string, any> = {}) => {
      return text.replace(/\{\{(\w+)\}\}/g, (match, key) => {
        return vars[key] ?? match
      })
    }

    return {
      subject: interpolateVariables(template.subject, variables),
      htmlBody: interpolateVariables(template.html_body || '', variables),
      textBody: interpolateVariables(template.text_body || '', variables)
    }
  } catch (error: any) {
    console.error('[EMAIL] Template render error:', error.message)
    throw error
  }
}

/**
 * Update email status based on webhook events
 */
export async function updateEmailStatus(
  messageId: string,
  status: 'delivered' | 'opened' | 'clicked' | 'bounced' | 'failed'
) {
  try {
    const supabase = await createClient()

    const updateData: Record<string, any> = {
      status,
      updated_at: new Date().toISOString()
    }

    if (status === 'opened') {
      updateData.opened_at = new Date().toISOString()
    } else if (status === 'clicked') {
      updateData.clicked_at = new Date().toISOString()
    } else if (status === 'bounced') {
      updateData.bounced_at = new Date().toISOString()
    }

    const { data } = await supabase
      .from('email_logs')
      .update(updateData)
      .eq('message_id', messageId)
      .select()
      .single()

    console.log(`[EMAIL] Status updated for ${messageId}: ${status}`)
    return { success: true, data }
  } catch (error: any) {
    console.error('[EMAIL] Status update error:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Get user's email statistics
 */
export async function getEmailStatistics(userId: string, days: number = 30) {
  try {
    const supabase = await createClient()
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)

    const { data: logs } = await supabase
      .from('email_logs')
      .select('status')
      .eq('user_id', userId)
      .gte('created_at', dateFrom.toISOString())

    if (!logs) {
      return { success: false, error: 'Failed to fetch statistics' }
    }

    const stats = {
      total: logs.length,
      sent: logs.filter(l => l.status === 'sent').length,
      delivered: logs.filter(l => l.status === 'delivered').length,
      opened: logs.filter(l => l.status === 'opened').length,
      clicked: logs.filter(l => l.status === 'clicked').length,
      bounced: logs.filter(l => l.status === 'bounced').length,
      openRate: 0,
      clickRate: 0
    }

    if (stats.delivered > 0) {
      stats.openRate = Math.round((stats.opened / stats.delivered) * 100)
      stats.clickRate = Math.round((stats.clicked / stats.delivered) * 100)
    }

    return { success: true, stats }
  } catch (error: any) {
    console.error('[EMAIL] Statistics error:', error.message)
    return { success: false, error: error.message }
  }
}

/**
 * Delete old email logs (retention policy)
 */
export async function cleanupOldEmailLogs(userId: string, retentionDays: number = 90) {
  try {
    const supabase = await createClient()
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - retentionDays)

    const { count, error } = await supabase
      .from('email_logs')
      .delete()
      .eq('user_id', userId)
      .lt('created_at', cutoffDate.toISOString())

    if (error) throw error

    console.log(`[EMAIL] Cleaned up ${count} old email logs for user ${userId}`)
    return { success: true, deleted: count }
  } catch (error: any) {
    console.error('[EMAIL] Cleanup error:', error.message)
    return { success: false, error: error.message }
  }
}

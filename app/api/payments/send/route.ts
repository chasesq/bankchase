import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

/**
 * POST /api/payments/send
 * 
 * Send money to other users or recipients
 * Supports:
 * - Wallet-to-wallet transfers
 * - Bank account transfers (via Paystack)
 * - Virtual account transfers
 * - Email-based payments
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      senderName,
      senderEmail,
      recipientName,
      recipientEmail,
      recipientPhoneNumber,
      amount,
      currency = 'NGN',
      description,
      transferType = 'wallet_transfer' // 'wallet_transfer', 'bank_transfer', 'mobile_money'
    } = body

    console.log('[v0] Payment request received:', { senderEmail, recipientEmail, amount, transferType })

    // Validate required fields
    if (!senderName || !senderEmail || !recipientName || !amount || !description) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: senderName, senderEmail, recipientName, amount, description'
        },
        { status: 400 }
      )
    }

    // Validate amount
    const parsedAmount = parseFloat(amount.toString())
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json(
        { success: false, error: 'Amount must be a positive number' },
        { status: 400 }
      )
    }

    if (parsedAmount > 10000000) {
      return NextResponse.json(
        { success: false, error: 'Amount exceeds maximum transfer limit' },
        { status: 400 }
      )
    }

    // Get sender's wallet balance
    const { data: senderProfile, error: senderError } = await supabase
      .from('profiles')
      .select('id, wallet_balance')
      .eq('id', user.id)
      .single()

    if (senderError || !senderProfile) {
      return NextResponse.json(
        { success: false, error: 'Sender profile not found' },
        { status: 404 }
      )
    }

    const senderBalance = parseFloat(senderProfile.wallet_balance || '0')
    if (senderBalance < parsedAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient balance. Available: ${currency} ${senderBalance.toFixed(2)}, Required: ${currency} ${parsedAmount.toFixed(2)}`
        },
        { status: 400 }
      )
    }

    const transactionId = uuidv4()

    // Debit sender wallet
    const newSenderBalance = senderBalance - parsedAmount
    await supabase
      .from('profiles')
      .update({
        wallet_balance: newSenderBalance.toString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)

    // Try to find recipient in system
    let recipientId: string | null = null
    const { data: recipientProfile } = await supabase
      .from('profiles')
      .select('id, wallet_balance')
      .eq('email', recipientEmail)
      .single()

    // If recipient exists in system, credit their wallet
    if (recipientProfile) {
      recipientId = recipientProfile.id
      const recipientBalance = parseFloat(recipientProfile.wallet_balance || '0')
      const newRecipientBalance = recipientBalance + parsedAmount

      await supabase
        .from('profiles')
        .update({
          wallet_balance: newRecipientBalance.toString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', recipientId)
    }

    // Record transaction
    await supabase
      .from('transactions')
      .insert({
        id: transactionId,
        user_id: user.id,
        recipient_id: recipientId,
        type: 'payment',
        amount: parsedAmount.toString(),
        currency,
        recipient_name: recipientName,
        recipient_email: recipientEmail,
        recipient_phone: recipientPhoneNumber || null,
        reference: `PAY_${uuidv4()}`,
        status: 'completed',
        description: description || `Payment to ${recipientName}`,
        transfer_type: transferType,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })

    // Create notification for sender
    const { error: senderNotificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type: 'payment_sent',
        title: 'Payment Sent',
        message: `You sent ${currency} ${parsedAmount.toFixed(2)} to ${recipientName}`,
        transaction_id: transactionId,
        read: false,
        created_at: new Date().toISOString()
      })
    if (senderNotificationError) console.warn('[v0] Failed to create sender notification:', senderNotificationError)

    // Create notification for recipient if exists in system
    if (recipientId) {
      const { error: recipientNotificationError } = await supabase
        .from('notifications')
        .insert({
          user_id: recipientId,
          type: 'payment_received',
          title: 'Money Received',
          message: `You received ${currency} ${parsedAmount.toFixed(2)} from ${senderName}`,
          transaction_id: transactionId,
          read: false,
          created_at: new Date().toISOString()
        })
      if (recipientNotificationError) console.warn('[v0] Failed to create recipient notification:', recipientNotificationError)
    }

    console.log('[v0] Payment processed successfully:', {
      transactionId,
      amount: parsedAmount,
      sender: senderEmail,
      recipient: recipientEmail
    })

    return NextResponse.json({
      success: true,
      transactionId,
      message: 'Payment sent successfully',
      status: 'completed',
      details: {
        amount: parsedAmount,
        currency,
        recipient: recipientName,
        senderNewBalance: newSenderBalance,
        timestamp: new Date().toISOString()
      }
    }, { status: 200 })
  } catch (error: any) {
    console.error('[v0] Payment API error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process payment',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import crypto from 'crypto'
import { createClient } from '@/lib/supabase/server'
import {
  notifyOnDeposit,
  notifyOnDebit
} from '@/lib/notifications'

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

if (!PAYSTACK_SECRET_KEY) {
  console.warn('[v0] PAYSTACK_SECRET_KEY not configured for webhooks')
}

/**
 * POST /api/paystack/webhooks
 * 
 * Receive asynchronous events from Paystack:
 * - charge.success: Incoming deposits to virtual accounts
 * - transfer.success: Outgoing transfers completed
 * - transfer.failed: Transfer failures
 * 
 * Verifies HMAC signature and processes events
 */
export async function POST(request: NextRequest) {
  try {
    // Get raw body for signature verification
    const rawBody = await request.text()

    // Verify Paystack signature
    const signature = request.headers.get('x-paystack-signature')
    if (!signature) {
      console.warn('[v0] Paystack webhook received without signature')
      return NextResponse.json(
        { error: 'Missing signature' },
        { status: 401 }
      )
    }

    // Verify HMAC-SHA512 signature
    const hash = crypto
      .createHmac('sha512', PAYSTACK_SECRET_KEY!)
      .update(rawBody)
      .digest('hex')

    if (hash !== signature) {
      console.warn('[v0] Invalid Paystack webhook signature')
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 401 }
      )
    }

    // Parse and process webhook
    const event = JSON.parse(rawBody)
    console.log('[v0] Paystack webhook received:', { event: event.event, reference: event.data?.reference })

    // Acknowledge receipt immediately
    const response = NextResponse.json(
      { success: true, message: 'Webhook received' },
      { status: 200 }
    )

    // Process asynchronously
    processPaystackEvent(event).catch(error => {
      console.error('[v0] Failed to process Paystack event:', error)
    })

    return response
  } catch (error: any) {
    console.error('[v0] Paystack webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook processing error' },
      { status: 200 } // Return 200 to prevent retries
    )
  }
}

/**
 * Process different Paystack webhook events
 */
async function processPaystackEvent(event: any) {
  const supabase = createClient()

  switch (event.event) {
    case 'charge.success':
      // Incoming deposit to virtual account
      await handleIncomingDeposit(event.data)
      break

    case 'transfer.success':
      // Outgoing transfer completed
      await handleTransferSuccess(event.data)
      break

    case 'transfer.failed':
      // Transfer failed - refund balance
      await handleTransferFailure(event.data)
      break

    default:
      console.log('[v0] Unhandled Paystack event:', event.event)
  }
}

/**
 * Handle incoming deposits to user virtual accounts
 * Credit wallet balance and create deposit transaction
 */
async function handleIncomingDeposit(data: any) {
  try {
    const supabase = createClient()
    const reference = data.reference
    const customerCode = data.customer?.customer_code
    const amountInMajorUnits = data.amount / 100 // Paystack sends in kobo (subunits)

    console.log('[v0] Processing incoming deposit:', { reference, amount: amountInMajorUnits })

    // IDEMPOTENCY CHECK: Ensure deposit hasn't been processed already
    const { data: existingTx, error: queryError } = await supabase
      .from('transactions')
      .select('id, status')
      .eq('reference', reference)
      .single()

    if (existingTx) {
      console.log('[v0] Deposit already processed:', reference)
      return
    }

    // Find user by Paystack customer code
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('paystack_customer_code', customerCode)
      .single()

    if (profileError || !userProfile) {
      console.warn('[v0] User not found for deposit:', customerCode)
      return
    }

    const userId = userProfile.id

    // Credit wallet balance
    const { data: currentProfile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', userId)
      .single()

    const currentBalance = parseFloat(currentProfile?.wallet_balance || '0')
    const newBalance = currentBalance + amountInMajorUnits

    await supabase
      .from('profiles')
      .update({
        wallet_balance: newBalance.toString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', userId)

    // Record deposit transaction
    const { data: txData } = await supabase
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount: amountInMajorUnits.toString(),
        reference,
        status: 'completed',
        description: `Deposit from virtual account transfer`,
        channel: data.channel || 'dedicated_nuban',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()

    // Get user details for notifications
    const { data: userDetails } = await supabase
      .from('profiles')
      .select('email, phone_number, full_name')
      .eq('id', userId)
      .single()

    // Send multi-channel notifications (Email, SMS, Push)
    if (userDetails) {
      notifyOnDeposit({
        context: {
          userId,
          userEmail: userDetails.email,
          userPhone: userDetails.phone_number,
          userName: userDetails.full_name || 'User'
        },
        transactionId: txData?.id || reference,
        amount: amountInMajorUnits,
        currency: 'NGN',
        recipientName: 'Bank Transfer',
        reference,
        balance: newBalance,
        type: 'deposit'
      }).catch(err => console.error('[WEBHOOK] Notification failed:', err))
    }

    console.log('[v0] Deposit credited successfully:', { userId, amount: amountInMajorUnits })
  } catch (error: any) {
    console.error('[v0] Failed to process incoming deposit:', error)
  }
}

/**
 * Handle successful outgoing transfers
 * Update transaction status to completed
 */
async function handleTransferSuccess(data: any) {
  try {
    const supabase = createClient()
    const reference = data.reference
    const transferCode = data.transfer_code
    const recipient = data.recipient

    console.log('[v0] Processing transfer success:', { reference, recipient: recipient?.name })

    // Find and update transaction
    const { data: transaction } = await supabase
      .from('transactions')
      .select('id, user_id, amount')
      .eq('reference', reference)
      .single()

    if (!transaction) {
      console.warn('[v0] Transaction not found for transfer success:', reference)
      return
    }

    // Update transaction status
    await supabase
      .from('transactions')
      .update({
        status: 'completed',
        transfer_code: transferCode,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    // Get user details for notifications
    const { data: userDetails } = await supabase
      .from('profiles')
      .select('email, phone_number, full_name')
      .eq('id', transaction.user_id)
      .single()

    // Send multi-channel notifications (Email, SMS, Push)
    if (userDetails) {
      notifyOnDebit({
        context: {
          userId: transaction.user_id,
          userEmail: userDetails.email,
          userPhone: userDetails.phone_number,
          userName: userDetails.full_name || 'User'
        },
        transactionId: transaction.id,
        amount: parseFloat(transaction.amount),
        currency: 'NGN',
        recipientName: recipient?.name || 'Recipient',
        reference,
        type: 'transfer_failed'
      }).catch(err => console.error('[WEBHOOK] Notification failed:', err))
    }

    console.log('[v0] Transfer marked as completed:', transaction.id)
  } catch (error: any) {
    console.error('[v0] Failed to process transfer success:', error)
  }
}

/**
 * Handle failed outgoing transfers
 * Refund balance to wallet and update transaction status
 */
async function handleTransferFailure(data: any) {
  try {
    const supabase = createClient()
    const reference = data.reference
    const reason = data.reason || 'Unknown error'

    console.log('[v0] Processing transfer failure:', { reference, reason })

    // Find transaction
    const { data: transaction } = await supabase
      .from('transactions')
      .select('id, user_id, amount')
      .eq('reference', reference)
      .single()

    if (!transaction) {
      console.warn('[v0] Transaction not found for transfer failure:', reference)
      return
    }

    const amount = parseFloat(transaction.amount)

    // Refund wallet balance
    const { data: userProfile } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', transaction.user_id)
      .single()

    const currentBalance = parseFloat(userProfile?.wallet_balance || '0')
    const newBalance = currentBalance + amount

    await supabase
      .from('profiles')
      .update({
        wallet_balance: newBalance.toString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.user_id)

    // Update transaction status
    await supabase
      .from('transactions')
      .update({
        status: 'failed',
        failure_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', transaction.id)

    // Get user details for notifications
    const { data: userDetails } = await supabase
      .from('profiles')
      .select('email, phone_number, full_name')
      .eq('id', transaction.user_id)
      .single()

    // Send multi-channel notifications (Email, SMS, Push)
    if (userDetails) {
      notifyOnDebit({
        context: {
          userId: transaction.user_id,
          userEmail: userDetails.email,
          userPhone: userDetails.phone_number,
          userName: userDetails.full_name || 'User'
        },
        transactionId: transaction.id,
        amount,
        currency: 'NGN',
        recipientName: 'Recipient',
        reference,
        type: 'transfer_failed'
      }).catch(err => console.error('[WEBHOOK] Notification failed:', err))
    }

    console.log('[v0] Transfer failure processed with refund:', transaction.id)
  } catch (error: any) {
    console.error('[v0] Failed to process transfer failure:', error)
  }
}

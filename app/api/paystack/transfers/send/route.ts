import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { createClient } from '@/lib/supabase/server'
import { v4 as uuidv4 } from 'uuid'

const PAYSTACK_API_BASE = 'https://api.paystack.co'
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

const paystackClient = axios.create({
  baseURL: PAYSTACK_API_BASE,
  headers: {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
})

interface TransferRequest {
  accountNumber: string
  bankCode: string
  recipientName: string
  amount: number
  narration?: string
}

/**
 * POST /api/paystack/transfers/send
 * 
 * Send money to external bank accounts via Paystack
 * 
 * Flow:
 * 1. Validate recipient bank details
 * 2. Create transfer recipient
 * 3. Initiate transfer from balance
 * 4. Record transaction in database
 * 5. Return transaction reference
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: TransferRequest = await request.json()
    const { accountNumber, bankCode, recipientName, amount, narration } = body

    // Validate required fields
    if (!accountNumber || !bankCode || !recipientName || !amount) {
      console.error('[v0] Missing required transfer fields:', { accountNumber, bankCode, recipientName, amount })
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: accountNumber, bankCode, recipientName, amount'
        },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount <= 0 || amount > 10000000) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid amount. Must be between 0 and 10,000,000'
        },
        { status: 400 }
      )
    }

    console.log('[v0] Transfer request received:', { userId: user.id, amount, recipientName })

    // STEP 1: Resolve and verify recipient bank account
    try {
      console.log('[v0] Resolving recipient bank account:', { accountNumber, bankCode })
      const resolveRes = await paystackClient.get('/bank/resolve', {
        params: {
          account_number: accountNumber,
          bank_code: bankCode
        }
      })

      if (!resolveRes.data.status) {
        throw new Error(resolveRes.data.message || 'Failed to resolve account')
      }

      const resolvedAccount = resolveRes.data.data
      console.log('[v0] Account resolved:', resolvedAccount.account_name)
    } catch (error: any) {
      console.error('[v0] Bank account resolution failed:', error.response?.data || error.message)
      return NextResponse.json(
        {
          success: false,
          error: error.response?.data?.message || 'Invalid bank account details'
        },
        { status: 400 }
      )
    }

    // STEP 2: Create transfer recipient
    let recipientCode: string
    try {
      console.log('[v0] Creating transfer recipient:', { accountNumber, bankCode })
      const recipientRes = await paystackClient.post('/transferrecipient', {
        type: 'nuban',
        name: recipientName,
        account_number: accountNumber,
        bank_code: bankCode,
        currency: 'NGN'
      })

      if (!recipientRes.data.status) {
        throw new Error(recipientRes.data.message || 'Failed to create recipient')
      }

      recipientCode = recipientRes.data.data.recipient_code
      console.log('[v0] Transfer recipient created:', recipientCode)
    } catch (error: any) {
      console.error('[v0] Transfer recipient creation failed:', error.response?.data || error.message)
      return NextResponse.json(
        {
          success: false,
          error: error.response?.data?.message || 'Failed to create transfer recipient'
        },
        { status: 400 }
      )
    }

    // STEP 3: Check user balance (from Supabase wallet)
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('wallet_balance')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { success: false, error: 'User profile not found' },
        { status: 404 }
      )
    }

    const walletBalance = parseFloat(userProfile.wallet_balance || '0')
    if (walletBalance < amount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient balance. Available: ${walletBalance.toFixed(2)}, Required: ${amount.toFixed(2)}`
        },
        { status: 400 }
      )
    }

    // STEP 4: Initiate transfer from balance
    let transferReference: string
    const amountInSubunits = Math.round(amount * 100) // Paystack uses subunits (kobo)

    try {
      console.log('[v0] Initiating transfer:', { recipientCode, amount: amountInSubunits })
      const transferRes = await paystackClient.post('/transfer', {
        source: 'balance',
        recipient: recipientCode,
        amount: amountInSubunits,
        reason: narration || `Transfer to ${recipientName}`,
        reference: `TXN_${uuidv4()}`
      })

      if (!transferRes.data.status) {
        throw new Error(transferRes.data.message || 'Transfer initiation failed')
      }

      const transferData = transferRes.data.data
      transferReference = transferData.reference
      console.log('[v0] Transfer initiated successfully:', transferReference)
    } catch (error: any) {
      console.error('[v0] Transfer initiation failed:', error.response?.data || error.message)
      return NextResponse.json(
        {
          success: false,
          error: error.response?.data?.message || 'Failed to initiate transfer'
        },
        { status: 400 }
      )
    }

    // STEP 5: Record transaction in database
    const transactionId = uuidv4()
    try {
      const { error: insertError } = await supabase
        .from('transactions')
        .insert({
          id: transactionId,
          user_id: user.id,
          type: 'bank_transfer',
          amount: amount.toString(),
          recipient_name: recipientName,
          recipient_account: accountNumber,
          recipient_bank_code: bankCode,
          reference: transferReference,
          status: 'processing',
          description: narration || `Transfer to ${recipientName}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (insertError) {
        console.error('[v0] Failed to record transaction:', insertError)
        // Continue anyway as transfer was already initiated
      }

      // Debit wallet balance
      await supabase
        .from('profiles')
        .update({
          wallet_balance: (walletBalance - amount).toString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          user_id: user.id,
          type: 'transfer_sent',
          title: 'Transfer Sent',
          message: `Transfer of ${amount} to ${recipientName} is being processed`,
          transaction_id: transactionId,
          read: false,
          created_at: new Date().toISOString()
        })

      console.log('[v0] Transaction recorded:', transactionId)
    } catch (error: any) {
      console.error('[v0] Failed to record transaction:', error)
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Transfer initiated successfully. It will be processed within 24 hours.',
        transactionId,
        reference: transferReference,
        status: 'processing',
        details: {
          amount,
          recipientName,
          recipientAccount: accountNumber,
          narration: narration || `Transfer to ${recipientName}`
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Transfer send error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error while processing transfer',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

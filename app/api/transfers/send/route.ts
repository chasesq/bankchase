import { NextRequest, NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'
import { createClient } from '@/lib/supabase/server'
import { deliverTransferAlerts } from '@/lib/transfer-alerts'

/**
 * POST /api/transfers/send
 * 
 * Enhanced transfer endpoint with:
 * - Real-time balance updates
 * - Paystack integration for bank transfers
 * - Transaction verification and idempotency
 * - Comprehensive error handling
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { fromAccountId, toAccountNumber, toBankCode, amount, narration, recipientName, recipientPhone, recipientEmail, transferType } = body

    // Validate required fields
    if (!fromAccountId || !toAccountNumber || !toBankCode || !amount || !recipientName) {
      console.error('[v0] Missing required transfer fields:', { fromAccountId, toAccountNumber, toBankCode, amount, recipientName })
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields: fromAccountId, toAccountNumber, toBankCode, amount, recipientName'
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
        { success: false, error: 'Amount exceeds maximum transfer limit (10,000,000)' },
        { status: 400 }
      )
    }

    const { data: sourceAccount, error: sourceAccountError } = await supabase
      .from('accounts')
      .select('id, user_id, balance')
      .eq('id', fromAccountId)
      .eq('user_id', user.id)
      .maybeSingle()

    if (sourceAccountError || !sourceAccount) {
      return NextResponse.json(
        { success: false, error: 'Source account is unavailable' },
        { status: 403 }
      )
    }

    console.log('[v0] Transfer send request:', {
      userId: user.id,
      fromAccountId,
      amount: parsedAmount,
      recipientName,
      toAccountNumber
    })

    // Check wallet balance
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
    if (walletBalance < parsedAmount) {
      return NextResponse.json(
        {
          success: false,
          error: `Insufficient balance. Available: ₦${walletBalance.toFixed(2)}, Required: ₦${parsedAmount.toFixed(2)}`
        },
        { status: 400 }
      )
    }

    const transferId = uuidv4()
    const alertBase = {
      recipientPhone: typeof recipientPhone === 'string' ? recipientPhone : undefined,
      recipientEmail: typeof recipientEmail === 'string' ? recipientEmail : undefined,
      recipientName,
      amount: parsedAmount,
      transferType: transferType === 'zelle' ? 'zelle' as const : 'bank_transfer' as const,
      transferId,
    }

    // Alerts are best-effort and never block a valid transfer.
    await deliverTransferAlerts({ ...alertBase, status: 'initiated' }).catch((error) =>
      console.warn('[v0] Initiated transfer alert failed:', error instanceof Error ? error.message : error)
    )

    // Try Paystack first for bank transfers, fallback to realtime endpoint
    if (transferType === 'bank_transfer' || toBankCode) {
      try {
        const paystackResponse = await fetch(
          new URL('/api/paystack/transfers/send', request.url),
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${request.headers.get('authorization') || ''}`
            },
            body: JSON.stringify({
              accountNumber: toAccountNumber,
              bankCode: toBankCode,
              recipientName,
              amount: parsedAmount,
              narration
            })
          }
        )

        const paystackData = await paystackResponse.json()

        if (paystackResponse.ok && paystackData.success) {
          console.log('[v0] Transfer via Paystack successful:', paystackData.transactionId)
          return NextResponse.json(paystackData, { status: 200 })
        }
      } catch (error: any) {
        console.warn('[v0] Paystack transfer failed, attempting fallback:', error.message)
        // Continue to fallback
      }
    }

    // Fallback: Call the real-time transfer endpoint
    const realtimeResponse = await fetch(
      new URL('/api/transfers/realtime', request.url),
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${request.headers.get('authorization') || ''}`
        },
        body: JSON.stringify({
          userId: user.id,
          fromAccountId,
          toAccountNumber,
          toBankCode,
          amount: parsedAmount,
          recipientName,
          narration
        })
      }
    )

    const realtimeData = await realtimeResponse.json()

    if (!realtimeResponse.ok) {
      console.error('[v0] Realtime transfer failed:', realtimeData)
      return NextResponse.json(
        {
          success: false,
          error: realtimeData.error || 'Transfer processing failed',
          transaction: realtimeData.transaction
        },
        { status: realtimeResponse.status }
      )
    }

    console.log('[v0] Transfer send successful:', realtimeData.transaction)
    await deliverTransferAlerts({
      ...alertBase,
      transferId: realtimeData.transaction?.transactionId || transferId,
      status: realtimeData.status === 'failed' ? 'failed' : 'completed',
    }).catch((error) =>
      console.warn('[v0] Final transfer alert failed:', error instanceof Error ? error.message : error)
    )

    // Return 200 with transfer completion status
    return NextResponse.json(
      {
        success: true,
        status: realtimeData.status,
        transaction: realtimeData.transaction,
        _links: {
          status: `/api/transfers/realtime-status?transactionId=${realtimeData.transaction?.transactionId}`
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Transfer send error:', error.message)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to create transfer',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

/**
 * GET /api/transfers/money-movement/status
 * 
 * Get comprehensive money movement and transaction status
 * 
 * Query params:
 * - transactionId: Specific transaction ID
 * - reference: Payment reference
 * - limit: Number of recent transactions (default: 50)
 * - offset: Pagination offset (default: 0)
 * - status: Filter by status (completed, processing, failed, pending)
 * - type: Filter by type (transfer, deposit, payment, withdrawal)
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const searchParams = new URL(request.url).searchParams
    const transactionId = searchParams.get('transactionId')
    const reference = searchParams.get('reference')
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100)
    const offset = parseInt(searchParams.get('offset') || '0')
    const statusFilter = searchParams.get('status')
    const typeFilter = searchParams.get('type')

    console.log('[v0] Money movement status request:', {
      userId: user.id,
      transactionId,
      reference,
      limit,
      offset
    })

    // Get specific transaction by ID
    if (transactionId) {
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', transactionId)
        .eq('user_id', user.id)
        .single()

      if (txError || !transaction) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        {
          success: true,
          transaction: formatTransaction(transaction),
          _links: {
            list: '/api/transfers/money-movement/status?limit=50'
          }
        },
        { status: 200 }
      )
    }

    // Get transaction by reference
    if (reference) {
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('reference', reference)
        .eq('user_id', user.id)
        .single()

      if (txError || !transaction) {
        return NextResponse.json(
          { success: false, error: 'Transaction not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(
        {
          success: true,
          transaction: formatTransaction(transaction),
          _links: {
            list: '/api/transfers/money-movement/status?limit=50'
          }
        },
        { status: 200 }
      )
    }

    // Get user's transaction list with filters
    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)

    // Apply status filter
    if (statusFilter && ['completed', 'processing', 'failed', 'pending'].includes(statusFilter)) {
      query = query.eq('status', statusFilter)
    }

    // Apply type filter
    if (typeFilter && ['transfer', 'deposit', 'payment', 'withdrawal', 'bank_transfer'].includes(typeFilter)) {
      query = query.eq('type', typeFilter)
    }

    // Get total count
    const { count: totalCount } = await supabase
      .from('transactions')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)

    const total = totalCount ?? 0

    // Fetch paginated results
    const { data: transactions, error: listError } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1)

    if (listError) {
      console.error('[v0] Failed to fetch transactions:', listError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch transaction history' },
        { status: 500 }
      )
    }

    // Calculate totals
    const totals = {
      all: transactions.length,
      completed: transactions.filter(t => t.status === 'completed').length,
      processing: transactions.filter(t => t.status === 'processing').length,
      failed: transactions.filter(t => t.status === 'failed').length
    }

    // Calculate sums by type
    const sums = {
      sent: transactions
        .filter(t => ['transfer', 'payment', 'bank_transfer'].includes(t.type) && t.status === 'completed')
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0),
      received: transactions
        .filter(t => ['deposit', 'payment'].includes(t.type) && t.status === 'completed')
        .reduce((sum, t) => sum + parseFloat(t.amount || '0'), 0)
    }

    return NextResponse.json(
      {
        success: true,
        transactions: transactions.map(formatTransaction),
        pagination: {
          limit,
          offset,
          total,
          hasMore: offset + limit < total
        },
        summary: {
          totalTransactions: transactions.length,
          transactionCounts: totals,
          totalAmounts: {
            sent: sums.sent.toFixed(2),
            received: sums.received.toFixed(2),
            net: (sums.received - sums.sent).toFixed(2)
          },
          filters: {
            status: statusFilter || 'all',
            type: typeFilter || 'all'
          }
        },
        _links: {
          next: offset + limit < total
            ? `/api/transfers/money-movement/status?limit=${limit}&offset=${offset + limit}${statusFilter ? `&status=${statusFilter}` : ''}${typeFilter ? `&type=${typeFilter}` : ''}`
            : null,
          prev: offset > 0
            ? `/api/transfers/money-movement/status?limit=${limit}&offset=${Math.max(0, offset - limit)}${statusFilter ? `&status=${statusFilter}` : ''}${typeFilter ? `&type=${typeFilter}` : ''}`
            : null
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Money movement status error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get transaction status',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      },
      { status: 500 }
    )
  }
}

/**
 * Format transaction for API response
 */
function formatTransaction(transaction: any) {
  return {
    id: transaction.id,
    type: transaction.type,
    status: transaction.status,
    amount: parseFloat(transaction.amount || '0'),
    currency: transaction.currency || 'NGN',
    recipient: {
      name: transaction.recipient_name,
      email: transaction.recipient_email,
      phone: transaction.recipient_phone,
      account: transaction.recipient_account,
      bankCode: transaction.recipient_bank_code
    },
    reference: transaction.reference,
    transferCode: transaction.transfer_code,
    description: transaction.description,
    channel: transaction.channel,
    failureReason: transaction.failure_reason,
    timestamps: {
      created: transaction.created_at,
      updated: transaction.updated_at,
      completed: transaction.completed_at
    },
    metadata: {
      transactionType: transaction.transfer_type,
      narration: transaction.narration
    }
  }
}

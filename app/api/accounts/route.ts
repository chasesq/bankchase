import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

async function getAuthenticatedClient() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  return { supabase, user: data.user, error }
}

export async function GET() {
  try {
    const { supabase, user, error: authError } = await getAuthenticatedClient()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { data: accounts, error } = await supabase
      .from('accounts')
      .select('*')
      .eq('user_id', user.id)
      .order('is_default', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) throw error
    const rows = accounts ?? []
    const total_balance = rows.reduce((sum, account) => sum + Number(account.balance ?? 0), 0)
    return NextResponse.json({ accounts: rows, total_balance, message: 'Accounts retrieved successfully' })
  } catch (error) {
    console.error('[v0] Error fetching accounts:', error)
    return NextResponse.json({ error: 'Failed to fetch accounts' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await getAuthenticatedClient()
    if (authError || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json()
    const { accountName, accountNumber, routingNumber, bankName, accountType = 'checking' } = body
    if (!accountName || !accountNumber || !routingNumber || !bankName) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    const { count, error: countError } = await supabase
      .from('accounts')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', user.id)
    if (countError) throw countError

    const { data: account, error } = await supabase
      .from('accounts')
      .insert({
        user_id: user.id,
        account_name: accountName,
        account_number: accountNumber,
        routing_number: routingNumber,
        bank_name: bankName,
        account_type: accountType,
        balance: 0,
        is_default: (count ?? 0) === 0,
      })
      .select('*')
      .single()

    if (error) throw error
    return NextResponse.json({ account }, { status: 201 })
  } catch (error) {
    console.error('[v0] Error creating account:', error)
    return NextResponse.json({ error: 'Failed to create account' }, { status: 500 })
  }
}

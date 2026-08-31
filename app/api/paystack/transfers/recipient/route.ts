import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { paystackErrorMessage, paystackRequest } from '@/lib/paystack'

type RecipientBody = { name?: string; accountNumber?: string; bankCode?: string; currency?: string }

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = (await request.json()) as RecipientBody
    if (!body.name?.trim() || !body.accountNumber?.trim() || !body.bankCode?.trim()) {
      return NextResponse.json({ error: 'Name, account number, and bank code are required' }, { status: 400 })
    }
    const data = await paystackRequest('/transferrecipient', {
      method: 'POST',
      body: JSON.stringify({ type: 'nuban', name: body.name.trim(), account_number: body.accountNumber.trim(), bank_code: body.bankCode.trim(), currency: body.currency ?? 'NGN', metadata: { user_id: user.id } }),
    })
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: paystackErrorMessage(error) }, { status: 400 })
  }
}

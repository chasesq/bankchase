import { NextRequest, NextResponse } from 'next/server'
import { paystackErrorMessage, paystackRequest } from '@/lib/paystack'

export async function GET(request: NextRequest) {
  try {
    const country = request.nextUrl.searchParams.get('country') || 'nigeria'
    const currency = request.nextUrl.searchParams.get('currency') || undefined
    const params = new URLSearchParams({ country })
    if (currency) params.set('currency', currency)
    return NextResponse.json(await paystackRequest(`/bank?${params.toString()}`))
  } catch (error) {
    return NextResponse.json({ error: paystackErrorMessage(error) }, { status: 400 })
  }
}

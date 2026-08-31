import { NextRequest, NextResponse } from 'next/server'
import { paystackErrorMessage, paystackRequest } from '@/lib/paystack'

export async function GET(request: NextRequest) {
  try {
    const reference = request.nextUrl.searchParams.get('reference')?.trim()
    if (!reference || !/^[a-zA-Z0-9._-]{1,100}$/.test(reference)) {
      return NextResponse.json({ error: 'A valid reference is required' }, { status: 400 })
    }
    const data = await paystackRequest(`/transaction/verify/${encodeURIComponent(reference)}`)
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: paystackErrorMessage(error) }, { status: 400 })
  }
}

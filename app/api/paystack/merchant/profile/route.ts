import { NextResponse } from 'next/server'
import { paystackErrorMessage, paystackRequest } from '@/lib/paystack'

export async function GET() {
  try {
    const data = await paystackRequest('/merchant')
    return NextResponse.json(data)
  } catch (error) {
    return NextResponse.json({ error: paystackErrorMessage(error) }, { status: 400 })
  }
}

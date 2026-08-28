import { NextResponse } from 'next/server'
import { retrieveConnectAccount, stripeErrorMessage } from '@/lib/services/connect-service'

export async function GET(_request: Request, { params }: { params: Promise<{ accountId: string }> }) {
  try {
    const { accountId } = await params
    return NextResponse.json({ success: true, ...(await retrieveConnectAccount(accountId)) })
  } catch (error) {
    return NextResponse.json({ success: false, error: stripeErrorMessage(error) }, { status: 400 })
  }
}

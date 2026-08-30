import { NextRequest, NextResponse } from 'next/server'
import { deliverTransferAlerts } from '@/lib/transfer-alerts'

export async function POST(request: NextRequest) {
  try {
    const alerts = await deliverTransferAlerts(await request.json())
    const failed = alerts.filter((alert) => !alert.sent)
    return NextResponse.json({ success: failed.length === 0, alerts }, { status: failed.length === alerts.length ? 503 : 200 })
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : 'Invalid transfer alert request' }, { status: 400 })
  }
}

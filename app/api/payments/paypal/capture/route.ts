import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { capturePayPalOrder } from '@/lib/paypal'

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const { orderId } = await request.json()
    if (typeof orderId !== 'string' || !/^[A-Z0-9-]+$/i.test(orderId)) {
      return NextResponse.json({ error: 'Invalid PayPal order.' }, { status: 400 })
    }

    const capture = await capturePayPalOrder(orderId)
    const captureStatus = capture.status === 'COMPLETED' ? 'completed' : capture.status.toLowerCase()
    return NextResponse.json({ orderId: capture.id, status: captureStatus })
  } catch (error) {
    console.error('[v0] PayPal capture failed:', error)
    return NextResponse.json({ error: 'Unable to capture PayPal payment.' }, { status: 502 })
  }
}

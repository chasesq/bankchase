import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createPayPalSubscription } from '@/lib/paypal'

export async function POST(request: NextRequest) {
  try {
    const { data: { user } } = await (await createClient()).auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const planId = String(body.planId || process.env.PAYPAL_PLAN_ID || '').trim()
    if (!planId) return NextResponse.json({ error: 'Configure a PayPal plan before starting a subscription.' }, { status: 400 })
    const origin = request.nextUrl.origin
    const subscription = await createPayPalSubscription({ planId, returnUrl: `${origin}/payments?paypal=subscription-success`, cancelUrl: `${origin}/payments?paypal=subscription-cancelled` })
    const approvalUrl = subscription.links?.find((link) => link.rel === 'approve')?.href
    if (!approvalUrl) throw new Error('PayPal did not return a subscription approval URL')
    return NextResponse.json({ id: subscription.id, status: subscription.status, approvalUrl })
  } catch (error) {
    console.error('[v0] PayPal subscription failed:', error)
    return NextResponse.json({ error: 'Unable to start PayPal subscription.' }, { status: 502 })
  }
}

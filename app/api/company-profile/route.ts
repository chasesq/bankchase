import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

type LegalAddress = {
  street: string
  city: string
  state: string
  postalCode: string
}

const isPhysicalUsAddress = (address: LegalAddress) =>
  Boolean(address.street && address.city && address.state.length === 2 && /^\d{5}(-\d{4})?$/.test(address.postalCode)) &&
  !/p\.?\s*o\.?\s*box|virtual office|coworking|workspace/i.test(address.street)

export async function GET() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data } = await supabase.from('company_profiles').select('legal_address,address_status,address_updated_at,document_status').eq('user_id', user.id).maybeSingle()
  return NextResponse.json({ profile: data ?? { legal_address: null, address_status: 'needs_review', document_status: 'not_requested' } })
}

export async function PUT(request: NextRequest) {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: membership } = await supabase.from('organization_members').select('role').eq('user_id', user.id).maybeSingle()
  if (membership?.role && !['admin', 'administrator', 'owner'].includes(membership.role)) {
    return NextResponse.json({ error: 'Only administrators can update the legal address' }, { status: 403 })
  }

  const body = await request.json()
  const address = body.address as LegalAddress
  if (!address || !isPhysicalUsAddress(address)) {
    return NextResponse.json({ error: 'Enter a physical United States address. P.O. Boxes and virtual offices are not accepted.' }, { status: 400 })
  }

  const payload = { user_id: user.id, legal_address: address, address_status: 'pending_review', address_updated_at: new Date().toISOString(), document_status: 'requested' }
  const { data, error: saveError } = await supabase.from('company_profiles').upsert(payload, { onConflict: 'user_id' }).select().single()
  if (saveError) return NextResponse.json({ error: 'Address updates require company profile storage to be configured.' }, { status: 503 })
  return NextResponse.json({ profile: data })
}

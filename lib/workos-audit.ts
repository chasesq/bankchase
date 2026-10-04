import { createClient } from '@supabase/supabase-js'

export type WorkOSEvent = {
  id?: string
  event?: string
  type?: string
  created_at?: string
  createdAt?: string
  data?: Record<string, unknown>
  [key: string]: unknown
}

function getAdminClient() {
  const url = (
    process.env.SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SUPABASE_URL ??
    process.env.SRT_SUPABASE_URL ??
    process.env.NEXT_PUBLIC_SRT_SUPABASE_URL
  )?.trim()
  const key = (
    process.env.SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SUPABASE_SECRET_KEY ??
    process.env.SRT_SUPABASE_SERVICE_ROLE_KEY ??
    process.env.SRT_SUPABASE_SECRET_KEY ??
    process.env.SUPABASE_PUBLISHABLE_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
    process.env.SRT_SUPABASE_PUBLISHABLE_KEY
  )?.trim()
  if (!url || !key) throw new Error('Supabase is not configured')
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === 'object' && !Array.isArray(value) ? value as Record<string, unknown> : {}
}

function firstString(...values: unknown[]) {
  return values.find((value): value is string => typeof value === 'string' && value.length > 0)
}

export async function persistWorkOSEvent(event: WorkOSEvent) {
  const data = asRecord(event.data)
  const organization = asRecord(data.organization)
  const connection = asRecord(data.connection)
  const directory = asRecord(data.directory)
  const user = asRecord(data.user)
  const actor = asRecord(data.actor)
  const target = asRecord(data.target)
  const eventId = firstString(event.id, event.event_id)
  const eventType = firstString(event.event, event.type) ?? 'unknown'
  if (!eventId) throw new Error('WorkOS event id is missing')

  const { error } = await getAdminClient().from('workos_audit_events').upsert({
    workos_event_id: eventId,
    event_type: eventType,
    occurred_at: firstString(event.created_at, event.createdAt) ?? null,
    organization_id: firstString(data.organization_id, organization.id),
    connection_id: firstString(data.connection_id, connection.id),
    directory_id: firstString(data.directory_id, directory.id),
    actor_id: firstString(data.actor_id, actor.id, user.id),
    actor_email: firstString(data.actor_email, actor.email, user.email),
    target_id: firstString(data.target_id, target.id),
    payload: event,
  }, { onConflict: 'workos_event_id', ignoreDuplicates: false })

  if (error) throw error
}

export async function listWorkOSEvents(options: { page: number; limit: number; type?: string; search?: string }) {
  const offset = (options.page - 1) * options.limit
  let query = getAdminClient().from('workos_audit_events').select('id, workos_event_id, event_type, occurred_at, organization_id, connection_id, directory_id, actor_id, actor_email, target_id, payload, created_at', { count: 'exact' })
  if (options.type) query = query.eq('event_type', options.type)
  if (options.search) {
    const search = options.search.replace(/[\\%_,.()]/g, (character) => `\\${character}`)
    query = query.or(`event_type.ilike.%${search}%,actor_email.ilike.%${search}%,workos_event_id.ilike.%${search}%`)
  }
  const { data, error, count } = await query.order('occurred_at', { ascending: false, nullsFirst: false }).order('created_at', { ascending: false }).range(offset, offset + options.limit - 1)
  if (error) throw error
  return { events: data ?? [], total: count ?? 0 }
}

export async function listWorkOSEventTypes() {
  const { data, error } = await getAdminClient().from('workos_audit_events').select('event_type').order('event_type')
  if (error) throw error
  return [...new Set((data ?? []).map((row) => row.event_type))]
}

export function isWorkOSEvent(value: unknown): value is WorkOSEvent {
  return Boolean(value && typeof value === 'object' && (typeof (value as WorkOSEvent).id === 'string' || typeof (value as WorkOSEvent).event_id === 'string'))
}

export function getWorkOSServiceClient() {
  return getAdminClient()
}

export function extractWorkOSEvent(body: unknown): WorkOSEvent | null {
  if (isWorkOSEvent(body)) return body
  const record = asRecord(body)
  return isWorkOSEvent(record.event) ? record.event : null
}

export function isWorkOSAdminRole(role: unknown) {
  return role === 'admin' || role === 'auditor'
}

'use client'

import { useEffect, useState } from 'react'
import { Search, ShieldCheck, RefreshCw } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

type AuditEvent = { id: string; workos_event_id: string; event_type: string; occurred_at: string | null; actor_email: string | null; organization_id: string | null; directory_id: string | null; connection_id: string | null; payload: Record<string, unknown> }

function getActorLabel(event: AuditEvent) {
  if (event.actor_email) return event.actor_email
  const user = event.payload?.user
  if (user && typeof user === 'object' && 'email' in user && typeof user.email === 'string') return user.email
  return 'System'
}

export default function WorkOSEventsPage() {
  const [events, setEvents] = useState<AuditEvent[]>([])
  const [types, setTypes] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  async function loadEvents() {
    setLoading(true)
    setError('')
    const params = new URLSearchParams({ limit: '50' })
    if (search) params.set('search', search)
    if (type !== 'all') params.set('type', type)
    try {
      const sessionResponse = await fetch('/api/auth/session')
      const session = await sessionResponse.json()
      const accessToken = session?.session?.access_token
      const response = await fetch(`/api/admin/workos-events?${params}`, {
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : undefined,
      })
      const body = await response.json()
      if (!response.ok) throw new Error(body.error || 'Unable to load events')
      setEvents(body.events ?? [])
      setTypes(body.types ?? [])
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Unable to load events')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void loadEvents() }, [type])

  return <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-8">
    <div className="mx-auto flex max-w-7xl flex-col gap-8">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex items-start gap-3"><div className="rounded-lg bg-primary/10 p-2 text-primary"><ShieldCheck /></div><div><p className="text-sm font-medium text-muted-foreground">Enterprise controls</p><h1 className="text-3xl font-semibold tracking-tight">WorkOS audit events</h1><p className="mt-1 text-muted-foreground">Searchable SSO and Directory Sync activity from your webhook stream.</p></div></div>
        <Button variant="outline" onClick={() => void loadEvents()} disabled={loading}><RefreshCw data-icon="inline-start" />Refresh</Button>
      </header>
      <Card><CardHeader><CardTitle className="text-base">Event activity</CardTitle></CardHeader><CardContent className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={search} onChange={(event) => setSearch(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter' && !event.nativeEvent.isComposing && event.keyCode !== 229) void loadEvents() }} placeholder="Search event type, actor, or ID" aria-label="Search WorkOS events" /></div><Select value={type} onValueChange={setType}><SelectTrigger className="sm:w-64" aria-label="Filter event type"><SelectValue placeholder="All event types" /></SelectTrigger><SelectContent><SelectItem value="all">All event types</SelectItem>{types.map((item) => <SelectItem key={item} value={item}>{item}</SelectItem>)}</SelectContent></Select><Button onClick={() => void loadEvents()}>Search</Button></div>
        {error ? <p className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{error}</p> : null}
        <div className="overflow-x-auto rounded-md border"><table className="w-full min-w-[760px] text-sm"><thead className="bg-muted/50"><tr className="border-b text-left"><th className="px-4 py-3 font-medium">Event</th><th className="px-4 py-3 font-medium">Actor</th><th className="px-4 py-3 font-medium">Scope</th><th className="px-4 py-3 font-medium">Received</th></tr></thead><tbody>{loading ? <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">Loading events…</td></tr> : events.length === 0 ? <tr><td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">No WorkOS events found.</td></tr> : events.map((event) => <tr key={event.id} className="border-b last:border-0"><td className="px-4 py-3"><div className="flex flex-col gap-1"><Badge variant="secondary" className="w-fit">{event.event_type}</Badge><span className="font-mono text-xs text-muted-foreground">{event.workos_event_id}</span></div></td><td className="px-4 py-3">{getActorLabel(event)}</td><td className="px-4 py-3 text-muted-foreground">{event.organization_id || event.directory_id || event.connection_id || '—'}</td><td className="px-4 py-3 text-muted-foreground">{event.occurred_at ? new Date(event.occurred_at).toLocaleString() : '—'}</td></tr>)}</tbody></table></div>
      </CardContent></Card>
    </div>
  </main>
}

import type { RealtimeChannel } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'

export type RealtimeResource = 'accounts' | 'transactions' | 'notifications'
export type RealtimeConnectionStatus = 'connecting' | 'connected' | 'disconnected'

type RealtimeChange = {
  resource: RealtimeResource
  eventType: string
  record: Record<string, unknown>
  oldRecord: Record<string, unknown>
}

type UserRealtimeOptions = {
  userId: string
  resources: RealtimeResource[]
  onChange: (change: RealtimeChange) => void
  onStatus?: (status: RealtimeConnectionStatus) => void
}

const localListeners: Map<string, Set<(data: unknown) => void>> = new Map()

export function subscribeToUserRealtime({
  userId,
  resources,
  onChange,
  onStatus,
}: UserRealtimeOptions): () => void {
  if (!userId || resources.length === 0) return () => undefined

  const supabase = createClient()
  const channelName = `banking-${userId}-${resources.join('-')}`
  const channel: RealtimeChannel = supabase.channel(channelName)
  let closed = false

  onStatus?.('connecting')

  for (const resource of resources) {
    channel.on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: resource,
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        onChange({
          resource,
          eventType: payload.eventType,
          record: (payload.new ?? {}) as Record<string, unknown>,
          oldRecord: (payload.old ?? {}) as Record<string, unknown>,
        })
      },
    )
  }

  channel.subscribe((status) => {
    if (closed) return
    if (status === 'SUBSCRIBED') onStatus?.('connected')
    if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT' || status === 'CLOSED') {
      onStatus?.('disconnected')
    }
  })

  return () => {
    closed = true
    onStatus?.('disconnected')
    void supabase.removeChannel(channel)
  }
}

export class RealtimeService {
  static subscribe(channel: string, callback: (data: any) => void) {
    if (!localListeners.has(channel)) localListeners.set(channel, new Set())
    localListeners.get(channel)?.add(callback)
    return () => localListeners.get(channel)?.delete(callback)
  }

  static publish(channel: string, data: any) {
    localListeners.get(channel)?.forEach((callback) => callback(data))
  }

  static on(event: string, callback: (data: any) => void) {
    return this.subscribe(event, callback)
  }

  static emit(event: string, data: any) {
    this.publish(event, data)
  }
}

import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * Creates a Supabase client for server-side operations.
 * Always create a new client within each function when using it.
 */
function getSupabaseConfig() {
  const supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL)?.trim()
  const supabaseKey = (process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_PUBLISHABLE_KEY ?? process.env.SUPABASE_ANON_KEY)?.trim()

  if (!supabaseUrl || !supabaseKey || !supabaseUrl.startsWith('http')) return null
  return { supabaseUrl, supabaseKey }
}

export function isSupabaseConfigured() {
  return getSupabaseConfig() !== null
}

export async function createClient() {
  const cookieStore = await cookies()
  const config = getSupabaseConfig()

  if (!config) {
    throw new Error('Supabase is not configured')
  }

  const { supabaseUrl, supabaseKey } = config

  return createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // The "setAll" method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    },
  )
}

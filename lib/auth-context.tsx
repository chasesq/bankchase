'use client'

import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { User as SupabaseUser } from '@supabase/supabase-js'

export interface User {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  dateOfBirth?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  role?: 'admin' | 'editor' | 'viewer'
  permissions?: Array<{ role: string; action: string; resource: string }>
}

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  login: (username: string, password: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  verifyToken: () => Promise<void>
}

export interface RegisterData {
  username: string
  email: string
  password: string
  firstName: string
  lastName: string
  phone: string
  ssn: string
  dateOfBirth: string
  address: string
  city: string
  state: string
  zipCode: string
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function getSupabase() {
  if (typeof window === 'undefined') return null
  return createClient()
}

function mapUser(user: SupabaseUser): User {
  const metadata = user.user_metadata ?? {}
  return {
    id: user.id,
    username: String(metadata.username ?? user.email ?? ''),
    email: user.email ?? '',
    firstName: metadata.firstName,
    lastName: metadata.lastName,
    phone: user.phone ?? metadata.phone,
    dateOfBirth: metadata.dateOfBirth,
    address: metadata.address,
    city: metadata.city,
    state: metadata.state,
    zipCode: metadata.zipCode,
    role: ['admin', 'editor', 'viewer'].includes(user.app_metadata?.role)
      ? (user.app_metadata.role as User['role'])
      : undefined,
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    const supabase = getSupabase()
    if (!supabase) return

    void supabase.auth.getSession().then(({ data }: { data: { session: { user: SupabaseUser; access_token: string } | null } }) => {
      if (!mounted) return
      setUser(data.session?.user ? mapUser(data.session.user) : null)
      setToken(data.session?.access_token ?? null)
      setLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event: string, session: { user: SupabaseUser; access_token: string } | null) => {
      if (!mounted) return
      setUser(session?.user ? mapUser(session.user) : null)
      setToken(session?.access_token ?? null)
      setLoading(false)
    })

    return () => {
      mounted = false
      listener.subscription.unsubscribe()
    }
  }, [])

  const login = async (username: string, password: string) => {
    setLoading(true)
    setError(null)
    const email = username.trim()
    if (!email || !password.trim()) {
      const message = 'Email and password are required'
      setError(message)
      setLoading(false)
      throw new Error(message)
    }
    const supabase = getSupabase()
    if (!supabase) throw new Error('Authentication is unavailable')
    const { error: authError } = await supabase.auth.signInWithPassword({ email, password })
    setLoading(false)
    if (authError) {
      const message = authError.message.toLowerCase().includes('confirm')
        ? 'Please confirm your email before signing in.'
        : 'Invalid email or password.'
      setError(message)
      throw new Error(message)
    }
  }

  const register = async (userData: RegisterData) => {
    setLoading(true)
    setError(null)
    const supabase = getSupabase()
    if (!supabase) throw new Error('Authentication is unavailable')
    const { error: authError } = await supabase.auth.signUp({
      email: userData.email.trim(),
      password: userData.password,
      options: {
        emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`,
        data: {
          username: userData.username,
          firstName: userData.firstName,
          lastName: userData.lastName,
          phone: userData.phone,
          dateOfBirth: userData.dateOfBirth,
          address: userData.address,
          city: userData.city,
          state: userData.state,
          zipCode: userData.zipCode,
        },
      },
    })
    setLoading(false)
    if (authError) {
      const message = authError.message.toLowerCase().includes('password') ? authError.message : 'Registration could not be completed.'
      setError(message)
      throw new Error(message)
    }
  }

  const logout = () => {
    const supabase = getSupabase()
    if (supabase) void supabase.auth.signOut()
  }

  const verifyToken = async () => {
    const supabase = getSupabase()
    if (!supabase) throw new Error('Authentication is unavailable')
    const { data, error: authError } = await supabase.auth.getUser()
    if (authError || !data.user) throw new Error('Authentication required')
  }

  const value = useMemo(() => ({ user, token, loading, error, login, register, logout, verifyToken }), [user, token, loading, error])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { createClient } from "@/lib/supabase/client"

export interface User {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  ssn?: string
  dateOfBirth?: string
  address?: string
  city?: string
  state?: string
  zipCode?: string
  role?: string
  permissions?: Array<{ role: string; action: string; resource: string }>
}

type RegisterData = {
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

type AuthContextType = {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  login: (email: string, password: string, token?: string) => Promise<void>
  register: (data: RegisterData) => Promise<{ requiresEmailConfirmation: boolean }>
  logout: () => Promise<void>
  verifyToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function mapUser(user: { id: string; email?: string; user_metadata?: Record<string, unknown>; app_metadata?: Record<string, unknown> }): User {
  const metadata = user.user_metadata ?? {}
  return {
    id: user.id,
    email: user.email ?? "",
    username: String(metadata.username ?? user.email ?? ""),
    firstName: String(metadata.firstName ?? metadata.first_name ?? ""),
    lastName: String(metadata.lastName ?? metadata.last_name ?? ""),
    role: String(user.app_metadata?.role ?? "customer"),
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    if (!supabase) { setLoading(false); return }
    void supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ? mapUser(data.session.user) : null)
      setToken(data.session?.access_token ?? null)
      setLoading(false)
    })
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ? mapUser(session.user) : null)
      setToken(session?.access_token ?? null)
    })
    return () => listener.subscription.unsubscribe()
  }, [])

  const login = async (email: string, password: string) => {
    const supabase = createClient()
    if (!supabase) throw new Error("Authentication is not configured.")
    if (!email.trim() || !password) throw new Error("Email and password are required.")
    setLoading(true); setError(null)
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim().toLowerCase(), password })
      if (error) {
        const message = /email not confirmed/i.test(error.message) ? "Please confirm your email before signing in." : /invalid login credentials/i.test(error.message) ? "Invalid email or password." : "We couldn't sign you in right now. Please try again."
        throw new Error(message)
      }
      if (!data.session) throw new Error("Please confirm your email before signing in.")
      setUser(mapUser(data.user)); setToken(data.session.access_token)
    } catch (cause) { const message = cause instanceof Error ? cause.message : "We couldn't sign you in right now."; setError(message); throw new Error(message) }
    finally { setLoading(false) }
  }

  const register = async (data: RegisterData) => {
    const supabase = createClient()
    if (!supabase) throw new Error("Authentication is not configured.")
    setLoading(true); setError(null)
    try {
      const { data: result, error } = await supabase.auth.signUp({
        email: data.email.trim().toLowerCase(), password: data.password,
        options: { emailRedirectTo: process.env.NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL ?? `${window.location.origin}/auth/callback`, data: { username: data.username.trim(), firstName: data.firstName, lastName: data.lastName } },
      })
      if (error) {
        const message = /already registered|already exists/i.test(error.message) ? "Unable to create account with those details." : /password/i.test(error.message) ? "Choose a stronger password." : "We couldn't create your account right now."
        throw new Error(message)
      }
      if (result.session && result.user) { setUser(mapUser(result.user)); setToken(result.session.access_token); return { requiresEmailConfirmation: false } }
      return { requiresEmailConfirmation: true }
    } catch (cause) { const message = cause instanceof Error ? cause.message : "We couldn't create your account right now."; setError(message); throw new Error(message) }
    finally { setLoading(false) }
  }

  const logout = async () => { const supabase = createClient(); if (supabase) await supabase.auth.signOut(); setUser(null); setToken(null); setError(null) }
  const verifyToken = async () => { const supabase = createClient(); if (!supabase) throw new Error("Authentication is not configured."); const { data, error } = await supabase.auth.getUser(); if (error || !data.user) { setUser(null); setToken(null); throw new Error("Session expired.") } setUser(mapUser(data.user)) }

  return <AuthContext.Provider value={{ user, token, loading, error, login, register, logout, verifyToken }}>{children}</AuthContext.Provider>
}

export function useAuth() { const context = useContext(AuthContext); if (!context) throw new Error("useAuth must be used within AuthProvider"); return context }

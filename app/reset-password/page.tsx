'use client'

import Link from 'next/link'

export default function ResetPasswordPage() {
  return (
    <main className="min-h-svh bg-background px-4 py-10">
      <div className="mx-auto max-w-md text-center">
        <h1 className="text-2xl font-semibold text-foreground">Account recovery</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Use the secure authentication provider to recover access. Never enter Chase credentials or sensitive account numbers in BankChase.
        </p>
        <div className="mt-6 rounded-xl border border-border bg-card p-5 text-left">
          <p className="text-sm leading-6 text-foreground">Password recovery is handled through your registered email and the secure confirmation link sent by your account provider.</p>
          <Link href="/sign-in" className="mt-4 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline">Return to sign in</Link>
        </div>
      </div>
    </main>
  )
}

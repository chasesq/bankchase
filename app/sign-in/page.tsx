'use client'

import { Descope } from '@descope/nextjs-sdk'
import { useRouter } from 'next/navigation'
import { useCallback, useState } from 'react'

export default function SignInPage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  const handleSuccess = useCallback(() => {
    setError(null)
    router.replace('/home')
  }, [router])

  return (
    <main className="flex min-h-screen items-center justify-center p-6">
      <div className="w-full max-w-md space-y-4">
        <Descope flowId="sign-up-or-in" onSuccess={handleSuccess} onError={(event) => setError(event.detail?.errorMessage ?? event.detail?.errorDescription ?? 'Unable to sign in.')} />
        {error ? <p role="alert" className="text-sm text-destructive">{error}</p> : null}
      </div>
    </main>
  )
}

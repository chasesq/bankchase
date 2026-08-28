'use client'

import { useEffect, useState } from 'react'
import { Descope } from '@descope/nextjs-sdk'
import { AlertCircle, CheckCircle, Fingerprint, Loader2 } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'

const flowId = process.env.NEXT_PUBLIC_DESCOPE_PASSKEY_FLOW_ID || 'passkey-enrollment'

export function PasskeyEnrollment() {
  const [supported, setSupported] = useState<boolean | null>(null)
  const [enabled, setEnabled] = useState(false)
  const [open, setOpen] = useState(false)
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle')
  const [message, setMessage] = useState('')

  useEffect(() => {
    setSupported(typeof window !== 'undefined' && !!window.PublicKeyCredential)
  }, [])

  const startEnrollment = () => {
    if (!supported) {
      setStatus('error')
      setMessage('This browser or device does not support passkeys. Try a current version of Safari, Chrome, or Edge on a device with fingerprint or face unlock enabled.')
      return
    }
    if (!flowId) {
      setStatus('error')
      setMessage('Passkey enrollment is not configured yet. Add NEXT_PUBLIC_DESCOPE_PASSKEY_FLOW_ID after creating a Descope flow with a Passkey registration step.')
      return
    }
    setStatus('loading')
    setMessage('Complete the fingerprint or face prompt in the Descope window.')
    setOpen(true)
  }

  const handleSuccess = () => {
    setEnabled(true)
    setOpen(false)
    setStatus('success')
    setMessage('This device is now registered for passkey sign-in.')
  }

  const handleError = (event: CustomEvent<{ errorCode: string; errorDescription: string; errorMessage?: string }>) => {
    setOpen(false)
    setStatus('error')
    setMessage(event.detail?.errorMessage || event.detail?.errorDescription || 'The passkey prompt was canceled or could not be completed. No changes were made.')
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Fingerprint className="mt-1 size-6 text-primary" aria-hidden="true" />
            <div>
              <CardTitle>Fingerprint and face sign-in</CardTitle>
              <CardDescription className="mt-1">Register this device as a Descope passkey. Your biometric data stays on your device.</CardDescription>
            </div>
          </div>
          <Badge variant={enabled ? 'default' : 'secondary'}>{enabled ? 'Enabled' : 'Not set up'}</Badge>
        </div>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {supported === false && (
          <Alert variant="destructive">
            <AlertCircle data-icon="inline-start" />
            <AlertTitle>Passkeys are unavailable</AlertTitle>
            <AlertDescription>Use HTTPS and a supported browser with device unlock enabled.</AlertDescription>
          </Alert>
        )}
        {status === 'success' && (
          <Alert>
            <CheckCircle data-icon="inline-start" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        {status === 'error' && (
          <Alert variant="destructive">
            <AlertCircle data-icon="inline-start" />
            <AlertDescription>{message}</AlertDescription>
          </Alert>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <Button onClick={startEnrollment} disabled={status === 'loading' || supported === null}>
            {status === 'loading' ? <Loader2 className="animate-spin" data-icon="inline-start" /> : <Fingerprint data-icon="inline-start" />}
            {enabled ? 'Register another device' : 'Set up fingerprint sign-in'}
          </Button>
          {enabled && <span className="text-sm text-muted-foreground">To remove this passkey, use Descope&apos;s device management in your account.</span>}
        </div>
        {open && flowId && (
          <div className="rounded-lg border border-border bg-muted/30 p-4">
            <p className="mb-3 text-sm font-medium text-foreground">Secure Descope passkey setup</p>
            <Descope flowId={flowId} onSuccess={handleSuccess} onError={handleError} />
          </div>
        )}
        <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          <a className="text-primary underline underline-offset-4" href="https://app.descope.com" target="_blank" rel="noreferrer">Open Descope Console</a>
          <a className="text-primary underline underline-offset-4" href="https://docs.descope.com/authentication-methods/passkeys" target="_blank" rel="noreferrer">Passkey setup guide</a>
        </div>
        <p className="text-sm text-muted-foreground">Create a Descope flow named <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">passkey-enrollment</code> with Passkey registration, or set <code className="rounded bg-muted px-1 py-0.5 font-mono text-xs">NEXT_PUBLIC_DESCOPE_PASSKEY_FLOW_ID</code> to your flow ID.</p>
      </CardContent>
    </Card>
  )
}

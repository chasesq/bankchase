'use client'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { MailCheck, ShieldCheck, Smartphone } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

export default function VerificationPage() {
  const searchParams = useSearchParams()
  const email = searchParams.get('email')

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-4 py-8 text-foreground">
      <Card className="w-full max-w-lg border-primary/15 shadow-xl shadow-primary/5">
        <CardHeader className="space-y-4 text-center">
          <div className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck className="size-7" aria-hidden="true" />
          </div>
          <div>
            <CardTitle className="text-2xl">Verify your BankChase account</CardTitle>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Your account was created securely. Complete the verification step provided by your configured authentication provider before signing in.</p>
          </div>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="flex items-start gap-3"><MailCheck className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><div><p className="font-medium">Check your email</p><p className="mt-1 text-sm leading-6 text-muted-foreground">{email ? `Look for the confirmation message sent to ${email}.` : 'Look for the confirmation message sent to your email address.'} Follow its secure link to confirm your account.</p></div></div>
          </div>
          <div className="rounded-xl border border-border p-4">
            <div className="flex items-start gap-3"><Smartphone className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden="true" /><div><p className="font-medium">SMS or email one-time codes</p><p className="mt-1 text-sm leading-6 text-muted-foreground">If your authentication provider has SMS or OTP enabled, it will deliver and verify the code. BankChase never accepts or stores a code entered here without a configured provider.</p></div></div>
          </div>
          <div className="rounded-xl bg-primary/5 p-4 text-sm leading-6 text-muted-foreground">Did not receive a message? Check spam, wait a moment, or use the resend option in the provider&apos;s verification email flow. If your provider does not support delivery, contact the account administrator to configure it.</div>
          <div className="flex flex-col gap-3 sm:flex-row"><Button asChild className="flex-1"><Link href="/sign-in">Continue to sign in</Link></Button><Button asChild variant="outline" className="flex-1"><Link href="/mobile-banking">Open mobile setup</Link></Button></div>
          <p className="text-center text-xs text-muted-foreground">For Chase accounts, use only the official <a className="text-primary underline-offset-4 hover:underline" href="https://www.chase.com/" target="_blank" rel="noreferrer">Chase.com</a> domain.</p>
        </CardContent>
      </Card>
    </main>
  )
}

"use client"

import { useState } from "react"
import Link from "next/link"
import { Loader2, ShieldCheck } from "lucide-react"
import { useAuth } from "@/lib/auth-context"

export function AuthForm({ mode }: { mode: "sign-in" | "sign-up" }) {
  const { login, register } = useAuth()
  const isSignUp = mode === "sign-up"
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setLoading(true)
    try {
      if (isSignUp) {
        const [firstName, ...last] = name.trim().split(/\s+/)
        await register({ username: username.trim(), email: email.trim(), password, firstName: firstName || "", lastName: last.join(" "), phone: "", ssn: "", dateOfBirth: "", address: "", city: "", state: "", zipCode: "" })
      } else {
        await login(username.trim(), password)
      }
      window.location.replace("/")
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "We couldn't complete your request. Check your details and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <main className="flex min-h-svh items-center justify-center bg-background px-5 py-10 text-foreground">
      <section className="w-full max-w-md rounded-xl border border-border bg-card p-6 shadow-sm sm:p-8">
        <header className="flex flex-col gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-primary"><ShieldCheck className="size-5" aria-hidden="true" /> Secure Bankchase account</div>
          <h1 className="text-3xl font-semibold tracking-tight">{isSignUp ? "Create your account" : "Sign in to Bankchase"}</h1>
          <p className="text-sm leading-6 text-muted-foreground">{isSignUp ? "Create an account to manage your connected financial accounts." : "Use your Bankchase credentials. Never enter bank credentials here."}</p>
        </header>
        <form onSubmit={handleSubmit} className="mt-7 flex flex-col gap-5">
          {isSignUp && <label className="flex flex-col gap-2 text-sm font-medium">Full name<input className="rounded-md border border-border bg-background px-3 py-3 font-normal outline-none focus:ring-2 focus:ring-ring" value={name} onChange={(e) => setName(e.target.value)} required autoComplete="name" /></label>}
          {isSignUp && <label className="flex flex-col gap-2 text-sm font-medium">Email address<input className="rounded-md border border-border bg-background px-3 py-3 font-normal outline-none focus:ring-2 focus:ring-ring" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required autoComplete="email" /></label>}
          <label className="flex flex-col gap-2 text-sm font-medium">Username<input className="rounded-md border border-border bg-background px-3 py-3 font-normal outline-none focus:ring-2 focus:ring-ring" value={username} onChange={(e) => setUsername(e.target.value)} required autoComplete="username" /></label>
          <label className="flex flex-col gap-2 text-sm font-medium">Password<input className="rounded-md border border-border bg-background px-3 py-3 font-normal outline-none focus:ring-2 focus:ring-ring" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={isSignUp ? 8 : undefined} autoComplete={isSignUp ? "new-password" : "current-password"} /></label>
          {error && <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">{error}</p>}
          <button type="submit" disabled={loading} className="flex min-h-12 items-center justify-center rounded-md bg-primary px-4 font-medium text-primary-foreground transition hover:bg-primary/90 disabled:cursor-not-allowed disabled:opacity-70">{loading ? <Loader2 className="size-5 animate-spin" aria-label="Loading" /> : isSignUp ? "Create account" : "Sign in"}</button>
        </form>
        <p className="mt-6 text-center text-sm text-muted-foreground">{isSignUp ? "Already have an account?" : "Need an account?"} <Link href={isSignUp ? "/sign-in" : "/sign-up"} className="font-medium text-primary hover:underline">{isSignUp ? "Sign in" : "Sign up"}</Link></p>
      </section>
    </main>
  )
}

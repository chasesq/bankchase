"use client"

import type React from "react"
import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { ArrowLeft, Check, ChevronDown, MapPin } from "lucide-react"
import { ProtectedRoute } from "@/components/ProtectedRoute"
import { Navigation } from "@/components/Navigation"

const states = ["New York", "California", "Illinois", "Texas", "Washington", "Other"]

function CompanyProfileContent() {
  const [companyName, setCompanyName] = useState("Chase")
  const [address, setAddress] = useState({
    line1: "270 Park Avenue",
    line2: "",
    city: "New York",
    state: "New York",
    postalCode: "10017",
    country: "United States",
  })
  const [saved, setSaved] = useState(false)

  const updateAddress = (key: keyof typeof address, value: string) => {
    setAddress((current) => ({ ...current, [key]: value }))
    setSaved(false)
  }

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setSaved(true)
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <Navigation />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8 px-4 py-8 md:px-8 md:py-12">
        <div className="flex items-center gap-3">
          <Link
            href="/settings"
            aria-label="Back to settings"
            className="rounded-md p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <p className="text-sm font-medium text-primary">Chase business profile</p>
            <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">Company profile</h1>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_280px]">
          <div className="flex flex-col gap-8">
            <div className="flex items-center justify-between gap-4 rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-4">
                <Image src="/images/chase-logo.png" alt="Chase Bank logo" width={56} height={56} className="rounded-lg" />
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.16em] text-muted-foreground">Company card</p>
                  <h2 className="mt-1 text-xl font-semibold">Chase Bank</h2>
                  <p className="text-sm text-muted-foreground">Primary business profile</p>
                </div>
              </div>
              <span className="hidden rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary sm:inline-flex">Active</span>
            </div>

            <form onSubmit={handleSave} className="rounded-xl border border-border bg-card p-6 shadow-sm md:p-8">
            <div className="mb-8 flex items-start gap-4 border-b border-border pb-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <MapPin className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-semibold">Legal address</h2>
                <p className="mt-1 text-sm leading-6 text-muted-foreground">
                  Keep Chase&apos;s registered business address up to date for account records and official notices.
                </p>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label htmlFor="company-name" className="mb-2 block text-sm font-medium">Company name</label>
                <input id="company-name" value={companyName} onChange={(event) => { setCompanyName(event.target.value); setSaved(false) }} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                <p className="mt-2 text-xs text-muted-foreground">This name appears on your Chase account profile.</p>
              </div>

              <div>
                <label htmlFor="address-line-1" className="mb-2 block text-sm font-medium">Street address</label>
                <input id="address-line-1" required value={address.line1} onChange={(event) => updateAddress("line1", event.target.value)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>

              <div>
                <label htmlFor="address-line-2" className="mb-2 block text-sm font-medium">Apartment, suite, or floor <span className="font-normal text-muted-foreground">(optional)</span></label>
                <input id="address-line-2" value={address.line2} onChange={(event) => updateAddress("line2", event.target.value)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="city" className="mb-2 block text-sm font-medium">City</label>
                  <input id="city" required value={address.city} onChange={(event) => updateAddress("city", event.target.value)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label htmlFor="state" className="mb-2 block text-sm font-medium">State</label>
                  <div className="relative">
                    <select id="state" value={address.state} onChange={(event) => updateAddress("state", event.target.value)} className="h-11 w-full appearance-none rounded-md border border-input bg-background px-3 pr-10 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20">
                      {states.map((state) => <option key={state}>{state}</option>)}
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-3 h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </div>

              <div className="grid gap-5 md:grid-cols-2">
                <div>
                  <label htmlFor="postal-code" className="mb-2 block text-sm font-medium">ZIP code</label>
                  <input id="postal-code" required inputMode="numeric" value={address.postalCode} onChange={(event) => updateAddress("postalCode", event.target.value)} className="h-11 w-full rounded-md border border-input bg-background px-3 text-sm outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20" />
                </div>
                <div>
                  <label htmlFor="country" className="mb-2 block text-sm font-medium">Country</label>
                  <input id="country" value={address.country} readOnly className="h-11 w-full rounded-md border border-input bg-muted px-3 text-sm text-muted-foreground" />
                </div>
              </div>
            </div>

            <div className="mt-8 flex flex-col items-start justify-between gap-4 border-t border-border pt-6 sm:flex-row sm:items-center">
              {saved ? <p role="status" className="flex items-center gap-2 text-sm font-medium text-primary"><Check className="h-4 w-4" /> Changes saved</p> : <span className="text-sm text-muted-foreground">Changes apply to future account documents.</span>}
              <button type="submit" className="w-full rounded-md bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground transition hover:bg-primary/90 sm:w-auto">Save changes</button>
            </div>
            </form>
          </div>

          <aside className="h-fit rounded-xl border border-border bg-muted/40 p-5">
            <h2 className="font-semibold">About legal addresses</h2>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">Use the address where Chase is legally registered. A physical street address is required; P.O. boxes aren&apos;t accepted.</p>
            <Link href="/help" className="mt-4 inline-flex text-sm font-medium text-primary hover:underline">Visit Chase support</Link>
          </aside>
        </div>
      </div>
    </main>
  )
}

export default function CompanyProfilePage() {
  return <ProtectedRoute><CompanyProfileContent /></ProtectedRoute>
}

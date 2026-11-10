"use client"

import useSWR from "swr"
import { AlertTriangle, CheckCircle2, Clock3, ExternalLink, RefreshCw, ShieldCheck, Wrench } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface StatusResponse {
  status: { indicator: string; description: string }
  components: Array<{ id: string; name: string; status: string; updated_at: string }>
  incidents: Array<{ id: string; name: string; status: string; impact: string; shortlink: string; updated_at: string }>
  maintenances: Array<{ id: string; name: string; status: string; impact: string; shortlink: string; scheduled_for: string; scheduled_until: string }>
  fetchedAt: string
}

const fetcher = (url: string) => fetch(url).then((response) => {
  if (!response.ok) throw new Error("Status unavailable")
  return response.json()
})

function statusTone(status: string) {
  if (status === "operational") return "text-emerald-600 dark:text-emerald-400"
  if (status === "degraded_performance" || status === "partial_outage") return "text-amber-600 dark:text-amber-400"
  return "text-red-600 dark:text-red-400"
}

function statusLabel(status: string) {
  return status.replaceAll("_", " ").replace(/\b\w/g, (letter) => letter.toUpperCase())
}

export default function BankIDStatusPage() {
  const { data, error, isLoading, mutate } = useSWR<StatusResponse>("/api/bankid-status", fetcher, { refreshInterval: 60_000 })
  const isOperational = data?.status.indicator === "none"

  return (
    <main className="min-h-screen bg-[#f6f8fb] text-slate-950 dark:bg-slate-950 dark:text-white">
      <header className="border-b border-slate-200/80 bg-white/90 dark:border-slate-800 dark:bg-slate-950/90">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5 sm:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-xl bg-[#173f5f] text-white shadow-sm"><ShieldCheck size={22} /></div>
            <div><p className="text-lg font-semibold tracking-tight">BankID Status</p><p className="text-xs text-slate-500 dark:text-slate-400">Finansiell ID-Teknik BID AB</p></div>
          </div>
          <Button variant="ghost" size="sm" onClick={() => mutate()} aria-label="Refresh status"><RefreshCw size={16} className={isLoading ? "animate-spin" : ""} /><span className="hidden sm:inline">Refresh</span></Button>
        </div>
      </header>

      <div className="mx-auto max-w-5xl space-y-6 px-5 py-8 sm:px-8 sm:py-12">
        <section className="rounded-2xl bg-[#173f5f] p-6 text-white shadow-lg sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div><p className="mb-2 text-sm font-medium text-sky-200">Current status</p><h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{error ? "Status unavailable" : data ? data.status.description : "Checking BankID services"}</h1><p className="mt-3 max-w-xl text-sm leading-6 text-sky-100">Live service information for BankID. This page refreshes automatically every minute.</p></div>
            <div className="flex size-20 shrink-0 items-center justify-center rounded-full bg-white/10 ring-8 ring-white/5">{error ? <AlertTriangle className="text-amber-300" size={34} /> : isOperational ? <CheckCircle2 className="text-emerald-300" size={34} /> : <AlertTriangle className="text-amber-300" size={34} />}</div>
          </div>
        </section>

        <section aria-labelledby="services-heading"><div className="mb-3 flex items-center justify-between"><h2 id="services-heading" className="text-xl font-semibold">Service status</h2>{data?.fetchedAt && <p className="text-xs text-slate-500 dark:text-slate-400">Updated {new Date(data.fetchedAt).toLocaleTimeString("sv-SE", { hour: "2-digit", minute: "2-digit" })}</p>}</div><div className="grid gap-3 sm:grid-cols-2">{data?.components.map((component) => <Card key={component.id} className="border-slate-200/80 shadow-sm dark:border-slate-800"><CardContent className="flex items-center justify-between gap-4 p-5"><div className="flex items-center gap-3"><span className={`size-2.5 rounded-full bg-current ${statusTone(component.status)}`} aria-hidden="true" /><span className="font-medium">{component.name}</span></div><Badge variant="secondary" className={statusTone(component.status)}>{statusLabel(component.status)}</Badge></CardContent></Card>)}{isLoading && [1, 2].map((item) => <Card key={item} className="animate-pulse border-slate-200/80 dark:border-slate-800"><CardContent className="h-[73px] p-5" /></Card>)}{!isLoading && !error && !data?.components.length && <Card className="sm:col-span-2"><CardContent className="p-5 text-sm text-slate-500">No component data is currently available.</CardContent></Card>}</div></section>

        <div className="grid gap-6 lg:grid-cols-2"><Card className="border-slate-200/80 shadow-sm dark:border-slate-800"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><AlertTriangle size={18} /> Unresolved incidents</CardTitle></CardHeader><CardContent className="space-y-4">{data?.incidents.length ? data.incidents.map((incident) => <div key={incident.id} className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/60 dark:bg-amber-950/20"><div className="flex items-start justify-between gap-3"><div><p className="font-medium">{incident.name}</p><p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{statusLabel(incident.status)} · {statusLabel(incident.impact)} impact</p></div><a href={incident.shortlink} target="_blank" rel="noreferrer" aria-label={`Open incident: ${incident.name}`}><ExternalLink size={16} /></a></div></div>) : <p className="text-sm text-slate-500 dark:text-slate-400">No unresolved incidents.</p>}</CardContent></Card><Card className="border-slate-200/80 shadow-sm dark:border-slate-800"><CardHeader><CardTitle className="flex items-center gap-2 text-lg"><Wrench size={18} /> Scheduled maintenance</CardTitle></CardHeader><CardContent className="space-y-4">{data?.maintenances.length ? data.maintenances.map((maintenance) => <div key={maintenance.id} className="rounded-xl border border-slate-200 p-4 dark:border-slate-700"><p className="font-medium">{maintenance.name}</p><p className="mt-1 flex items-center gap-1 text-sm text-slate-600 dark:text-slate-300"><Clock3 size={14} /> {new Date(maintenance.scheduled_for).toLocaleString("sv-SE")}</p></div>) : <p className="text-sm text-slate-500 dark:text-slate-400">No upcoming maintenance.</p>}</CardContent></Card></div>

        <footer className="flex flex-col gap-2 border-t border-slate-200 pt-5 text-sm text-slate-500 dark:border-slate-800 dark:text-slate-400 sm:flex-row sm:items-center sm:justify-between"><span>Powered by BankID Statuspage</span><a className="inline-flex items-center gap-1 font-medium text-[#173f5f] hover:underline dark:text-sky-300" href="https://status.bankid.com" target="_blank" rel="noreferrer">Open status.bankid.com <ExternalLink size={14} /></a></footer>
      </div>
    </main>
  )
}

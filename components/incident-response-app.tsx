"use client"

import { useMemo, useState } from "react"
import {
  Activity,
  AlertTriangle,
  ArrowRight,
  Bell,
  BookOpen,
  CheckCircle2,
  ChevronRight,
  CircleDot,
  Clock3,
  Command,
  FileText,
  Filter,
  Inbox,
  LayoutDashboard,
  LifeBuoy,
  MoreHorizontal,
  Search,
  ShieldAlert,
  SlidersHorizontal,
  TerminalSquare,
  UserRound,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"

const initialAlerts = [
  { id: "ALT-1048", title: "Impossible travel detected", source: "Identity provider", entity: "a.chen@bankchase.com", age: "12 min", severity: "Critical", type: "Identity" },
  { id: "ALT-1047", title: "Unusual outbound transfer", source: "Payments monitor", entity: "acct_••••7842", age: "28 min", severity: "High", type: "Financial" },
  { id: "ALT-1046", title: "Credential stuffing pattern", source: "Edge gateway", entity: "172.18.4.0/24", age: "41 min", severity: "High", type: "Access" },
  { id: "ALT-1045", title: "MFA method changed", source: "Identity provider", entity: "j.santos@bankchase.com", age: "1 hr", severity: "Medium", type: "Identity" },
  { id: "ALT-1044", title: "Suspicious API token scope", source: "Developer platform", entity: "svc-reporting", age: "2 hr", severity: "Low", type: "Access" },
]

const cases = [
  { id: "CASE-208", title: "Account takeover investigation", severity: "Critical", owner: "Maya Patel", state: "Investigating", updated: "8 min ago" },
  { id: "CASE-207", title: "Unauthorized wire activity", severity: "High", owner: "Noah Williams", state: "Contained", updated: "34 min ago" },
  { id: "CASE-205", title: "Admin token misuse", severity: "High", owner: "Unassigned", state: "Open", updated: "1 hr ago" },
]

const severityStyles: Record<string, string> = {
  Critical: "border-red-200 bg-red-50 text-red-700",
  High: "border-orange-200 bg-orange-50 text-orange-700",
  Medium: "border-amber-200 bg-amber-50 text-amber-700",
  Low: "border-slate-200 bg-slate-50 text-slate-600",
}

export default function IncidentResponseApp() {
  const [alerts, setAlerts] = useState(initialAlerts)
  const [activeView, setActiveView] = useState("Overview")
  const [selectedAlert, setSelectedAlert] = useState(initialAlerts[0])
  const [query, setQuery] = useState("")
  const [toast, setToast] = useState("")

  const filteredAlerts = useMemo(() => alerts.filter((alert) => `${alert.title} ${alert.entity} ${alert.id}`.toLowerCase().includes(query.toLowerCase())), [alerts, query])

  function notify(message: string) {
    setToast(message)
    window.setTimeout(() => setToast(""), 2600)
  }

  function dismissAlert() {
    if (!selectedAlert) return
    setAlerts((current) => current.filter((alert) => alert.id !== selectedAlert.id))
    setSelectedAlert(null as never)
    notify("Alert dismissed and audit event recorded")
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa] text-slate-950">
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 border-r border-slate-200 bg-[#101827] text-slate-300 lg:flex lg:flex-col">
          <div className="flex h-16 items-center gap-3 border-b border-white/10 px-5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-cyan-400 text-slate-950"><ShieldAlert className="size-4" /></div>
            <div><p className="text-sm font-semibold tracking-wide text-white">Bankchase IR</p><p className="text-[11px] text-slate-400">Security operations</p></div>
          </div>
          <div className="flex-1 px-3 py-5">
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Workspace</p>
            {[
              { icon: LayoutDashboard, label: "Overview" },
              { icon: Inbox, label: "Alert queue", count: alerts.length },
              { icon: ShieldAlert, label: "Cases", count: 12 },
              { icon: Activity, label: "Timeline" },
              { icon: FileText, label: "Reports" },
            ].map(({ icon: Icon, label, count }) => (
              <button key={label} onClick={() => setActiveView(label)} className={cn("mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm transition", activeView === label ? "bg-cyan-400/15 text-cyan-300" : "text-slate-400 hover:bg-white/5 hover:text-white")}>
                <Icon className="size-4" /><span className="flex-1">{label}</span>{count ? <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-slate-300">{count}</span> : null}
              </button>
            ))}
            <Separator className="my-5 bg-white/10" />
            <p className="px-3 pb-2 text-[10px] font-semibold uppercase tracking-[0.16em] text-slate-500">Resources</p>
            {[[BookOpen, "Playbooks"], [TerminalSquare, "Ingestion API"], [SlidersHorizontal, "Settings"]].map(([Icon, label]) => <button key={label as string} className="mb-1 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-sm text-slate-400 hover:bg-white/5 hover:text-white"><Icon className="size-4" />{label as string}</button>)}
          </div>
          <div className="border-t border-white/10 p-4"><div className="flex items-center gap-3"><div className="flex size-8 items-center justify-center rounded-full bg-slate-700 text-xs font-semibold text-white">MP</div><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium text-white">Maya Patel</p><p className="text-[11px] text-slate-500">Incident commander</p></div><MoreHorizontal className="size-4 text-slate-500" /></div></div>
        </aside>

        <section className="min-w-0 flex-1">
          <header className="flex h-16 items-center justify-between border-b border-slate-200 bg-white px-5 sm:px-8">
            <div className="flex items-center gap-3"><div className="flex size-8 items-center justify-center rounded-lg bg-cyan-50 text-cyan-700 lg:hidden"><ShieldAlert className="size-4" /></div><div><p className="text-sm font-medium text-slate-500">Workspace / <span className="text-slate-900">{activeView}</span></p></div></div>
            <div className="flex items-center gap-2"><Button variant="outline" size="sm" className="hidden gap-2 text-slate-600 sm:flex"><Command className="size-3.5" />K</Button><Button variant="ghost" size="icon" aria-label="Notifications"><Bell className="size-4 text-slate-500" /></Button><div className="flex size-8 items-center justify-center rounded-full bg-slate-900 text-xs font-semibold text-white">MP</div></div>
          </header>

          <div className="mx-auto max-w-[1500px] space-y-6 p-5 sm:p-8">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end"><div><div className="mb-2 flex items-center gap-2 text-xs font-medium text-emerald-600"><span className="size-2 rounded-full bg-emerald-500" />All systems operational</div><h1 className="text-2xl font-semibold tracking-tight text-slate-950">Incident response center</h1><p className="mt-1 text-sm text-slate-500">Triage active signals, coordinate investigations, and keep your team moving.</p></div><Button onClick={() => notify("Ingestion endpoint copied to clipboard")} className="gap-2 bg-slate-900 text-white hover:bg-slate-800"><TerminalSquare className="size-4" />Ingest alert <ArrowRight className="size-4" /></Button></div>

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
              {[{label:"Open alerts", value:alerts.length.toString(), note:"4 need attention", icon:Inbox, color:"text-cyan-600 bg-cyan-50"}, {label:"Active cases", value:"12", note:"3 critical", icon:ShieldAlert, color:"text-orange-600 bg-orange-50"}, {label:"MTTA", value:"14m", note:"22% faster this week", icon:Clock3, color:"text-violet-600 bg-violet-50"}, {label:"SLA health", value:"96.4%", note:"Within target", icon:CheckCircle2, color:"text-emerald-600 bg-emerald-50"}].map((stat) => <Card key={stat.label} className="border-slate-200 bg-white shadow-none"><CardContent className="flex items-start justify-between p-5"><div><p className="text-xs font-medium text-slate-500">{stat.label}</p><p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{stat.value}</p><p className="mt-1 text-xs text-slate-500">{stat.note}</p></div><div className={cn("flex size-9 items-center justify-center rounded-lg", stat.color)}><stat.icon className="size-4" /></div></CardContent></Card>)}
            </div>

            <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(330px,0.85fr)]">
              <Card className="border-slate-200 bg-white shadow-none"><CardHeader className="gap-4 border-b border-slate-100 pb-4"><div className="flex items-center justify-between"><div><CardTitle className="text-base">Alert queue</CardTitle><p className="mt-1 text-xs text-slate-500">Signals waiting for analyst action</p></div><Button variant="ghost" size="sm" className="gap-2 text-slate-500"><Filter className="size-3.5" />Filter</Button></div><div className="relative"><Search className="absolute left-3 top-2.5 size-4 text-slate-400" /><Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search alerts, entities, or IDs" className="border-slate-200 bg-slate-50 pl-9 text-sm" /></div></CardHeader><CardContent className="p-0"><div className="divide-y divide-slate-100">{filteredAlerts.map((alert) => <button key={alert.id} onClick={() => setSelectedAlert(alert)} className={cn("flex w-full items-start gap-3 p-4 text-left transition hover:bg-slate-50", selectedAlert?.id === alert.id && "bg-cyan-50/60") }><div className={cn("mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg", alert.severity === "Critical" ? "bg-red-100 text-red-600" : alert.severity === "High" ? "bg-orange-100 text-orange-600" : "bg-amber-100 text-amber-600")}><AlertTriangle className="size-4" /></div><div className="min-w-0 flex-1"><div className="flex flex-wrap items-center gap-2"><p className="truncate text-sm font-medium text-slate-900">{alert.title}</p><Badge variant="outline" className={cn("text-[10px]", severityStyles[alert.severity])}>{alert.severity}</Badge></div><p className="mt-1 text-xs text-slate-500">{alert.id} · {alert.source} · {alert.entity}</p></div><span className="whitespace-nowrap text-[11px] text-slate-400">{alert.age}</span><ChevronRight className="mt-1 size-4 text-slate-300" /></button>)}{!filteredAlerts.length && <div className="p-10 text-center text-sm text-slate-500">No alerts match your search.</div>}</div></CardContent></Card>

              <div className="space-y-6">
                <Card className="border-slate-200 bg-white shadow-none"><CardHeader className="flex-row items-center justify-between pb-3"><div><CardTitle className="text-base">Selected alert</CardTitle><p className="mt-1 text-xs text-slate-500">{selectedAlert ? selectedAlert.id : "No alert selected"}</p></div>{selectedAlert && <Badge variant="outline" className={cn("text-[10px]", severityStyles[selectedAlert.severity])}>{selectedAlert.severity}</Badge>}</CardHeader><CardContent>{selectedAlert ? <><h2 className="text-sm font-semibold text-slate-900">{selectedAlert.title}</h2><dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 text-xs"><div><dt className="text-slate-400">Source</dt><dd className="mt-1 font-medium text-slate-700">{selectedAlert.source}</dd></div><div><dt className="text-slate-400">Detected</dt><dd className="mt-1 font-medium text-slate-700">{selectedAlert.age} ago</dd></div><div><dt className="text-slate-400">Entity</dt><dd className="mt-1 truncate font-medium text-slate-700">{selectedAlert.entity}</dd></div><div><dt className="text-slate-400">Status</dt><dd className="mt-1 flex items-center gap-1 font-medium text-cyan-700"><CircleDot className="size-3" />Needs triage</dd></div></dl><Separator className="my-4" /><div className="flex gap-2"><Button size="sm" className="flex-1 bg-slate-900 hover:bg-slate-800" onClick={() => notify(`${selectedAlert.id} escalated into a new case`)}>Escalate</Button><Button size="sm" variant="outline" onClick={dismissAlert}>Dismiss</Button></div></> : <div className="py-6 text-center text-sm text-slate-500">Select an alert to review.</div>}</CardContent></Card>

                <Card className="border-slate-200 bg-white shadow-none"><CardHeader className="flex-row items-center justify-between pb-3"><div><CardTitle className="text-base">Active cases</CardTitle><p className="mt-1 text-xs text-slate-500">Your team&apos;s investigations</p></div><Button variant="ghost" size="sm" className="text-xs text-cyan-700">View all</Button></CardHeader><CardContent className="space-y-3">{cases.map((item) => <button key={item.id} onClick={() => notify(`${item.id} opened in investigation view`)} className="flex w-full items-start gap-3 rounded-lg border border-slate-100 p-3 text-left hover:bg-slate-50"><div className="mt-1 size-2 rounded-full bg-orange-500" /><div className="min-w-0 flex-1"><div className="flex items-center gap-2"><p className="truncate text-xs font-semibold text-slate-800">{item.title}</p><Badge variant="outline" className={cn("ml-auto shrink-0 text-[10px]", severityStyles[item.severity])}>{item.severity}</Badge></div><p className="mt-1 text-[11px] text-slate-500">{item.id} · {item.state} · {item.updated}</p></div></button>)}</CardContent></Card>
              </div>
            </div>

            <Card className="border-slate-200 bg-white shadow-none"><CardHeader className="flex-row items-center justify-between pb-3"><div><CardTitle className="text-base">Response activity</CardTitle><p className="mt-1 text-xs text-slate-500">Recent changes across your workspace</p></div><Button variant="ghost" size="icon" aria-label="Open activity"><MoreHorizontal className="size-4 text-slate-500" /></Button></CardHeader><CardContent><div className="grid gap-4 md:grid-cols-3">{[["Maya Patel", "escalated ALT-1048 to CASE-208", "8 min ago", "bg-red-100 text-red-600"], ["Automation", "deduplicated 14 repeated signals", "24 min ago", "bg-cyan-100 text-cyan-600"], ["Noah Williams", "contained CASE-207", "34 min ago", "bg-emerald-100 text-emerald-600"]].map(([person, action, time, color]) => <div key={action} className="flex gap-3"><div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full", color)}>{person === "Automation" ? <Activity className="size-4" /> : <UserRound className="size-4" />}</div><div><p className="text-xs text-slate-700"><span className="font-semibold">{person}</span> {action}</p><p className="mt-1 text-[11px] text-slate-400">{time}</p></div></div>)}</div></CardContent></Card>

            <Card className="border-slate-200 bg-white shadow-none"><CardHeader className="flex-row items-start justify-between gap-4 pb-4"><div><div className="flex items-center gap-2"><CardTitle className="text-base">Playbook: JavaScript obfuscation</CardTitle><Badge variant="outline" className="border-violet-200 bg-violet-50 text-[10px] text-violet-700">Web threat</Badge></div><p className="mt-1 max-w-3xl text-xs leading-5 text-slate-500">Use this safe triage guide when scripts are intentionally made difficult to read. Obfuscation is not proof of compromise, but it can hide phishing, exploit, or web-shell behavior.</p></div><Button variant="outline" size="sm" className="shrink-0 gap-2" onClick={() => notify("Obfuscation playbook opened")}>Open playbook <ArrowRight className="size-3.5" /></Button></CardHeader><CardContent className="grid gap-3 md:grid-cols-3"><div className="rounded-lg border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-800">Signals to preserve</p><p className="mt-1 text-xs leading-5 text-slate-500">Base64 or hex escapes, eval wrappers, String.fromCharCode, heavy string concatenation, and unexpected script loaders.</p></div><div className="rounded-lg border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-800">First response</p><p className="mt-1 text-xs leading-5 text-slate-500">Capture the original file and URL, hash the artifact, record timestamps, and isolate the affected host before editing or decoding it.</p></div><div className="rounded-lg border border-slate-100 bg-slate-50 p-4"><p className="text-xs font-semibold text-slate-800">Analyst guardrail</p><p className="mt-1 text-xs leading-5 text-slate-500">Do not execute unknown code. Review in a sandbox, block confirmed malicious indicators, and escalate evidence with chain-of-custody notes.</p></div></CardContent></Card>
          </div>
        </section>
      </div>
      {toast && <div role="status" className="fixed bottom-5 right-5 flex items-center gap-3 rounded-lg bg-slate-900 px-4 py-3 text-sm text-white shadow-xl"><CheckCircle2 className="size-4 text-emerald-400" />{toast}<button onClick={() => setToast("")} aria-label="Close notification"><X className="size-4 text-slate-400" /></button></div>}
    </main>
  )
}

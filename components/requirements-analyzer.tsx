"use client"

import { useMemo, useState } from "react"
import {
  AlertCircle,
  ArrowUpRight,
  Check,
  ChevronDown,
  ClipboardCheck,
  FileText,
  FolderOpen,
  HelpCircle,
  LayoutDashboard,
  Plus,
  Search,
  Settings,
  Sparkles,
  Upload,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"

const starterText = `Bank accounts in Xero, including setting up and managing bank, credit card and loan accounts. Find guidance for connecting your bank, recording transactions, reconciling balances, fixing feed issues, and managing account transfers.`

const sections = [
  { label: "Getting started", count: "01" },
  { label: "Account transactions", count: "02" },
  { label: "Add an account", count: "03" },
  { label: "Balances & reconciliation", count: "04" },
  { label: "Bank connections", count: "05" },
  { label: "Money in and out", count: "06" },
  { label: "Loans & credit cards", count: "07" },
  { label: "Transfers & prepayments", count: "08" },
  { label: "Cheques & payments", count: "09" },
  { label: "Fix common issues", count: "10" },
  { label: "Trust accounts", count: "11" },
  { label: "All articles", count: "12" },
]

function GeneratedSpec({ source }: { source: string }) {
  const hasSource = source.trim().length > 0
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">Bank account guidance</p>
          <h2 className="font-serif text-3xl tracking-tight text-foreground">Bank accounts in Xero</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Guidance for setting up, managing, and troubleshooting your Xero bank, credit card, and loan accounts.</p>
        </div>
        <Button variant="outline" size="sm" className="shrink-0 gap-2 bg-background"><ClipboardCheck data-icon="inline-start" /> Copy spec</Button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-border/70 bg-card/70 shadow-none"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Confidence</p><p className="mt-1 text-2xl font-semibold">72%</p><p className="mt-1 text-xs text-emerald-700">Good starting point</p></CardContent></Card>
        <Card className="border-border/70 bg-card/70 shadow-none"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Open decisions</p><p className="mt-1 text-2xl font-semibold">06</p><p className="mt-1 text-xs text-amber-700">Need product input</p></CardContent></Card>
        <Card className="border-border/70 bg-card/70 shadow-none"><CardContent className="p-4"><p className="text-xs text-muted-foreground">Traceability</p><p className="mt-1 text-2xl font-semibold">100%</p><p className="mt-1 text-xs text-primary">Requirements mapped</p></CardContent></Card>
      </div>

      <Card className="border-border/70 shadow-none">
        <CardHeader className="border-b border-border/60 px-5 py-4"><CardTitle className="text-base">Requirement Summary</CardTitle></CardHeader>
        <CardContent className="px-5 py-5"><p className="text-[15px] leading-7 text-foreground/80">{hasSource ? "Manage the accounts your business uses in Xero, including bank accounts, credit cards, loans, petty cash, trust accounts, and the transactions recorded against them. Use the articles below to connect feeds, record money in and out, reconcile balances, and resolve common issues." : "Add product notes to generate a requirement summary."}</p></CardContent>
      </Card>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-border/70 shadow-none"><CardHeader className="px-5 pb-2 pt-5"><div className="flex items-center justify-between"><CardTitle className="text-base">Functional Requirements</CardTitle><Badge variant="secondary">04 confirmed</Badge></div></CardHeader><CardContent className="px-5 pb-5"><ul className="flex flex-col gap-3 text-sm leading-6 text-foreground/80"><li className="flex gap-3"><Check className="mt-1 text-emerald-600" data-icon="inline-start" />Accept product notes in a freeform input.</li><li className="flex gap-3"><Check className="mt-1 text-emerald-600" data-icon="inline-start" />Separate confirmed requirements from assumptions.</li><li className="flex gap-3"><Check className="mt-1 text-emerald-600" data-icon="inline-start" />Generate flows, technical requirements, and acceptance criteria.</li><li className="flex gap-3"><Check className="mt-1 text-emerald-600" data-icon="inline-start" />Highlight ambiguity and unresolved decisions.</li></ul></CardContent></Card>
        <Card className="border-border/70 shadow-none"><CardHeader className="px-5 pb-2 pt-5"><div className="flex items-center justify-between"><CardTitle className="text-base">Risks & Unknowns</CardTitle><Badge className="border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-50">05 to resolve</Badge></div></CardHeader><CardContent className="px-5 pb-5"><ul className="flex flex-col gap-3 text-sm leading-6 text-foreground/80"><li className="flex gap-3"><AlertCircle className="mt-1 text-amber-600" data-icon="inline-start" />What model or analysis service powers generation?</li><li className="flex gap-3"><AlertCircle className="mt-1 text-amber-600" data-icon="inline-start" />Should specifications be versioned and shared?</li><li className="flex gap-3"><AlertCircle className="mt-1 text-amber-600" data-icon="inline-start" />What permissions apply to projects and documents?</li><li className="flex gap-3"><AlertCircle className="mt-1 text-amber-600" data-icon="inline-start" />Which quantitative quality and performance targets matter?</li></ul></CardContent></Card>
      </div>
    </div>
  )
}

export function RequirementsAnalyzer() {
  const [input, setInput] = useState(starterText)
  const [activeSection, setActiveSection] = useState("Requirement Summary")
  const [generated, setGenerated] = useState(true)
  const wordCount = useMemo(() => input.trim() ? input.trim().split(/\s+/).length : 0, [input])

  return (
    <main className="min-h-screen bg-[#f7f8fa] text-foreground">
      <header className="flex h-16 items-center justify-between border-b border-border/70 bg-background px-5 lg:px-8">
        <div className="flex items-center gap-3"><div className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground"><Sparkles data-icon="inline-start" /></div><div><p className="font-semibold tracking-tight">Specwise</p><p className="hidden text-[11px] text-muted-foreground sm:block">Requirements analyst</p></div></div>
        <div className="flex items-center gap-2"><Button variant="ghost" size="sm" className="hidden gap-2 text-muted-foreground sm:flex"><HelpCircle data-icon="inline-start" /> Guide</Button><Button variant="outline" size="sm" className="gap-2 bg-background"><Upload data-icon="inline-start" /> Import notes</Button><div className="ml-2 flex size-8 items-center justify-center rounded-full bg-[#e6ecef] text-xs font-semibold text-[#31505a]">JD</div></div>
      </header>
      <div className="mx-auto flex max-w-[1500px]">
        <aside className="hidden w-60 shrink-0 border-r border-border/70 bg-background px-4 py-6 lg:block"><div className="mb-8 flex items-center justify-between px-2"><p className="text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Workspace</p><Button variant="ghost" size="icon" className="size-7"><Plus /></Button></div><nav className="flex flex-col gap-1"><Button variant="secondary" className="justify-start gap-3 font-medium"><LayoutDashboard data-icon="inline-start" /> Overview</Button><Button variant="ghost" className="justify-start gap-3 text-muted-foreground"><FileText data-icon="inline-start" /> Specifications <span className="ml-auto text-xs">12</span></Button><Button variant="ghost" className="justify-start gap-3 text-muted-foreground"><FolderOpen data-icon="inline-start" /> Projects</Button></nav><div className="mt-10 border-t border-border/60 pt-5"><p className="px-2 text-xs font-semibold uppercase tracking-[0.16em] text-muted-foreground">Recent</p><div className="mt-3 flex flex-col gap-1"><button className="rounded-lg px-2 py-2 text-left text-sm text-foreground/75 hover:bg-muted">Payments redesign</button><button className="rounded-lg px-2 py-2 text-left text-sm text-foreground/75 hover:bg-muted">Mobile onboarding</button><button className="rounded-lg px-2 py-2 text-left text-sm text-foreground/75 hover:bg-muted">Support inbox</button></div></div><div className="mt-auto flex flex-col gap-1 pt-20"><Button variant="ghost" className="justify-start gap-3 text-muted-foreground"><Settings data-icon="inline-start" /> Settings</Button></div></aside>
        <section className="min-w-0 flex-1 px-5 py-7 lg:px-10 lg:py-9"><div className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><div className="mb-3 flex items-center gap-2 text-xs text-muted-foreground"><span>Overview</span><span>/</span><span className="text-foreground">New analysis</span></div><h1 className="font-serif text-4xl tracking-tight lg:text-5xl">Bank accounts</h1><p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">Bank accounts in Xero, including setting up and managing bank, credit card and loan accounts.</p></div><Button variant="ghost" className="gap-2 text-muted-foreground"><Search data-icon="inline-start" /> Find a spec</Button></div>
          <div className="grid gap-8 xl:grid-cols-[minmax(340px,0.8fr)_minmax(520px,1.4fr)]"><div className="flex flex-col gap-4"><Card className="border-border/70 shadow-sm"><CardHeader className="flex-row items-center justify-between px-5 pb-3 pt-5"><div><CardTitle className="text-base">Source material</CardTitle><p className="mt-1 text-xs text-muted-foreground">Paste the context you want to analyze</p></div><Badge variant="outline">{wordCount} words</Badge></CardHeader><CardContent className="px-5 pb-5"><Textarea value={input} onChange={(event) => setInput(event.target.value)} className="min-h-[260px] resize-none border-border/70 bg-[#fbfcfd] text-sm leading-6 shadow-none focus-visible:ring-primary/30" placeholder="Paste product requirements, notes, or a user story..." aria-label="Source material"/><div className="mt-4 flex items-center justify-between gap-3"><p className="text-xs text-muted-foreground">Supports requirements, notes, screenshots, and API docs.</p><Button onClick={() => setGenerated(true)} className="gap-2"><Sparkles data-icon="inline-start" /> Analyze notes <ArrowUpRight data-icon="inline-end" /></Button></div></CardContent></Card><Card className="border-border/70 bg-[#eef5f3] shadow-none"><CardContent className="flex gap-3 p-4"><AlertCircle className="mt-0.5 shrink-0 text-[#2b7567]" /><div><p className="text-sm font-medium text-[#1c5148]">Keep the original intent intact</p><p className="mt-1 text-xs leading-5 text-[#42776e]">The analyst flags gaps instead of silently filling them in. Every output section stays traceable to your source.</p></div></CardContent></Card></div>
            <div className="min-w-0">{generated ? <GeneratedSpec source={input} /> : <Card className="flex min-h-[500px] items-center justify-center border-dashed border-border bg-transparent shadow-none"><CardContent className="text-center"><Sparkles className="mx-auto mb-3 text-muted-foreground" /><p className="font-medium">Your specification will appear here</p><p className="mt-1 text-sm text-muted-foreground">Analyze your notes to get started.</p></CardContent></Card>}</div></div>
          <div className="mt-10 border-t border-border/70 pt-6"><div className="mb-4 flex items-center justify-between"><div><p className="text-sm font-semibold">Specification outline</p><p className="mt-1 text-xs text-muted-foreground">Jump to any generated section</p></div><Button variant="ghost" size="sm" className="gap-2 text-muted-foreground"><ChevronDown data-icon="inline-start" /> Collapse all</Button></div><div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">{sections.map((section) => <button key={section.label} onClick={() => setActiveSection(section.label)} className={`flex items-center justify-between rounded-lg border px-3 py-3 text-left text-sm transition-colors ${activeSection === section.label ? "border-primary/40 bg-primary/5 text-primary" : "border-border/70 bg-background text-foreground/75 hover:border-primary/30"}`}><span className="flex items-center gap-2"><span className="font-mono text-[10px] text-muted-foreground">{section.count}</span>{section.label}</span><ArrowUpRight className="text-muted-foreground" /></button>)}</div></div>
        </section>
      </div>
    </main>
  )
}

export default RequirementsAnalyzer

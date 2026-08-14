"use client"

import { useMemo, useState } from "react"
import {
  Check,
  ChevronDown,
  ChevronRight,
  CircleDot,
  Clipboard,
  GitBranch,
  Github,
  Menu,
  Play,
  Search,
  ShieldCheck,
  Sparkles,
  Webhook,
  X,
} from "lucide-react"
import { cn } from "@/lib/utils"

const sections = [
  { id: "overview", label: "Overview" },
  { id: "github-apps", label: "GitHub Apps" },
  { id: "github-actions", label: "GitHub Actions" },
  { id: "choose", label: "Which should I use?" },
  { id: "workflow-demo", label: "Workflow demo" },
]

const actionYaml = `name: Deploy to production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm ci
      - run: npm run build
      - run: npm run deploy`

const appFlow = [
  { label: "Issue opened", detail: "GitHub sends a webhook", icon: Webhook },
  { label: "App authenticates", detail: "Short-lived installation token", icon: ShieldCheck },
  { label: "App responds", detail: "API request or comment", icon: Sparkles },
]

export function GithubDocs() {
  const [activeSection, setActiveSection] = useState("overview")
  const [mobileOpen, setMobileOpen] = useState(false)
  const [query, setQuery] = useState("")
  const [demo, setDemo] = useState<"actions" | "apps">("actions")
  const [copied, setCopied] = useState(false)

  const filteredSections = useMemo(
    () => sections.filter((section) => section.label.toLowerCase().includes(query.toLowerCase())),
    [query],
  )

  const jumpTo = (id: string) => {
    setActiveSection(id)
    setMobileOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  const copyYaml = async () => {
    await navigator.clipboard?.writeText(actionYaml)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-[1440px] items-center gap-4 px-5 lg:px-8">
          <button className="rounded-md p-2 hover:bg-muted lg:hidden" onClick={() => setMobileOpen(!mobileOpen)} aria-label="Toggle navigation">
            {mobileOpen ? <X /> : <Menu />}
          </button>
          <Github className="size-7 fill-foreground" aria-hidden="true" />
          <div className="flex items-baseline gap-2">
            <span className="font-mono text-sm font-semibold tracking-tight">github docs</span>
            <span className="hidden text-xs text-muted-foreground sm:inline">/ automation</span>
          </div>
          <div className="ml-auto hidden items-center gap-3 md:flex">
            <div className="flex h-9 w-64 items-center gap-2 rounded-md border border-border bg-muted/40 px-3 text-muted-foreground">
              <Search className="size-4" />
              <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search docs" className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground" aria-label="Search docs" />
              <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-[10px]">/</kbd>
            </div>
            <a href="#choose" className="text-sm text-muted-foreground hover:text-foreground">Guides</a>
            <a href="https://github.com" target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground">GitHub.com</a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-[1440px]">
        <aside className={cn("fixed inset-y-16 left-0 z-10 w-72 border-r border-border bg-background px-5 py-7 lg:sticky lg:top-16 lg:block lg:h-[calc(100vh-4rem)]", mobileOpen ? "block" : "hidden")}>
          <div className="mb-7 flex items-center justify-between">
            <div><p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Learning path</p><p className="mt-1 text-sm text-muted-foreground">Automation choices</p></div>
            <CircleDot className="size-4 text-primary" />
          </div>
          <nav aria-label="Documentation sections" className="flex flex-col gap-1">
            {filteredSections.map((section) => <button key={section.id} onClick={() => jumpTo(section.id)} className={cn("flex items-center justify-between rounded-md px-3 py-2.5 text-left text-sm transition-colors", activeSection === section.id ? "bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:bg-muted hover:text-foreground")}><span>{section.label}</span>{activeSection === section.id && <ChevronRight className="size-4" />}</button>)}
          </nav>
          <div className="mt-10 border-t border-border pt-6"><p className="text-xs font-semibold text-foreground">On this page</p><div className="mt-3 flex flex-col gap-2 text-xs text-muted-foreground"><a href="#differences">Key differences</a><a href="#comparison">Comparison table</a><a href="#workflow-demo">Try the demo</a></div></div>
        </aside>

        <main className="min-w-0 flex-1 px-5 py-10 sm:px-10 lg:px-20 lg:py-16">
          <div className="mx-auto max-w-4xl">
            <div id="overview" className="scroll-mt-28"><div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 font-mono text-xs font-semibold text-primary"><GitBranch className="size-3.5" /> Automation guide</div><h1 className="max-w-3xl text-balance text-4xl font-bold tracking-tight sm:text-5xl">GitHub Actions vs GitHub Apps</h1><p className="mt-5 max-w-2xl text-pretty text-lg leading-8 text-muted-foreground">Two powerful ways to automate your workflow. Learn what makes each one different, and choose the right tool for the job.</p></div>

            <section id="differences" className="mt-14 scroll-mt-28"><div className="grid gap-5 md:grid-cols-2"><article className="rounded-xl border border-border bg-card p-6"><div className="flex items-center gap-3"><div className="rounded-lg bg-primary/10 p-2.5 text-primary"><Webhook className="size-5" /></div><h2 className="text-xl font-semibold">GitHub Apps</h2></div><p className="mt-4 leading-7 text-muted-foreground">Persistent integrations that listen for events and act through the GitHub API on behalf of an installation.</p><ul className="mt-6 flex flex-col gap-3 text-sm"><li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />React to events in near real time</li><li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />Use fine-grained permissions</li><li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />Run on infrastructure you control</li></ul></article><article className="rounded-xl border border-border bg-card p-6"><div className="flex items-center gap-3"><div className="rounded-lg bg-secondary p-2.5 text-secondary-foreground"><Play className="size-5" /></div><h2 className="text-xl font-semibold">GitHub Actions</h2></div><p className="mt-4 leading-7 text-muted-foreground">Event-driven automation that runs jobs on hosted or self-hosted runners, right alongside your repository.</p><ul className="mt-6 flex flex-col gap-3 text-sm"><li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />Build CI/CD pipelines in YAML</li><li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />Access a clone of your repository</li><li className="flex gap-2"><Check className="mt-0.5 size-4 shrink-0 text-primary" />Use secrets without managing a server</li></ul></article></div></section>

            <section id="github-apps" className="mt-16 scroll-mt-28"><p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">01 · GitHub Apps</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Built for always-on integrations</h2><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Apps are a great fit when your product needs to persist data, respond quickly to webhooks, or work across many repositories and organizations.</p><div className="mt-7 flex flex-col gap-3">{appFlow.map((item, index) => <div key={item.label} className="flex items-center gap-4 rounded-lg border border-border p-4"><div className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground font-mono text-sm">{index + 1}</div><item.icon className="size-5 text-primary" /><div><p className="font-semibold">{item.label}</p><p className="text-sm text-muted-foreground">{item.detail}</p></div></div>)}</div></section>

            <section id="github-actions" className="mt-16 scroll-mt-28"><p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">02 · GitHub Actions</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Ship automation with your code</h2><p className="mt-4 max-w-2xl leading-7 text-muted-foreground">Actions bring automation directly into your repository. Define a workflow, commit it to <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-sm">.github/workflows</code>, and GitHub runs it for you.</p><div className="mt-7 overflow-hidden rounded-xl border border-border bg-card"><div className="flex items-center justify-between border-b border-border px-4 py-3"><div className="flex items-center gap-2 text-sm font-medium"><span className="size-2 rounded-full bg-primary" />deploy.yml</div><button onClick={copyYaml} className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground" aria-label="Copy workflow YAML">{copied ? <Check className="size-4 text-primary" /> : <Clipboard className="size-4" />}{copied ? "Copied" : "Copy"}</button></div><pre className="overflow-x-auto p-5 font-mono text-xs leading-6 text-muted-foreground"><code>{actionYaml}</code></pre></div></section>

            <section id="choose" className="mt-16 scroll-mt-28"><p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Decision guide</p><h2 className="mt-3 text-3xl font-bold tracking-tight">Which should I use?</h2><div id="comparison" className="mt-7 overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[600px] text-left text-sm"><thead className="bg-muted/60"><tr><th className="px-5 py-4 font-semibold">Use case</th><th className="px-5 py-4 font-semibold text-primary">GitHub Apps</th><th className="px-5 py-4 font-semibold">GitHub Actions</th></tr></thead><tbody className="divide-y divide-border">{[["Persistent data", "Best fit", "Limited to runs"],["CI/CD and releases", "Possible", "Best fit"],["Fast event responses", "Best fit", "Queued jobs"],["Repository access", "API requests", "Full checkout"],["Infrastructure", "You provide it", "GitHub provides runners"]].map((row) => <tr key={row[0]}><td className="px-5 py-4 font-medium">{row[0]}</td><td className="px-5 py-4 text-muted-foreground">{row[1]}</td><td className="px-5 py-4 text-muted-foreground">{row[2]}</td></tr>)}</tbody></table></div></section>

            <section id="workflow-demo" className="mt-16 scroll-mt-28 rounded-xl border border-border bg-card p-6 sm:p-8"><div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start"><div><p className="font-mono text-xs font-bold uppercase tracking-widest text-primary">Interactive demo</p><h2 className="mt-3 text-3xl font-bold tracking-tight">See the workflow in motion</h2><p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">Switch between the two automation models to compare how an event becomes an action.</p></div><div className="flex rounded-lg border border-border bg-background p-1" role="tablist" aria-label="Automation model"><button onClick={() => setDemo("actions")} role="tab" aria-selected={demo === "actions"} className={cn("rounded-md px-3 py-2 text-sm font-medium", demo === "actions" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Actions</button><button onClick={() => setDemo("apps")} role="tab" aria-selected={demo === "apps"} className={cn("rounded-md px-3 py-2 text-sm font-medium", demo === "apps" ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>Apps</button></div></div><div className="mt-8 rounded-lg border border-border bg-background p-5"><div className="flex items-center gap-3 text-sm font-semibold"><div className="size-2.5 rounded-full bg-primary" />{demo === "actions" ? "push to main" : "issues.opened"}<span className="ml-auto font-mono text-xs text-muted-foreground">{demo === "actions" ? "workflow run #1842" : "installation #9281"}</span></div><div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">{(demo === "actions" ? ["Event received", "Runner provisioned", "Build & deploy"] : ["Webhook received", "Token generated", "API request sent"]).map((step, index) => <div key={step} className="flex flex-1 items-center gap-3"><div className={cn("flex size-8 shrink-0 items-center justify-center rounded-full font-mono text-xs", index < 2 ? "bg-primary text-primary-foreground" : "border border-primary text-primary")}>{index < 2 ? <Check className="size-4" /> : index + 1}</div><span className="text-sm font-medium">{step}</span>{index < 2 && <ChevronDown className="ml-auto size-4 text-muted-foreground sm:hidden" />}{index < 2 && <div className="hidden h-px flex-1 bg-border sm:block" />}</div>)}</div><div className="mt-6 flex items-center gap-2 border-t border-border pt-4 text-xs text-muted-foreground"><span className="size-1.5 rounded-full bg-primary" />{demo === "actions" ? "Completed in 2m 14s on ubuntu-latest" : "Responded in 184ms via GitHub API"}</div></div></section>
          </div>
        </main>
      </div>
    </div>
  )
}

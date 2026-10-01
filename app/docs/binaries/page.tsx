import Link from "next/link"
import { ArrowUpRight, ChevronRight, Command, Cpu, FileCode2, ShieldCheck, Terminal } from "lucide-react"

const tools = [
  {
    category: "MLAB",
    title: "mlab CLI",
    description: "The official command-line client for mlab.sh and vuln.mlab.sh — scan domains, look up IPs, analyse files and query the CVE database from your terminal.",
    language: "Rust",
    latest: "v0.1.0",
    href: "/docs/binaries/mlab",
    icon: Terminal,
    accent: "bg-primary/12 text-primary",
  },
  {
    category: "SCAN",
    title: "postmortem",
    description: "Offline static dependency scanner for Node.js, Python, Rust, Ruby, PHP, Go and JVM projects that flags supply-chain compromise patterns in your lockfile graph.",
    language: "Rust",
    latest: "v1.1.0",
    href: "/docs/binaries/postmortem",
    icon: ShieldCheck,
    accent: "bg-amber-500/12 text-amber-400",
  },
  {
    category: "AI",
    title: "assay",
    description: "Offline scanner for ML model artifacts — safetensors, GGUF and PyTorch pickle — checking provenance, integrity and format-level safety.",
    language: "Rust",
    latest: "crates.io",
    href: "/docs/binaries/assay",
    icon: Cpu,
    accent: "bg-violet-500/12 text-violet-400",
  },
]

export default function BinariesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 lg:px-8">
          <Link href="/" className="flex items-center gap-2 text-sm font-semibold tracking-tight">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Command aria-hidden="true" />
            </span>
            bankchase <span className="font-normal text-muted-foreground">/ docs</span>
          </Link>
          <Link href="/" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
            Back to dashboard
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 lg:grid-cols-[180px_minmax(0,1fr)] lg:px-8 lg:py-16">
        <aside className="hidden lg:block">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">On this page</p>
          <nav className="flex flex-col gap-3 border-l border-border pl-4 text-sm">
            <a className="text-foreground" href="#mlab">MLAB</a>
            <a className="text-muted-foreground hover:text-foreground" href="#scan">SCAN</a>
            <a className="text-muted-foreground hover:text-foreground" href="#ai">AI</a>
            <a className="text-muted-foreground hover:text-foreground" href="#at-a-glance">At a glance</a>
          </nav>
        </aside>

        <article className="min-w-0">
          <div className="mb-12 max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/8 px-3 py-1.5 text-xs font-medium text-primary">
              <FileCode2 aria-hidden="true" /> Developer tools
            </div>
            <h1 className="text-4xl font-semibold tracking-[-0.04em] sm:text-5xl">Binaries</h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Standalone command-line tools for the mlab stack, grouped into three focused families. Install from Homebrew or grab a prebuilt release, then drive mlab from your terminal or CI.
            </p>
          </div>

          <div className="flex flex-col gap-12">
            {tools.map((tool) => {
              const Icon = tool.icon
              return (
                <section key={tool.category} id={tool.category.toLowerCase()} className="scroll-mt-24">
                  <div className="mb-4 flex items-center gap-3">
                    <span className="text-xs font-bold tracking-[0.2em] text-muted-foreground">{tool.category}</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>
                  <Link href={tool.href} className="group block rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/45 hover:bg-card/80 sm:p-7">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-4">
                        <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${tool.accent}`}>
                          <Icon aria-hidden="true" />
                        </span>
                        <div>
                          <h2 className="text-xl font-semibold tracking-tight">{tool.title}</h2>
                          <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">{tool.description}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-primary" aria-hidden="true" />
                    </div>
                    <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-t border-border pt-4 text-sm">
                      <span><span className="text-muted-foreground">Language</span> <span className="ml-2 font-medium">{tool.language}</span></span>
                      <span><span className="text-muted-foreground">Latest</span> <span className="ml-2 font-medium">{tool.latest}</span></span>
                      <span className="ml-auto hidden items-center gap-1 text-primary sm:flex">Read docs <ChevronRight aria-hidden="true" /></span>
                    </div>
                  </Link>
                </section>
              )
            })}
          </div>

          <section id="at-a-glance" className="mt-16 scroll-mt-24">
            <div className="mb-4 flex items-center gap-3">
              <h2 className="text-2xl font-semibold tracking-tight">At a glance</h2>
              <div className="h-px flex-1 bg-border" />
            </div>
            <div className="overflow-x-auto rounded-2xl border border-border bg-card">
              <table className="w-full min-w-[680px] text-left text-sm">
                <thead className="border-b border-border text-muted-foreground">
                  <tr><th className="px-5 py-4 font-medium">Tool</th><th className="px-5 py-4 font-medium">Category</th><th className="px-5 py-4 font-medium">Purpose</th><th className="px-5 py-4 font-medium">Language</th><th className="px-5 py-4 font-medium">Latest</th></tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {tools.map((tool) => <tr key={tool.title} className="transition-colors hover:bg-muted/30"><td className="px-5 py-4 font-medium text-primary"><Link href={tool.href}>{tool.title}</Link></td><td className="px-5 py-4 text-muted-foreground">{tool.category}</td><td className="max-w-sm px-5 py-4 text-muted-foreground">{tool.description.split(" — ")[0]}</td><td className="px-5 py-4">{tool.language}</td><td className="px-5 py-4">{tool.latest}</td></tr>)}
                </tbody>
              </table>
            </div>
          </section>
        </article>
      </div>
    </main>
  )
}

export const metadata = {
  title: "Binaries · bankchase docs",
  description: "Standalone command-line tools for the mlab stack.",
}

export const dynamic = "force-static"
export const revalidate = false
export const preferredRegion = "home"
export const runtime = "nodejs"
export const fetchCache = "force-cache"
export const maxDuration = 10
export const dynamicParams = false

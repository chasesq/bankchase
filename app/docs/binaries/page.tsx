import Link from "next/link"
import { ArrowLeft, ArrowUpRight, Box, BrainCircuit, Check, Code2, Download, Package, ShieldCheck } from "lucide-react"

const tools = [
  {
    name: "mlab",
    category: "MLAB",
    href: "/docs/binaries/mlab",
    icon: Code2,
    purpose: "Official CLI for the mlab.sh threat-intelligence platform",
    language: "Rust",
    latest: "v0.1.0",
    description:
      "Scan domains, look up IPs, analyse files and query the CVE database from your terminal.",
  },
  {
    name: "postmortem",
    category: "SCAN",
    href: "/docs/binaries/postmortem",
    icon: ShieldCheck,
    purpose: "Offline supply-chain dependency scanner",
    language: "Rust",
    latest: "v1.1.0",
    description:
      "Flag supply-chain compromise patterns across Node.js, Python, Rust, Ruby, PHP, Go and JVM projects.",
  },
  {
    name: "assay",
    category: "AI",
    href: "/docs/binaries/assay",
    icon: BrainCircuit,
    purpose: "Offline scanner for ML model artifacts",
    language: "Rust",
    latest: "crates.io",
    description:
      "Check safetensors, GGUF and PyTorch pickle files for provenance, integrity and format-level safety.",
  },
]

const groups = [
  { id: "mlab", label: "MLAB", description: "Platform command-line tools", icon: Code2, tools: [tools[0]] },
  { id: "scan", label: "SCAN", description: "Supply-chain scanners", icon: ShieldCheck, tools: [tools[1]] },
  { id: "ai", label: "AI", description: "Model-artifact tooling", icon: BrainCircuit, tools: [tools[2]] },
]

export default function BinariesPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border/70 bg-background/95">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5 lg:px-8">
          <Link href="/" className="flex items-center gap-3 font-semibold tracking-tight">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary text-primary-foreground">
              <Package aria-hidden="true" />
            </span>
            <span>BankChase <span className="font-normal text-muted-foreground">/ docs</span></span>
          </Link>
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
            <ArrowLeft aria-hidden="true" />
            Back to banking
          </Link>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-12 px-5 py-12 lg:grid-cols-[180px_minmax(0,1fr)] lg:px-8 lg:py-20">
        <aside className="hidden lg:block">
          <p className="mb-4 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">On this page</p>
          <nav className="flex flex-col gap-3 border-l border-border pl-4 text-sm">
            <a href="#mlab" className="text-muted-foreground transition-colors hover:text-foreground">MLAB</a>
            <a href="#scan" className="text-muted-foreground transition-colors hover:text-foreground">SCAN</a>
            <a href="#ai" className="text-muted-foreground transition-colors hover:text-foreground">AI</a>
            <a href="#at-a-glance" className="text-muted-foreground transition-colors hover:text-foreground">At a glance</a>
          </nav>
        </aside>

        <article className="min-w-0 max-w-4xl">
          <div className="mb-12 max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary">
              <Download aria-hidden="true" /> Developer tools
            </div>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">Binaries</h1>
            <p className="mt-5 text-lg leading-8 text-muted-foreground">
              Standalone command-line tools for the mlab stack, grouped into three focused families. Install from Homebrew or grab a prebuilt release, then drive mlab from your terminal or CI.
            </p>
          </div>

          <div className="flex flex-col gap-10">
            {groups.map((group) => {
              const GroupIcon = group.icon
              const tool = group.tools[0]
              const ToolIcon = tool.icon
              return (
                <section key={group.id} id={group.id} className="scroll-mt-8">
                  <div className="mb-4 flex items-end justify-between gap-4">
                    <div>
                      <div className="mb-2 flex items-center gap-2 text-primary"><GroupIcon aria-hidden="true" /><span className="text-sm font-semibold uppercase tracking-[0.18em]">{group.label}</span></div>
                      <p className="text-sm text-muted-foreground">{group.description}</p>
                    </div>
                  </div>
                  <Link href={tool.href} className="group block rounded-2xl border border-border bg-card p-6 transition-colors hover:border-primary/50 hover:bg-muted/30">
                    <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
                      <div className="flex gap-4">
                        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary"><ToolIcon aria-hidden="true" /></div>
                        <div>
                          <h2 className="text-xl font-semibold">{tool.name}</h2>
                          <p className="mt-2 max-w-2xl leading-7 text-muted-foreground">{tool.description}</p>
                        </div>
                      </div>
                      <ArrowUpRight className="shrink-0 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden="true" />
                    </div>
                    <div className="mt-6 flex flex-wrap gap-2 text-xs">
                      <span className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground">{tool.language}</span>
                      <span className="rounded-md bg-muted px-2.5 py-1 text-muted-foreground">Latest {tool.latest}</span>
                    </div>
                  </Link>
                </section>
              )
            })}
          </div>

          <section id="at-a-glance" className="mt-16 scroll-mt-8">
            <div className="mb-5 flex items-center gap-3"><Box className="text-primary" aria-hidden="true" /><h2 className="text-2xl font-semibold">At a glance</h2></div>
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-left text-sm">
                  <thead className="border-b border-border bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
                    <tr><th className="px-5 py-4 font-medium">Tool</th><th className="px-5 py-4 font-medium">Category</th><th className="px-5 py-4 font-medium">Purpose</th><th className="px-5 py-4 font-medium">Language</th><th className="px-5 py-4 font-medium">Latest</th></tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {tools.map((tool) => <tr key={tool.name} className="align-top"><td className="px-5 py-4 font-semibold text-primary">{tool.name}</td><td className="px-5 py-4 text-muted-foreground">{tool.category}</td><td className="max-w-sm px-5 py-4 text-muted-foreground">{tool.purpose}</td><td className="px-5 py-4 text-muted-foreground">{tool.language}</td><td className="px-5 py-4 text-muted-foreground">{tool.latest}</td></tr>)}
                  </tbody>
                </table>
              </div>
            </div>
            <p className="mt-5 flex items-center gap-2 text-sm text-muted-foreground"><Check className="text-primary" aria-hidden="true" /> Offline-first tooling for safer releases.</p>
          </section>
        </article>
      </div>
    </main>
  )
}

"use client"

import { useState } from "react"
import {
  ArrowRight,
  BookOpen,
  Check,
  CircleHelp,
  Copy,
  ExternalLink,
  Github,
  Menu,
  Network,
  Play,
  Server,
  ShieldCheck,
  Terminal,
  X,
} from "lucide-react"

const navItems = ["Overview", "Quickstart", "API reference", "MCP server", "Agent quickstart"]
const stacks = ["OpenAI Agents", "Claude", "LangGraph", "CrewAI", "Vercel AI SDK", "Cursor", "Mastra", "Pydantic AI", "LlamaIndex"]

function CopyButton({ value, label = "Copy" }: { value: string; label?: string }) {
  const [copied, setCopied] = useState(false)
  const copy = async () => {
    await navigator.clipboard.writeText(value)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }
  return (
    <button onClick={copy} className="copy-button" aria-label={`${label} code`} type="button">
      {copied ? <Check size={14} /> : <Copy size={14} />}
      <span>{copied ? "Copied" : label}</span>
    </button>
  )
}

function CodeBlock({ children, copyValue }: { children: React.ReactNode; copyValue: string }) {
  return (
    <div className="code-block">
      <div className="code-block-top"><span className="code-dots"><i /><i /><i /></span><CopyButton value={copyValue} /></div>
      <pre><code>{children}</code></pre>
    </div>
  )
}

export default function Home() {
  const [menuOpen, setMenuOpen] = useState(false)
  const [activeNav, setActiveNav] = useState("Overview")

  const scrollTo = (id: string, label: string) => {
    setActiveNav(label)
    setMenuOpen(false)
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" })
  }

  return (
    <div className="docs-shell">
      <header className="site-header">
        <a className="brand" href="#top" aria-label="B2A home">
          <span className="brand-mark">2A</span><span>bluepillow</span><span className="brand-slash">/</span><span className="brand-muted">docs</span>
        </a>
        <nav className={`main-nav ${menuOpen ? "is-open" : ""}`} aria-label="Main navigation">
          {navItems.map((item) => (
            <button key={item} className={activeNav === item ? "active" : ""} onClick={() => scrollTo(item === "Overview" ? "top" : item.toLowerCase().replaceAll(" ", "-"), item)}>{item}</button>
          ))}
        </nav>
        <div className="header-actions"><a className="github-link" href="https://github.com" target="_blank" rel="noreferrer"><Github size={16} /> GitHub</a><a className="header-cta" href="#quickstart">Make a request <ArrowRight size={15} /></a></div>
        <button className="menu-button" onClick={() => setMenuOpen(!menuOpen)} aria-label={menuOpen ? "Close menu" : "Open menu"} type="button">{menuOpen ? <X /> : <Menu />}</button>
      </header>

      <div className="docs-layout" id="top">
        <aside className="side-nav">
          <div className="side-label">Documentation</div>
          <button className="side-active" onClick={() => scrollTo("top", "Overview")}><span className="side-dot" />Overview</button>
          <div className="side-group"><span>Get started</span><button onClick={() => scrollTo("quickstart", "Quickstart")}>Quickstart</button><button onClick={() => scrollTo("auth", "Authentication")}>Authentication</button></div>
          <div className="side-group"><span>Reference</span><button onClick={() => scrollTo("api-reference", "API reference")}>API reference <span className="side-count">8</span></button><button onClick={() => scrollTo("mcp-server", "MCP server")}>MCP server</button><button onClick={() => scrollTo("base-urls", "Base URLs")}>Base URLs</button></div>
          <div className="side-group"><span>Guides</span><button onClick={() => scrollTo("agent-quickstart", "Agent quickstart")}>Agent quickstart</button><button onClick={() => scrollTo("rate-limits", "Rate limits")}>Rate limits</button></div>
          <div className="side-bottom"><a href="mailto:hello@bluepillow.com"><CircleHelp size={15} /> Help center</a><a href="https://status.bluepillow.com"><Network size={15} /> API status <span className="status-dot" /></a></div>
        </aside>

        <main className="docs-content">
          <div className="eyebrow"><span className="eyebrow-line" /> B2A API <span className="version-pill">v1</span></div>
          <section className="hero-section">
            <h1>Booking access<br /><em>for AI agents.</em></h1>
            <p className="hero-copy">One REST endpoint, one MCP server, and copy-paste snippets for the nine most common agent stacks. No signup, no waitlist.</p>
            <div className="hero-actions"><a className="primary-button" href="#quickstart">Start building <ArrowRight size={16} /></a><a className="text-link" href="#api-reference">Explore the API <ExternalLink size={15} /></a></div>
          </section>

          <section className="start-grid" aria-labelledby="where-to-start"><div className="section-kicker" id="where-to-start">Where to start</div><div className="start-cards"><button onClick={() => scrollTo("quickstart", "Quickstart")}><span className="card-icon orange"><Play size={17} fill="currentColor" /></span><span><strong>Quickstart</strong><small>First request in under 5 minutes.</small></span><ArrowRight size={17} /></button><button onClick={() => scrollTo("api-reference", "API reference")}><span className="card-icon blue"><BookOpen size={17} /></span><span><strong>API reference</strong><small>Eight endpoints aligned to OpenAPI.</small></span><ArrowRight size={17} /></button><button onClick={() => scrollTo("mcp-server", "MCP server")}><span className="card-icon purple"><Server size={17} /></span><span><strong>MCP server</strong><small>Connect Claude Code, Cursor, or any MCP agent.</small></span><ArrowRight size={17} /></button><button onClick={() => scrollTo("agent-quickstart", "Agent quickstart")}><span className="card-icon green"><Terminal size={17} /></span><span><strong>Agent quickstart</strong><small>Configs for the stacks you already use.</small></span><ArrowRight size={17} /></button></div></section>

          <section className="content-section" id="quickstart"><div className="section-heading"><span className="number">01</span><div><h2>Quickstart</h2><p>Your agent can make its first booking search in three lines.</p></div></div><CodeBlock copyValue={`curl https://api.b2a.bluepillow.com/v1/search \\\n  -H "Authorization: Bearer $B2A_KEY" \\\n  -d '{"destination":"Austin","check_in":"2026-11-12","check_out":"2026-11-15"}'`}><span className="code-comment"># Search available stays</span>{"\n"}<span className="code-keyword">curl</span> https://api.b2a.bluepillow.com/v1/search \{ "\n  "}<span className="code-flag">-H</span> <span className="code-string">&quot;Authorization: Bearer $B2A_KEY&quot;</span> \{ "\n  "}<span className="code-flag">-d</span> <span className="code-string">{'{'}&quot;destination&quot;:&quot;Austin&quot;,&quot;check_in&quot;:&quot;2026-11-12&quot;,&quot;check_out&quot;:&quot;2026-11-15&quot;{'}'}</span></CodeBlock></section>

          <section className="content-section" id="base-urls"><div className="section-heading"><span className="number">02</span><div><h2>Base URLs</h2><p>Use the REST API for direct calls, or connect over HTTP with MCP.</p></div></div><div className="url-list"><div><span className="url-label"><span className="url-dot blue-dot" />REST</span><code>https://api.b2a.bluepillow.com/v1</code><CopyButton value="https://api.b2a.bluepillow.com/v1" /></div><div><span className="url-label"><span className="url-dot purple-dot" />MCP <small>HTTP</small></span><code>https://mcp.b2a.bluepillow.com/</code><CopyButton value="https://mcp.b2a.bluepillow.com/" /></div><div><span className="url-label"><span className="url-dot gray-dot" />OpenAPI</span><code>/openapi.json</code><a href="https://api.b2a.bluepillow.com/v1/openapi.json" className="open-link">Open <ExternalLink size={13} /></a></div></div></section>

          <section className="content-section" id="auth"><div className="section-heading"><span className="number">03</span><div><h2>Authentication</h2><p>Anonymous keys are issued on demand and persist in your browser.</p></div></div><div className="auth-callout"><ShieldCheck size={22} /><div><strong>Bearer-token authentication</strong><p>Request an anonymous key with <code>POST /v1/keys</code>, then include it in every request. No account or signup required.</p><div className="auth-meta"><span>120 req/min</span><span>60,000 req/day</span><span>Stored in localStorage</span></div></div></div></section>

          <section className="content-section" id="api-reference"><div className="section-heading"><span className="number">04</span><div><h2>API reference</h2><p>Eight focused endpoints, predictable responses, and a live OpenAPI contract.</p></div></div><div className="endpoint-table"><div className="endpoint-row header"><span>Method</span><span>Path</span><span>Description</span></div>{[["POST","/keys","Issue an anonymous API key"],["GET","/search","Search available stays"],["GET","/stays/:id","Get stay details"],["POST","/holds","Place a temporary hold"]].map(([method,path,desc]) => <div className="endpoint-row" key={path}><span className={`method ${method.toLowerCase()}`}>{method}</span><code>{path}</code><span>{desc}</span></div>)}<a href="#api-reference" className="view-all">View all endpoints <ArrowRight size={14} /></a></div></section>

          <section className="content-section" id="mcp-server"><div className="section-heading"><span className="number">05</span><div><h2>MCP server</h2><p>Give any MCP-aware agent direct access to booking tools.</p></div></div><CodeBlock copyValue={`{\n  "mcpServers": {\n    "bluepillow": {\n      "url": "https://mcp.b2a.bluepillow.com/"\n    }\n  }\n}`}><pre>{`{\n  "mcpServers": {\n    "bluepillow": {\n      "url": "https://mcp.b2a.bluepillow.com/"\n    }\n  }\n}`}</pre></CodeBlock></section>

          <section className="content-section stack-section" id="agent-quickstart"><div className="section-heading"><span className="number">06</span><div><h2>Agent quickstart</h2><p>Copy a config for your stack and make your first tool call.</p></div></div><div className="stack-grid">{stacks.map((stack, i) => <button key={stack} className="stack-card"><span className={`stack-logo logo-${i % 4}`}>{stack.split(" ").map((word) => word[0]).join("").slice(0, 2)}</span><span>{stack}</span><ArrowRight size={15} /></button>)}</div></section>

          <section className="docs-footer"><div><span className="brand-mark small">2A</span><strong>Ready when your agent is.</strong></div><a className="primary-button" href="#quickstart">Make a request <ArrowRight size={16} /></a></section>
        </main>
      </div>
      <footer className="site-footer"><span>© 2026 bluepillow</span><span>Built for agents, by bluepillow.</span><span><a href="#top">Documentation</a><a href="mailto:hello@bluepillow.com">Contact</a></span></footer>
    </div>
  )
}


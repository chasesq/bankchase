import Link from "next/link"
import { AlertTriangle, ArrowUpRight, CheckCircle2, ShieldCheck } from "lucide-react"

const reportLinks = [
  { label: "FBI Internet Crime Complaint Center", href: "https://www.ic3.gov/" },
  { label: "Federal Trade Commission", href: "https://reportfraud.ftc.gov/" },
  { label: "FDIC Consumer Protection", href: "https://www.fdic.gov/consumer-resource-center" },
]

export default function SecurityPage() {
  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex max-w-5xl flex-col gap-8">
        <header className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-10">
          <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <ShieldCheck aria-hidden="true" className="size-7" />
          </div>
          <div className="flex flex-col gap-3">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Security & scam awareness</p>
            <h1 className="max-w-3xl text-balance text-3xl font-semibold tracking-tight sm:text-5xl">
              There is no legitimate “flash alert” for bank funds.
            </h1>
            <p className="max-w-2xl text-pretty leading-7 text-muted-foreground">
              No app, link, or hack can make a Chase or other U.S. bank send a real balance alert. Only the bank can confirm that actual funds have reached an account.
            </p>
          </div>
        </header>

        <section className="grid gap-5 md:grid-cols-2" aria-label="Scam warnings">
          <article className="flex flex-col gap-4 rounded-2xl border border-destructive/30 bg-destructive/5 p-6">
            <div className="flex items-center gap-3">
              <AlertTriangle aria-hidden="true" className="size-5 text-destructive" />
              <h2 className="text-xl font-semibold">Warning signs</h2>
            </div>
            <ul className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
              <li>Someone asks you to use a “flash alert app” as proof of funds.</li>
              <li>A social media, Telegram, or WhatsApp contact sends a fake receipt or balance screenshot.</li>
              <li>A website asks for bank credentials, one-time codes, or remote access.</li>
            </ul>
          </article>

          <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 aria-hidden="true" className="size-5 text-primary" />
              <h2 className="text-xl font-semibold">How real funds arrive</h2>
            </div>
            <ul className="flex flex-col gap-3 text-sm leading-6 text-muted-foreground">
              <li>Use the official bank app downloaded from the Apple App Store or Google Play Store.</li>
              <li>Send actual funds through Zelle® or a standard wire transfer.</li>
              <li>When a transfer posts, the bank—not a third-party app—controls the real notification.</li>
            </ul>
          </article>
        </section>

        <section className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6 sm:p-8">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-semibold">Report suspected fraud</h2>
            <p className="leading-7 text-muted-foreground">
              Do not click suspicious links or share credentials. Contact your bank through the number on your card or its official app, then report the incident through an official agency.
            </p>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            {reportLinks.map((item) => (
              <a key={item.href} href={item.href} target="_blank" rel="noreferrer" className="flex items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-muted">
                <span>{item.label}</span>
                <ArrowUpRight aria-hidden="true" className="size-4 shrink-0 text-primary" />
              </a>
            ))}
          </div>
        </section>

        <Link href="/accounts" className="text-sm font-medium text-primary underline-offset-4 hover:underline">Return to your accounts</Link>
      </div>
    </main>
  )
}

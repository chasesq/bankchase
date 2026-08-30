'use client'

import { MercuryDemoCustomizer } from '@/components/mercury-demo-customizer'

export default function DemoPage() {
  return <main className="min-h-svh bg-background px-6 py-12 text-foreground"><div className="mx-auto flex max-w-3xl flex-col gap-8"><div><p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Mercury demo</p><h1 className="mt-3 text-4xl font-semibold tracking-tight text-balance sm:text-6xl">A banking experience shaped around your business.</h1><p className="mt-4 max-w-2xl text-lg leading-8 text-muted-foreground">Tell us what matters most and we&apos;ll build a guided demo around your priorities.</p></div><div className="max-w-xl"><MercuryDemoCustomizer open onOpenChange={() => {}} /></div></div></main>
}

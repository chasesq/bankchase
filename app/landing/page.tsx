'use client'

import { Navigation } from '@/components/Navigation'
import { LandingFeatures } from '@/components/landing-features'
import { BankingFeatures } from '@/components/features-section'
import { FeaturesGrid } from '@/components/features-grid'
import { FeaturesWithImage } from '@/components/features-with-image'
import { FeaturesAlternating } from '@/components/features-alternating'
import Link from 'next/link'
import { ArrowRight, CheckCircle, ExternalLink } from 'lucide-react'

export default function LandingPage() {

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      {/* Hero Section */}
      <section className="relative px-6 pt-20 pb-24 sm:pt-32 sm:pb-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h1 className="text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
            Banking Reimagined
          </h1>
          <p className="mt-6 text-lg leading-8 text-muted-foreground">
            Modern banking without the complexity. Send money instantly, manage cards with ease, and control your finances with real-time notifications.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/signup">
              <button className="rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition flex items-center gap-2">
                Get Started
                <ArrowRight className="w-4 h-4" />
              </button>
            </Link>
            <Link href="/login">
              <button className="text-sm font-semibold leading-6 text-foreground hover:text-primary transition">
                Sign In <span aria-hidden="true">→</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <LandingFeatures />

      {/* Features Grid with Icons */}
      <FeaturesGrid />

      {/* Two Column Features with Image */}
      <FeaturesWithImage />

      {/* Alternating Features */}
      <FeaturesAlternating />

      {/* Advanced Features Section */}
      <BankingFeatures />

      {/* Benefits Section */}
      <section className="py-24 sm:py-32 bg-card/50">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl">
            <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl mb-12">
              Why choose BankChase?
            </h2>

            <div className="space-y-6">
              {[
                'Instant money transfers with real-time balance updates',
                'Military-grade security with 256-bit encryption',
                'Zero fees on domestic transfers and basic accounts',
                'Mobile-first design for banking on the go',
                '24/7 customer support with live chat',
                'AI-powered spending insights and budgeting tools',
              ].map((benefit, index) => (
                <div key={index} className="flex gap-x-3">
                  <CheckCircle className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  <p className="text-base text-foreground">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative px-6 py-24 sm:py-32 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="text-4xl font-bold tracking-tight text-foreground">
            Ready to get started?
          </h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Join thousands of users who trust BankChase for their banking needs.
          </p>
          <div className="mt-10 flex items-center justify-center gap-x-6">
            <Link href="/signup">
              <button className="rounded-md bg-primary px-8 py-3 text-sm font-semibold text-primary-foreground shadow-sm hover:bg-primary/90 transition">
                Create Account
              </button>
            </Link>
            <Link href="/login">
              <button className="text-sm font-semibold leading-6 text-foreground hover:text-primary transition">
                Already have an account? <span aria-hidden="true">→</span>
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Hosting partner referral */}
      <section aria-labelledby="hosting-partner-heading" className="border-y border-border/40 bg-card/50 px-6 py-12 lg:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">Recommended hosting</p>
            <h2 id="hosting-partner-heading" className="mt-2 text-2xl font-bold tracking-tight text-foreground">
              Build more with InterServer
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
              Get reliable hosting for your next project through our partner link. This is an affiliate link, so we may earn a commission at no extra cost to you.
            </p>
          </div>
          <a
            href="https://interserver.net/r/1139215"
            rel="sponsored noreferrer"
            aria-label="Visit InterServer hosting"
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
          >
            Visit InterServer
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/40 py-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <h3 className="font-semibold text-foreground mb-4">Product</h3>
              <ul className="space-y-2">
                <li><Link href="/home" className="text-muted-foreground hover:text-foreground">Features</Link></li>
                <li><Link href="/offers" className="text-muted-foreground hover:text-foreground">Pricing</Link></li>
                <li><Link href="/security" className="text-muted-foreground hover:text-foreground">Security</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Company</h3>
              <ul className="space-y-2">
                <li><Link href="/home" className="text-muted-foreground hover:text-foreground">About</Link></li>
                <li><Link href="/help" className="text-muted-foreground hover:text-foreground">Blog</Link></li>
                <li><Link href="/help" className="text-muted-foreground hover:text-foreground">Careers</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link href="/terms-of-service" className="text-muted-foreground hover:text-foreground">Terms</Link></li>
                <li><Link href="/privacy-security" className="text-muted-foreground hover:text-foreground">Privacy</Link></li>
                <li><Link href="/privacy-security" className="text-muted-foreground hover:text-foreground">Cookies</Link></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-foreground mb-4">Social</h3>
              <ul className="space-y-2">
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">Twitter</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">LinkedIn</Link></li>
                <li><Link href="#" className="text-muted-foreground hover:text-foreground">GitHub</Link></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-border/40 pt-8">
            <p className="text-center text-muted-foreground text-sm">
              © 2024 BankChase. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

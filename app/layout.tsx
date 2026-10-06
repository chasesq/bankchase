import type React from "react"
import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import Script from "next/script"
import { Analytics } from "@vercel/analytics/next"
import { SpeedInsights } from "@vercel/speed-insights/next"
import { Toaster } from "@/components/ui/toaster"
import { BankingProvider } from "@/lib/banking-context"
import { AuthProvider } from "@/lib/auth-context"
import { ThemeProvider } from "@/components/theme-provider"
import { DeviceIntelligenceProvider } from "@/components/fingerprint-provider"
import { GlobalBackButton } from "@/components/global-back-button"
import { AppwriteBootstrap } from "@/components/appwrite-bootstrap"
import StatsigWrapper from "./statsig-provider"
import "./globals.css"

const _geist = Geist({ subsets: ["latin"] })
const _geistMono = Geist_Mono({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Banking Dashboard",
  description: "Your personal banking dashboard",
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon.svg",
        type: "image/svg+xml",
      },
    ],
    apple: "/apple-icon.png",
  },
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en" className="bg-background" suppressHydrationWarning>
      <head></head>
      <body className={`font-sans antialiased`}>
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
            <StatsigWrapper>
              <AuthProvider>
                <DeviceIntelligenceProvider>
                  <BankingProvider>
                    {children}
                    <GlobalBackButton />
                    <Toaster />
                    <Analytics />
                    <SpeedInsights />
                    <AppwriteBootstrap />
                  </BankingProvider>
                </DeviceIntelligenceProvider>
              </AuthProvider>
            </StatsigWrapper>
          </ThemeProvider>
        {(process.env.NODE_ENV === "development" || process.env.VERCEL_ENV === "preview") && (
          <Script
            id="meticulous-recording"
            src="https://snippet.meticulous.ai/v1/meticulous.js"
            strategy="afterInteractive"
            data-recording-token={process.env.METICULOUS_RECORDING_TOKEN}
            data-is-production-environment="false"
          />
        )}
        {process.env.NEXT_PUBLIC_CHATBOT_ID?.trim() && (
          <Script
            id="chatbase-widget"
            src="https://www.chatbase.co/embed.min.js"
            strategy="lazyOnload"
            data-chatbot-id={process.env.NEXT_PUBLIC_CHATBOT_ID.trim()}
          />
        )}
        <Script
          id="parallel-labs-agent-primary"
          src="https://web.parallellabs.app/static/js/widget.js?agent=8bc8e30a-682d-4362-943d-5530e380fb02"
          strategy="lazyOnload"
          data-agent-id="8bc8e30a-682d-4362-943d-5530e380fb02"
        />
        <Script
          id="parallel-labs-agent-secondary"
          src="https://web.parallellabs.app/static/js/widget.js?agent=37ed41d9-2f80-467a-bbb8-925d6e1d58b2"
          strategy="lazyOnload"
          data-agent-id="37ed41d9-2f80-467a-bbb8-925d6e1d58b2"
        />
      </body>
    </html>
  )
}

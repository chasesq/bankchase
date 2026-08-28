'use client'

import type { ReactNode } from 'react'
import { FingerprintProvider } from '@fingerprint/react'

const publicApiKey = process.env.NEXT_PUBLIC_FINGERPRINT_PUBLIC_API_KEY || process.env.apiKey

export function DeviceIntelligenceProvider({ children }: { children: ReactNode }) {
  if (!publicApiKey) return <>{children}</>

  return (
    <FingerprintProvider apiKey={publicApiKey} region="us" cache={{ storage: 'sessionStorage', duration: 3600 }}>
      {children}
    </FingerprintProvider>
  )
}

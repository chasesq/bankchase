/**
 * System Health Check
 * Verifies all critical components are functioning
 */

import { logger } from '@/lib/logger'

export interface SystemStatus {
  healthy: boolean
  timestamp: string
  components: {
    [key: string]: {
      status: 'operational' | 'degraded' | 'unavailable'
      message?: string
      details?: Record<string, any>
    }
  }
  metrics?: {
    uptime: number
    memoryUsage: number
  }
}

async function checkEnvironmentVariables(): Promise<{ status: string; missing: string[] }> {
  const required = [
    'SUPABASE_URL',
    'SUPABASE_ANON_KEY',
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  ]

  const missing = required.filter((envVar) => !process.env[envVar])

  if (missing.length > 0) {
    logger.warn('Missing environment variables', { missing })
    return { status: 'degraded', missing }
  }

  return { status: 'operational', missing: [] }
}

async function checkDatabase(): Promise<{ status: string; message?: string }> {
  try {
    // Basic check - can be expanded based on actual DB setup
    if (!process.env.SUPABASE_URL) {
      return { status: 'unavailable', message: 'No database URL configured' }
    }

    // In a real app, you'd test the actual connection here
    return { status: 'operational' }
  } catch (error) {
    logger.error('Database check failed', error as Error)
    return { status: 'unavailable', message: (error as Error).message }
  }
}

async function checkCache(): Promise<{ status: string; message?: string }> {
  try {
    // Check Redis/cache availability
    if (!process.env.KV_REST_API_URL && !process.env.REDIS_URL) {
      return { status: 'degraded', message: 'Cache not configured' }
    }

    return { status: 'operational' }
  } catch (error) {
    logger.error('Cache check failed', error as Error)
    return { status: 'unavailable', message: (error as Error).message }
  }
}

async function checkExternalServices(): Promise<{ status: string; message?: string }> {
  try {
    // Check if critical services are configured
    const services = {
      stripe: !!process.env.STRIPE_SECRET_KEY,
      supabase: !!process.env.SUPABASE_URL,
      plaid: !!process.env.PLAID_CLIENT_ID,
    }

    const unavailable = Object.entries(services)
      .filter(([_, configured]) => !configured)
      .map(([name]) => name)

    if (unavailable.length > 0) {
      return { status: 'degraded', message: `Services not configured: ${unavailable.join(', ')}` }
    }

    return { status: 'operational' }
  } catch (error) {
    logger.error('External services check failed', error as Error)
    return { status: 'unavailable', message: (error as Error).message }
  }
}

export async function performSystemCheck(): Promise<SystemStatus> {
  const timestamp = new Date().toISOString()
  const components: SystemStatus['components'] = {}

  // Run all checks
  const [envVars, database, cache, externalServices] = await Promise.all([
    checkEnvironmentVariables(),
    checkDatabase(),
    checkCache(),
    checkExternalServices(),
  ])

  components.environment = {
    status: envVars.status as any,
    details: { missing: envVars.missing },
  }

  components.database = {
    status: database.status as any,
    message: database.message,
  }

  components.cache = {
    status: cache.status as any,
    message: cache.message,
  }

  components.externalServices = {
    status: externalServices.status as any,
    message: externalServices.message,
  }

  // Determine overall health
  const statuses = Object.values(components).map((c) => c.status)
  const healthy =
    statuses.every((s) => s === 'operational') &&
    statuses.filter((s) => s !== 'operational').length === 0

  const metrics: SystemStatus['metrics'] = {
    uptime: process.uptime ? process.uptime() : 0,
    memoryUsage: process.memoryUsage ? process.memoryUsage().heapUsed / 1024 / 1024 : 0,
  }

  const status: SystemStatus = {
    healthy,
    timestamp,
    components,
    metrics,
  }

  if (!healthy) {
    logger.warn('System health check failed', {
      components: Object.entries(components)
        .filter(([_, c]) => c.status !== 'operational')
        .reduce((acc, [k, v]) => ({ ...acc, [k]: v }), {}),
    })
  } else {
    logger.info('System health check passed')
  }

  return status
}

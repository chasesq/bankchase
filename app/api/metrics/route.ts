import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

function escapeLabel(value: string) {
  return value.replace(/\\/g, '\\\\').replace(/"/g, '\\"').replace(/\n/g, '\\n')
}

export function GET() {
  const service = escapeLabel(process.env.GRAFANA_SERVICE_NAME ?? 'bankchase')
  const version = escapeLabel(process.env.VERCEL_GIT_COMMIT_SHA ?? 'development')
  const uptime = Math.round(process.uptime())
  const memory = process.memoryUsage()

  const body = [
    '# HELP bankchase_up Whether the BankChase application is running.',
    '# TYPE bankchase_up gauge',
    `bankchase_up{service="${service}",version="${version}"} 1`,
    '# HELP bankchase_process_uptime_seconds Process uptime in seconds.',
    '# TYPE bankchase_process_uptime_seconds gauge',
    `bankchase_process_uptime_seconds{service="${service}"} ${uptime}`,
    '# HELP bankchase_process_resident_memory_bytes Resident process memory in bytes.',
    '# TYPE bankchase_process_resident_memory_bytes gauge',
    `bankchase_process_resident_memory_bytes{service="${service}"} ${memory.rss}`,
    '',
  ].join('\n')

  return new NextResponse(body, {
    headers: {
      'Cache-Control': 'no-store',
      'Content-Type': 'text/plain; version=0.0.4; charset=utf-8',
    },
  })
}

export function HEAD() {
  return new NextResponse(null, { status: 200 })
}

import { NextRequest, NextResponse } from 'next/server'
import { performSystemCheck } from '@/lib/system-check'
import { handleApiError } from '@/lib/error-handler'

/**
 * GET /api/admin/health
 *
 * System health monitoring endpoint
 * Returns metrics on all system components and their status
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const systemStatus = await performSystemCheck()

    const statusCode = systemStatus.healthy ? 200 : 503

    return NextResponse.json(systemStatus, { status: statusCode })
  } catch (error) {
    return handleApiError(error)
  }
}

/**
 * GET /api/admin/health/detailed
 *
 * Detailed health information including individual component metrics
 */
export async function getDetailedHealth() {
  try {
    return await performSystemCheck()
  } catch (error) {
    throw error
  }
}

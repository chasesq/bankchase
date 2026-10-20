import { NextResponse } from 'next/server'
import {
  createEnvironment,
  createEnvironmentApiKey,
  createTeam,
  registerRedirectUri,
} from '@/lib/workos-platform'

export const runtime = 'nodejs'

function isEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

function text(value: unknown, max = 200): value is string {
  return typeof value === 'string' && value.trim().length > 0 && value.length <= max
}

export async function POST(request: Request) {
  try {
    const input = await request.json().catch(() => null)
    if (!input || !isEmail(input.adminEmail) || !text(input.teamName) || !text(input.environmentName) || !text(input.redirectUri, 2048)) {
      return NextResponse.json(
        { error: 'adminEmail, teamName, environmentName, and redirectUri are required' },
        { status: 400 },
      )
    }

    let redirectUri: URL
    try {
      redirectUri = new URL(input.redirectUri)
      if (redirectUri.protocol !== 'https:') throw new Error('invalid protocol')
    } catch {
      return NextResponse.json({ error: 'redirectUri must be a valid HTTPS URL' }, { status: 400 })
    }

    const team = await createTeam({ adminEmail: input.adminEmail, name: input.teamName.trim() })
    const environment = await createEnvironment(team.id, {
      name: input.environmentName.trim(),
      production: input.production === true,
    })
    const apiKey = await createEnvironmentApiKey(team.id, environment.id)
    await registerRedirectUri(apiKey.value, redirectUri.toString())

    return NextResponse.json({
      teamId: team.id,
      environmentId: environment.id,
      clientId: environment.client_id,
    })
  } catch (error) {
    const status = typeof error === 'object' && error && 'status' in error && typeof error.status === 'number' ? error.status : 500
    const message = error instanceof Error ? error.message : 'Unable to provision WorkOS environment'
    const normalizedStatus = status >= 400 && status < 600 ? status : 500
    const isRegistrationError = /client registration|registration.*not found|not found.*registration/i.test(message)

    return NextResponse.json(
      isRegistrationError
        ? {
            error: 'invalid_request',
            error_description: 'The client registration could not be found.',
          }
        : {
            error: 'invalid_request',
            error_description: message,
          },
      { status: normalizedStatus },
    )
  }
}

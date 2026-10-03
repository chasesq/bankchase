import { createHmac, timingSafeEqual } from 'node:crypto'

const DEFAULT_TOLERANCE_MS = 5 * 60 * 1000

type WorkOSSignature = { timestamp: number; signatures: string[] }

function parseSignature(header: string): WorkOSSignature | null {
  let timestamp: number | undefined
  const signatures: string[] = []

  for (const part of header.split(',')) {
    const [key, value] = part.split('=', 2)
    if (key === 't') timestamp = Number(value)
    if (key === 'v1' && value) signatures.push(value)
  }

  return timestamp && Number.isFinite(timestamp) && signatures.length > 0
    ? { timestamp, signatures }
    : null
}

export function verifyWorkOSActionSignature(
  body: string,
  header: string | null,
  secret: string | undefined,
  toleranceMs = DEFAULT_TOLERANCE_MS,
): boolean {
  if (!header || !secret) return false
  const parsed = parseSignature(header)
  if (!parsed || Math.abs(Date.now() - parsed.timestamp) > toleranceMs) return false

  const expected = createHmac('sha256', secret)
    .update(`${parsed.timestamp}.${body}`)
    .digest('hex')
  const expectedBuffer = Buffer.from(expected, 'utf8')

  return parsed.signatures.some((signature) => {
    const actual = Buffer.from(signature, 'utf8')
    return actual.length === expectedBuffer.length && timingSafeEqual(actual, expectedBuffer)
  })
}

export function signWorkOSActionResponse(
  object: 'authentication_action_response' | 'user_registration_action_response',
  payload: { verdict: 'Allow' | 'Deny'; error_message?: string },
  secret: string,
) {
  const timestamp = Date.now()
  const responsePayload = {
    timestamp,
    verdict: payload.verdict,
    ...(payload.error_message ? { error_message: payload.error_message.slice(0, 500) } : {}),
  }
  const responseBody = JSON.stringify(responsePayload)
  const signature = createHmac('sha256', secret)
    .update(`${timestamp}.${responseBody}`)
    .digest('hex')

  return { object, payload: responsePayload, signature }
}

export async function readVerifiedWorkOSAction(request: Request) {
  const body = await request.text()
  const secret = process.env.WORKOS_ACTIONS_SECRET
  const valid = verifyWorkOSActionSignature(body, request.headers.get('workos-signature'), secret)

  if (!valid) {
    return { body: null, error: Response.json({ error: 'Invalid WorkOS signature' }, { status: 401 }) }
  }

  try {
    return { body: JSON.parse(body) as Record<string, unknown>, error: null }
  } catch {
    return { body: null, error: Response.json({ error: 'Invalid JSON payload' }, { status: 400 }) }
  }
}

export function missingActionsSecret() {
  return Response.json({ error: 'WorkOS actions are not configured' }, { status: 500 })
}

export function getActionsSecret() {
  return process.env.WORKOS_ACTIONS_SECRET
}

export function actionResponse(
  object: 'authentication_action_response' | 'user_registration_action_response',
  secret: string,
  verdict: 'Allow' | 'Deny',
  error_message?: string,
) {
  return Response.json(signWorkOSActionResponse(object, { verdict, error_message }, secret))
}

export function isEmail(value: unknown): value is string {
  return typeof value === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)
}

export function getUserEmail(payload: Record<string, unknown>) {
  const user = payload.user as { email?: unknown } | undefined
  const userData = payload.user_data as { email?: unknown } | undefined
  return user?.email ?? userData?.email
}

export function hasObject(payload: Record<string, unknown>, object: string) {
  return payload.object === object
}

export function getSecretOrResponse() {
  const secret = getActionsSecret()
  return secret ? { secret, response: null } : { secret: null, response: missingActionsSecret() }
}

export function verifiedPayloadError(payload: Record<string, unknown> | null) {
  return payload ? null : Response.json({ error: 'Invalid WorkOS action payload' }, { status: 400 })
}

export function unauthorizedMethod() {
  return Response.json({ error: 'Method not allowed' }, { status: 405 })
}

export function signatureHeaders() {
  return { 'Cache-Control': 'no-store' }
}

export function safeString(value: unknown) {
  return typeof value === 'string' ? value : ''
}

export function allowAction(object: 'authentication_action_response' | 'user_registration_action_response', secret: string) {
  return new Response(JSON.stringify(signWorkOSActionResponse(object, { verdict: 'Allow' }, secret)), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...signatureHeaders() },
  })
}

export function denyAction(object: 'authentication_action_response' | 'user_registration_action_response', secret: string, message: string) {
  return new Response(JSON.stringify(signWorkOSActionResponse(object, { verdict: 'Deny', error_message: message }, secret)), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...signatureHeaders() },
  })
}

export function actionObjectError(expected: string) {
  return Response.json({ error: `Expected ${expected} payload` }, { status: 400 })
}

export function verifiedAction(request: Request) {
  return readVerifiedWorkOSAction(request)
}

export function actionSecret() {
  return getActionsSecret()
}

export function actionConfigError() {
  return missingActionsSecret()
}

export function validPayload(payload: Record<string, unknown> | null) {
  return payload !== null
}

export function responseFor(
  object: 'authentication_action_response' | 'user_registration_action_response',
  secret: string,
  verdict: 'Allow' | 'Deny',
  message?: string,
) {
  return verdict === 'Allow' ? allowAction(object, secret) : denyAction(object, secret, message ?? 'Operation denied')
}

export function hasValidEmail(payload: Record<string, unknown>) {
  return isEmail(getUserEmail(payload))
}

export function responseError(message: string, status: number) {
  return Response.json({ error: message }, { status })
}

export function noStoreResponse(response: Response) {
  response.headers.set('Cache-Control', 'no-store')
  return response
}

export function actionReady() {
  return Boolean(process.env.WORKOS_ACTIONS_SECRET)
}

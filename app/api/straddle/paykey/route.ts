import { NextResponse } from "next/server"

export const runtime = "nodejs"

const STRADDLE_BASE_URL = process.env.STRADDLE_API_URL || "https://sandbox.straddle.com"

type PaykeyRequest = { customerId?: unknown; quilttToken?: unknown; externalId?: unknown }

export async function POST(request: Request) {
  const apiKey = process.env.STRADDLE_API_KEY || process.env.paykey || process.env.paykey_2 || process.env.paykey_3
  if (!apiKey) return NextResponse.json({ error: "Straddle is not configured." }, { status: 503 })

  let body: PaykeyRequest
  try { body = (await request.json()) as PaykeyRequest } catch { return NextResponse.json({ error: "Invalid request." }, { status: 400 }) }
  const customerId = typeof body.customerId === "string" ? body.customerId.trim() : ""
  const quilttToken = typeof body.quilttToken === "string" ? body.quilttToken.trim() : ""
  const externalId = typeof body.externalId === "string" ? body.externalId.trim() : undefined
  if (!customerId || !quilttToken) return NextResponse.json({ error: "customerId and quilttToken are required." }, { status: 400 })

  const idempotencyKey = crypto.randomUUID()
  const response = await fetch(`${STRADDLE_BASE_URL}/v1/bridge/quiltt`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "application/json", "Idempotency-Key": idempotencyKey },
    body: JSON.stringify({ customer_id: customerId, quiltt_token: quilttToken, ...(externalId ? { external_id: externalId } : {}) }),
    cache: "no-store",
  })
  const data = await response.json().catch(() => ({ error: "Invalid Straddle response." }))
  return NextResponse.json(data, { status: response.status })
}

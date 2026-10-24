import { NextResponse } from "next/server"

export const runtime = "nodejs"

const QUILTT_API_URL = "https://api.quiltt.io/v1"

type ProcessorTokenRequest = {
  accountId?: unknown
}

type QuilttResponse = {
  token?: string
  processorToken?: string
  data?: { token?: string; processorToken?: string }
  message?: string
  error?: string
}

export async function POST(request: Request) {
  const apiKey = process.env.QUILTT_API_KEY_SECRET
  if (!apiKey) return NextResponse.json({ error: "Quiltt is not configured." }, { status: 503 })

  let body: ProcessorTokenRequest
  try {
    body = (await request.json()) as ProcessorTokenRequest
  } catch {
    return NextResponse.json({ error: "A Quiltt account ID is required." }, { status: 400 })
  }

  const accountId = typeof body.accountId === "string" ? body.accountId.trim() : ""
  if (!accountId || accountId.length > 200) {
    return NextResponse.json({ error: "A valid Quiltt account ID is required." }, { status: 400 })
  }

  const response = await fetch(`${QUILTT_API_URL}/accounts/${encodeURIComponent(accountId)}/processor_tokens`, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ processor: "STRADDLE", issuer: "QUILTT" }),
    cache: "no-store",
  })
  const data = (await response.json().catch(() => null)) as QuilttResponse | null
  const token = data?.token ?? data?.processorToken ?? data?.data?.token ?? data?.data?.processorToken

  if (!response.ok || !token) {
    return NextResponse.json({ error: data?.message || data?.error || "Unable to create a Quiltt processor token." }, { status: response.status || 502 })
  }

  return NextResponse.json({ token })
}

import { NextResponse } from "next/server"

const QUILTT_AUTH_URL = "https://auth.quiltt.io/v1/users/sessions"

export async function POST(request: Request) {
  const apiKey = process.env.QUILTT_API_KEY_SECRET
  if (!apiKey) {
    return NextResponse.json({ error: "Quiltt is not configured." }, { status: 503 })
  }

  let body: { email?: string; userId?: string } = {}
  try {
    body = await request.json()
  } catch {
    // An empty body creates a profile only when Quiltt accepts the request.
  }

  const response = await fetch(QUILTT_AUTH_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(
      body.userId ? { userId: body.userId } : { email: body.email || undefined },
    ),
    cache: "no-store",
  })

  const data = await response.json().catch(() => null)
  if (!response.ok || !data?.token) {
    return NextResponse.json(
      { error: data?.instruction || data?.message || "Unable to start the Quiltt connection." },
      { status: response.status || 502 },
    )
  }

  return NextResponse.json({ token: data.token, userId: data.userId })
}

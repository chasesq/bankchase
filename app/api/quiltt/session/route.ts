import { NextResponse } from "next/server"

export const runtime = "nodejs"

const QUILTT_AUTH_URL = "https://auth.quiltt.io/v1/users/sessions"
const SESSION_TIMEOUT_MS = 10_000

type SessionRequest = { userId?: unknown }

export async function POST(request: Request) {
  const apiKey = process.env.QUILTT_API_KEY_SECRET
  if (!apiKey) {
    return NextResponse.json({ error: "Quiltt is not configured." }, { status: 503 })
  }

  let body: SessionRequest = {}
  try {
    body = (await request.json()) as SessionRequest
  } catch {
    // An empty request asks Quiltt to create a new profile session.
  }

  const userId = typeof body.userId === "string" && body.userId.trim() ? body.userId.trim() : undefined
  const controller = new AbortController()
  const timeout = setTimeout(() => controller.abort(), SESSION_TIMEOUT_MS)

  try {
    const response = await fetch(QUILTT_AUTH_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(userId ? { userId } : {}),
      cache: "no-store",
      signal: controller.signal,
    })

    const data = (await response.json().catch(() => null)) as
      | { token?: string; userId?: string; message?: string; instruction?: string }
      | null

    if (!response.ok || !data?.token) {
      return NextResponse.json(
        { error: data?.instruction || data?.message || "Unable to start the Quiltt connection." },
        { status: response.status || 502 },
      )
    }

    return NextResponse.json({ token: data.token, userId: data.userId })
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "Quiltt took too long to respond. Please try again."
      : "Unable to reach Quiltt. Please try again."
    return NextResponse.json({ error: message }, { status: 502 })
  } finally {
    clearTimeout(timeout)
  }
}

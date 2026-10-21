import { NextRequest, NextResponse } from "next/server"

const BASE_URL = "https://androidtexter.com"

function authHeaders() {
  const configured = process.env.CURL_AUTH_HEADER_3?.trim()
  if (!configured) return {}
  const [name, ...valueParts] = configured.split(":")
  if (!name || valueParts.length === 0) return { Authorization: configured }
  return { [name.trim()]: valueParts.join(":").trim() }
}

async function proxy(request: NextRequest, { params }: { params: Promise<{ path: string[] }> }) {
  const { path } = await params
  const search = request.nextUrl.search
  const target = `${BASE_URL}/${path.join("/")}${search}`
  const headers = new Headers(authHeaders())
  headers.set("Accept", "application/json")
  const contentType = request.headers.get("content-type")
  if (contentType) headers.set("Content-Type", contentType)
  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text()

  try {
    const response = await fetch(target, { method: request.method, headers, body, cache: "no-store" })
    const text = await response.text()
    return new NextResponse(text, { status: response.status, headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" } })
  } catch {
    return NextResponse.json({ error: "Android Texter is unavailable right now." }, { status: 502 })
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const DELETE = proxy

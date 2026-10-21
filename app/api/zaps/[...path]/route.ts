import { NextRequest, NextResponse } from "next/server"

const BASE_URL = "https://api.zaps.ai"

function getAuthHeaders() {
  const configured = process.env.CURL_AUTH_HEADER_3?.trim()
  if (!configured) return {}

  const separator = configured.indexOf(":")
  if (separator === -1) return { Authorization: configured }

  const name = configured.slice(0, separator).trim()
  const value = configured.slice(separator + 1).trim()
  return name && value ? { [name]: value } : {}
}

async function proxy(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const { path } = await params
  const target = `${BASE_URL}/${path.join("/")}${request.nextUrl.search}`
  const headers = new Headers(getAuthHeaders())
  headers.set("Accept", "application/json")

  const contentType = request.headers.get("content-type")
  if (contentType) headers.set("Content-Type", contentType)

  const body = request.method === "GET" || request.method === "HEAD" ? undefined : await request.text()

  try {
    const response = await fetch(target, {
      method: request.method,
      headers,
      body,
      cache: "no-store",
    })
    const responseBody = await response.text()

    return new NextResponse(responseBody, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
      },
    })
  } catch {
    return NextResponse.json({ error: "Zaps API is unavailable right now." }, { status: 502 })
  }
}

export const GET = proxy
export const POST = proxy
export const PUT = proxy
export const DELETE = proxy

import { NextRequest, NextResponse } from "next/server"
import { listCustomers, MercuryApiError, mercuryRequest } from "@/lib/mercury-api"

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await listCustomers(request.nextUrl.search))
  } catch (error) {
    const status = error instanceof MercuryApiError ? error.status : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load customers" }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    if (typeof body.name !== "string" || !body.name.trim() || typeof body.email !== "string" || !body.email.includes("@")) {
      return NextResponse.json({ error: "A valid customer name and email are required" }, { status: 400 })
    }
    return NextResponse.json(await mercuryRequest("/ar/customers", { method: "POST", body: JSON.stringify({ ...body, name: body.name.trim(), email: body.email.trim().toLowerCase() }) }))
  } catch (error) {
    const status = error instanceof MercuryApiError ? error.status : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create customer" }, { status })
  }
}

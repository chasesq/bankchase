import { NextRequest, NextResponse } from "next/server"
import { listUsers, MercuryApiError } from "@/lib/mercury-api"

export async function GET(request: NextRequest) {
  try {
    return NextResponse.json(await listUsers(request.nextUrl.search))
  } catch (error) {
    const status = error instanceof MercuryApiError ? error.status : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load users" }, { status })
  }
}

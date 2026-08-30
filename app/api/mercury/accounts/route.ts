import { NextRequest, NextResponse } from "next/server"
import { listAccounts, MercuryApiError, requireMercuryUser } from "@/lib/mercury-api"

export async function GET(request: NextRequest) {
  try {
    await requireMercuryUser()
    return NextResponse.json(await listAccounts(request.nextUrl.search))
  } catch (error) {
    const status = error instanceof MercuryApiError ? error.status : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load accounts" }, { status })
  }
}

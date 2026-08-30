import { NextRequest, NextResponse } from "next/server"
import { listStatements, MercuryApiError, requireMercuryUser } from "@/lib/mercury-api"

export async function GET(request: NextRequest, { params }: { params: Promise<{ accountId: string }> }) {
  try {
    await requireMercuryUser()
    const { accountId } = await params
    return NextResponse.json(await listStatements(accountId, request.nextUrl.search))
  } catch (error) {
    const status = error instanceof MercuryApiError ? error.status : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load statements" }, { status })
  }
}

import { NextResponse } from "next/server"
import { listSafes, MercuryApiError } from "@/lib/mercury-api"

export async function GET() {
  try {
    return NextResponse.json({ safes: await listSafes() })
  } catch (error) {
    const status = error instanceof MercuryApiError ? error.status : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load SAFEs" }, { status })
  }
}

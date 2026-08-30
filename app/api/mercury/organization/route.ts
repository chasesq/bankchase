import { NextResponse } from "next/server"
import { getOrganization, MercuryApiError } from "@/lib/mercury-api"

export async function GET() {
  try {
    return NextResponse.json(await getOrganization())
  } catch (error) {
    const status = error instanceof MercuryApiError ? error.status : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load organization" }, { status })
  }
}

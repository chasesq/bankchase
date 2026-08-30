import { NextRequest, NextResponse } from "next/server"
import { listCategories, MercuryApiError, mercuryRequest, requireMercuryUser } from "@/lib/mercury-api"

export async function GET(request: NextRequest) {
  try {
    await requireMercuryUser()
    return NextResponse.json(await listCategories(request.nextUrl.search))
  } catch (error) {
    const status = error instanceof MercuryApiError ? error.status : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to load categories" }, { status })
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireMercuryUser()
    const body = await request.json()
    if (typeof body.name !== "string" || !body.name.trim()) return NextResponse.json({ error: "Category name is required" }, { status: 400 })
    return NextResponse.json(await mercuryRequest("/categories", { method: "POST", body: JSON.stringify({ ...body, name: body.name.trim() }) }), { status: 201 })
  } catch (error) {
    const status = error instanceof MercuryApiError ? error.status : 500
    return NextResponse.json({ error: error instanceof Error ? error.message : "Unable to create category" }, { status })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const requestedUserId = request.nextUrl.searchParams.get("userId")
    if (requestedUserId && requestedUserId !== user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    const limit = Math.min(Math.max(Number(request.nextUrl.searchParams.get("limit") || 50), 1), 100)
    const offset = Math.max(Number(request.nextUrl.searchParams.get("offset") || 0), 0)
    const { data: transfers, error, count } = await supabase
      .from("transactions")
      .select("*", { count: "exact" })
      .eq("user_id", user.id)
      .order("initiated_at", { ascending: false })
      .range(offset, offset + limit - 1)

    if (error) throw error
    return NextResponse.json({ success: true, transfers: transfers ?? [], count: count ?? 0, limit, offset })
  } catch (error) {
    console.error("[v0] Failed to fetch transfers:", error)
    return NextResponse.json({ error: "Failed to fetch transfers" }, { status: 500 })
  }
}

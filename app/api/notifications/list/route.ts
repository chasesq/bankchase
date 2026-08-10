import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { supabase, user, error }
}

export async function GET(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const requestedUserId = request.nextUrl.searchParams.get("userId")
    if (requestedUserId && requestedUserId !== user.id) return NextResponse.json({ error: "Forbidden" }, { status: 403 })

    let query = supabase.from("notifications").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(50)
    if (request.nextUrl.searchParams.get("unreadOnly") === "true") query = query.eq("is_read", false)
    const { data: notifications, error } = await query
    if (error) throw error
    const rows = notifications ?? []
    return NextResponse.json({ success: true, notifications: rows, count: rows.length, unread: rows.filter((item) => !item.is_read).length })
  } catch (error) {
    console.error("[v0] Failed to fetch notifications:", error)
    return NextResponse.json({ error: "Failed to fetch notifications" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const { supabase, user, error: authError } = await getUser()
    if (authError || !user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { notificationId, isRead } = await request.json()
    if (!notificationId || typeof isRead !== "boolean") return NextResponse.json({ error: "notificationId and isRead are required" }, { status: 400 })
    const { error } = await supabase.from("notifications").update({ is_read: isRead, read_at: isRead ? new Date().toISOString() : null }).eq("id", notificationId).eq("user_id", user.id)
    if (error) throw error
    return NextResponse.json({ success: true, message: "Notification updated" })
  } catch (error) {
    console.error("[v0] Failed to update notification:", error)
    return NextResponse.json({ error: "Failed to update notification" }, { status: 500 })
  }
}

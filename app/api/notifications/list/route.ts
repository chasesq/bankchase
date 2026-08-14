import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

async function getUser() {
  const supabase = await createClient()
  const { data: { user }, error } = await supabase.auth.getUser()
  return { supabase, user, error }
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const unreadOnly = searchParams.get("unreadOnly") === "true"

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    // Get notifications for user
    const filters = [eq(notification.userId, userId)]
    if (unreadOnly) filters.push(eq(notification.isRead, false))

    const query = db
      .select()
      .from(notification)
      .where(and(...filters))

    const notifications = await query
      .orderBy(desc(notification.createdAt))
      .limit(50)

    return NextResponse.json({
      success: true,
      notifications,
      count: notifications.length,
      unread: notifications.filter(n => !n.isRead).length,
    })
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

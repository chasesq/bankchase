import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/index"
import { notification } from "@/lib/db/schema"
import { eq, desc, and } from "drizzle-orm"
import { nanoid } from "nanoid"

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
    let query = db
      .select()
      .from(notification)
      .where(eq(notification.userId, userId))

    if (unreadOnly) {
      query = query.where(eq(notification.isRead, false))
    }

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
    return NextResponse.json(
      { error: "Failed to fetch notifications" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json()
    const { notificationId, isRead } = body

    if (!notificationId) {
      return NextResponse.json(
        { error: "notificationId is required" },
        { status: 400 }
      )
    }

    // Update notification
    await db
      .update(notification)
      .set({
        isRead,
        readAt: isRead ? new Date() : null,
      })
      .where(eq(notification.id, notificationId))

    return NextResponse.json({
      success: true,
      message: "Notification updated",
    })
  } catch (error) {
    console.error("[v0] Failed to update notification:", error)
    return NextResponse.json(
      { error: "Failed to update notification" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/index"
import { transfer, bankAccount } from "@/lib/db/schema"
import { eq, or, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")
    const limit = parseInt(searchParams.get("limit") || "50")
    const offset = parseInt(searchParams.get("offset") || "0")

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    // Get transfers where user is sender or receiver
    const transfers = await db
      .select({
        id: transfer.id,
        senderId: transfer.senderId,
        senderAccountId: transfer.senderAccountId,
        receiverId: transfer.receiverId,
        receiverAccountId: transfer.receiverAccountId,
        recipientEmail: transfer.recipientEmail,
        recipientName: transfer.recipientName,
        amount: transfer.amount,
        fee: transfer.fee,
        description: transfer.description,
        transferType: transfer.transferType,
        status: transfer.status,
        createdAt: transfer.createdAt,
        updatedAt: transfer.updatedAt,
      })
      .from(transfer)
      .where(or(
        eq(transfer.senderId, userId),
        eq(transfer.receiverId, userId)
      ))
      .orderBy(desc(transfer.createdAt))
      .limit(limit)
      .offset(offset)

    const total = transfers.length

    return NextResponse.json({
      success: true,
      transfers,
      count: total,
      limit,
      offset,
    })
  } catch (error) {
    console.error("[v0] Failed to fetch transfers:", error)
    return NextResponse.json(
      { error: "Failed to fetch transfers" },
      { status: 500 }
    )
  }
}

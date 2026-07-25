import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/index"
import { bankAccount } from "@/lib/db/schema"
import { eq, desc } from "drizzle-orm"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const userId = searchParams.get("userId")

    if (!userId) {
      return NextResponse.json(
        { error: "userId is required" },
        { status: 400 }
      )
    }

    // Get all bank accounts for user
    const accounts = await db
      .select()
      .from(bankAccount)
      .where(eq(bankAccount.userId, userId))
      .orderBy(desc(bankAccount.isDefault), desc(bankAccount.createdAt))

    return NextResponse.json({
      success: true,
      accounts,
      count: accounts.length,
    })
  } catch (error) {
    console.error("[v0] Failed to fetch accounts:", error)
    return NextResponse.json(
      { error: "Failed to fetch accounts" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      userId,
      accountName,
      accountNumber,
      routingNumber,
      bankName,
      accountType = "checking",
      balance = "0.00",
    } = body

    if (!userId || !accountName || !accountNumber || !routingNumber || !bankName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Check if this is the first account
    const existingAccounts = await db
      .select()
      .from(bankAccount)
      .where(eq(bankAccount.userId, userId))

    const isDefault = existingAccounts.length === 0

    // Create new account
    const { nanoid } = await import("nanoid")
    const newAccount = {
      id: nanoid(),
      userId,
      accountName,
      accountNumber,
      routingNumber,
      bankName,
      accountType,
      balance,
      isDefault,
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    await db.insert(bankAccount).values(newAccount)

    return NextResponse.json({
      success: true,
      account: newAccount,
    })
  } catch (error) {
    console.error("[v0] Failed to create account:", error)
    return NextResponse.json(
      { error: "Failed to create account" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/index"
import { bankAccount, user } from "@/lib/db/schema"
import { eq } from "drizzle-orm"
import { nanoid } from "nanoid"

export async function POST(request: NextRequest) {
  try {
    const { userId = "demo-user" } = await request.json()

    // Check if user exists
    const existingUser = await db
      .select()
      .from(user)
      .where(eq(user.id, userId))
      .limit(1)

    // Create user if doesn't exist
    if (!existingUser.length) {
      await db.insert(user).values({
        id: userId,
        name: "John Chase",
        email: `${userId}@chase.com`,
        emailVerified: true,
        image: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
    }

    // Check if accounts exist
    const existingAccounts = await db
      .select()
      .from(bankAccount)
      .where(eq(bankAccount.userId, userId))

    if (existingAccounts.length === 0) {
      // Create demo bank accounts
      await db.insert(bankAccount).values([
        {
          id: nanoid(),
          userId,
          accountName: "Checking Account",
          accountNumber: "1234567890",
          routingNumber: "021000021",
          bankName: "Chase Bank",
          accountType: "checking",
          balance: "5432.10",
          isDefault: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: nanoid(),
          userId,
          accountName: "Savings Account",
          accountNumber: "0987654321",
          routingNumber: "021000021",
          bankName: "Chase Bank",
          accountType: "savings",
          balance: "12500.00",
          isDefault: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ])
    }

    return NextResponse.json({
      success: true,
      message: "Demo data initialized",
      userId,
    })
  } catch (error) {
    console.error("[v0] Demo init error:", error)
    return NextResponse.json(
      { error: "Failed to initialize demo data" },
      { status: 500 }
    )
  }
}

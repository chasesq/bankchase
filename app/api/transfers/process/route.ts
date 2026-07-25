import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db/index"
import { transfer, bankAccount, notification, user } from "@/lib/db/schema"
import { eq, and } from "drizzle-orm"
import { nanoid } from "nanoid"

interface TransferRequest {
  senderId: string
  senderAccountId: string
  receiverAccountId?: string
  recipientEmail?: string
  recipientName: string
  amount: number
  description?: string
  transferType: "zelle" | "bank_transfer" | "internal"
}

export async function POST(request: NextRequest) {
  try {
    const body: TransferRequest = await request.json()
    
    const {
      senderId,
      senderAccountId,
      receiverAccountId,
      recipientEmail,
      recipientName,
      amount,
      description,
      transferType,
    } = body

    // Validate required fields
    if (!senderId || !senderAccountId || !amount || !recipientName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: "Amount must be greater than 0" },
        { status: 400 }
      )
    }

    // Get sender account
    const senderAcct = await db
      .select()
      .from(bankAccount)
      .where(and(
        eq(bankAccount.id, senderAccountId),
        eq(bankAccount.userId, senderId)
      ))
      .limit(1)

    if (!senderAcct.length) {
      return NextResponse.json(
        { error: "Sender account not found" },
        { status: 404 }
      )
    }

    // Calculate fee based on transfer type
    const fee = transferType === "zelle" ? 0 : 2.50
    const totalAmount = amount + fee

    // Check sender balance
    const senderBalance = parseFloat(senderAcct[0].balance)
    if (senderBalance < totalAmount) {
      return NextResponse.json(
        { error: `Insufficient funds. Available: $${senderBalance.toFixed(2)}, Required: $${totalAmount.toFixed(2)}` },
        { status: 400 }
      )
    }

    // Get receiver account (if internal transfer)
    let receiverAcct = null
    let receiverId = null
    
    if (receiverAccountId) {
      const result = await db
        .select()
        .from(bankAccount)
        .where(eq(bankAccount.id, receiverAccountId))
        .limit(1)

      if (!result.length) {
        return NextResponse.json(
          { error: "Receiver account not found" },
          { status: 404 }
        )
      }
      receiverAcct = result[0]
      receiverId = receiverAcct.userId
    }

    // Create transfer record
    const transferId = nanoid()
    
    await db.insert(transfer).values({
      id: transferId,
      senderId,
      senderAccountId,
      receiverId: receiverId || null,
      receiverAccountId: receiverAccountId || "",
      recipientEmail,
      recipientName,
      amount: amount.toString(),
      fee: fee.toString(),
      description: description || `Transfer to ${recipientName}`,
      transferType,
      status: "processing",
    })

    // Debit sender account
    const newSenderBalance = (senderBalance - totalAmount).toFixed(2)
    await db
      .update(bankAccount)
      .set({
        balance: newSenderBalance,
        updatedAt: new Date(),
      })
      .where(eq(bankAccount.id, senderAccountId))

    // Credit receiver account if internal transfer
    let newReceiverBalance = null
    if (receiverAcct) {
      const receiverBalance = parseFloat(receiverAcct.balance)
      newReceiverBalance = (receiverBalance + amount).toFixed(2)
      
      await db
        .update(bankAccount)
        .set({
          balance: newReceiverBalance,
          updatedAt: new Date(),
        })
        .where(eq(bankAccount.id, receiverAccountId!))
    }

    // Update transfer status to completed
    await db
      .update(transfer)
      .set({
        status: "completed",
        updatedAt: new Date(),
      })
      .where(eq(transfer.id, transferId))

    // Create notification for sender
    const senderNotifId = nanoid()
    await db.insert(notification).values({
      id: senderNotifId,
      userId: senderId,
      type: "transfer_sent",
      title: "Transfer Sent",
      message: `You sent $${amount.toFixed(2)} to ${recipientName}`,
      relatedTransferId: transferId,
    })

    // Create notification for receiver if internal transfer
    if (receiverAcct) {
      const receiverNotifId = nanoid()
      const senderUser = await db
        .select()
        .from(user)
        .where(eq(user.id, senderId))
        .limit(1)

      await db.insert(notification).values({
        id: receiverNotifId,
        userId: receiverId!,
        type: "transfer_received",
        title: "Money Received",
        message: `You received $${amount.toFixed(2)} from ${senderUser[0]?.name || "a contact"}`,
        relatedTransferId: transferId,
      })
    }

    return NextResponse.json(
      {
        success: true,
        transferId,
        message: "Transfer completed successfully",
        senderNewBalance: newSenderBalance,
        receiverNewBalance: newReceiverBalance,
        fee,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error("[v0] Transfer processing error:", error)
    return NextResponse.json(
      { error: "Failed to process transfer" },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { nanoid } from 'nanoid'

// In-memory store for demo - persists across requests
const mockStore: any = {
  accounts: new Map(),
  transfers: new Map(),
  notifications: new Map(),
}

// Initialize demo accounts on first load
function ensureDemo() {
  if (!mockStore.accounts.has('demo-user')) {
    mockStore.accounts.set('demo-user', [
      {
        id: nanoid(),
        userId: 'demo-user',
        accountName: 'Checking Account',
        accountNumber: '1234567890',
        routingNumber: '021000021',
        bankName: 'Chase Bank',
        accountType: 'checking',
        balance: '5432.10',
        isDefault: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: nanoid(),
        userId: 'demo-user',
        accountName: 'Savings Account',
        accountNumber: '0987654321',
        routingNumber: '021000021',
        bankName: 'Chase Bank',
        accountType: 'savings',
        balance: '12500.00',
        isDefault: false,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ])
  }
}

export async function POST(request: NextRequest) {
  try {
    ensureDemo()
    
    const body = await request.json()
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
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Validate amount
    if (amount <= 0) {
      return NextResponse.json(
        { error: 'Amount must be greater than 0' },
        { status: 400 }
      )
    }

    // Get sender account
    const senderAccounts = mockStore.accounts.get(senderId) || []
    const sender = senderAccounts.find((a: any) => a.id === senderAccountId)

    if (!sender) {
      return NextResponse.json(
        { error: 'Sender account not found' },
        { status: 404 }
      )
    }

    // Calculate fee
    const fee = transferType === 'zelle' ? 0 : 2.50
    const totalAmount = amount + fee

    // Check balance
    const senderBalance = parseFloat(sender.balance)
    if (senderBalance < totalAmount) {
      return NextResponse.json(
        {
          error: `Insufficient funds. Available: $${senderBalance.toFixed(2)}, Required: $${totalAmount.toFixed(2)}`,
        },
        { status: 400 }
      )
    }

    // Debit sender
    sender.balance = (senderBalance - totalAmount).toFixed(2)
    sender.updatedAt = new Date()

    // Credit receiver if internal transfer
    let receiver: any = null
    if (receiverAccountId) {
      for (const [userId, accounts] of mockStore.accounts) {
        const foundReceiver = (accounts as any[]).find(
          (a: any) => a.id === receiverAccountId
        )
        if (foundReceiver) {
          foundReceiver.balance = (parseFloat(foundReceiver.balance) + amount).toFixed(2)
          foundReceiver.updatedAt = new Date()
          receiver = foundReceiver
          break
        }
      }

      if (!receiver) {
        return NextResponse.json(
          { error: 'Receiver account not found' },
          { status: 404 }
        )
      }
    }

    // Create transfer record
    const transferId = nanoid()
    const transfer = {
      id: transferId,
      senderId,
      senderAccountId,
      receiverId: receiver?.userId || null,
      receiverAccountId: receiverAccountId || '',
      recipientEmail,
      recipientName,
      amount: amount.toString(),
      fee: fee.toString(),
      description: description || `Transfer to ${recipientName}`,
      transferType,
      status: 'completed',
      createdAt: new Date(),
      updatedAt: new Date(),
    }

    mockStore.transfers.set(transferId, transfer)

    // Create sender notification
    const senderNotif = {
      id: nanoid(),
      userId: senderId,
      type: 'transfer_sent',
      title: 'Transfer Sent',
      message: `You sent $${amount.toFixed(2)} to ${recipientName}`,
      relatedTransferId: transferId,
      isRead: false,
      createdAt: new Date(),
    }

    if (!mockStore.notifications.has(senderId)) {
      mockStore.notifications.set(senderId, [])
    }
    mockStore.notifications.get(senderId).unshift(senderNotif)

    // Create receiver notification if internal transfer
    if (receiver) {
      const receiverId = receiver.userId
      const receiverNotif = {
        id: nanoid(),
        userId: receiverId,
        type: 'transfer_received',
        title: 'Money Received',
        message: `You received $${amount.toFixed(2)} from ${senderId}`,
        relatedTransferId: transferId,
        isRead: false,
        createdAt: new Date(),
      }

      if (!mockStore.notifications.has(receiverId)) {
        mockStore.notifications.set(receiverId, [])
      }
      mockStore.notifications.get(receiverId).unshift(receiverNotif)
    }

    return NextResponse.json(
      {
        success: true,
        transferId,
        message: 'Transfer completed successfully',
        senderNewBalance: sender.balance,
        receiverNewBalance: receiver?.balance || null,
        fee,
      },
      { status: 200 }
    )
  } catch (error) {
    console.error('[v0] Mock transfer error:', error)
    return NextResponse.json(
      { error: 'Failed to process transfer' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    ensureDemo()

    const searchParams = request.nextUrl.searchParams
    const action = searchParams.get('action')
    const userId = searchParams.get('userId') || 'demo-user'

    if (action === 'accounts') {
      const accounts = mockStore.accounts.get(userId) || []
      return NextResponse.json({
        success: true,
        accounts,
        count: accounts.length,
      })
    }

    if (action === 'notifications') {
      const notifications = mockStore.notifications.get(userId) || []
      return NextResponse.json({
        success: true,
        notifications: notifications.slice(0, 50),
        unread: notifications.filter((n: any) => !n.isRead).length,
      })
    }

    if (action === 'transfers') {
      const transfers = Array.from(mockStore.transfers.values()).filter(
        (t: any) => t.senderId === userId || t.receiverId === userId
      )
      return NextResponse.json({
        success: true,
        transfers: transfers.slice(0, 50),
        count: transfers.length,
      })
    }

    // Default: return all accounts
    const accounts = mockStore.accounts.get(userId) || []
    return NextResponse.json({
      success: true,
      accounts,
      count: accounts.length,
    })
  } catch (error) {
    console.error('[v0] Mock fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch data' },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'
import { NotificationService } from '@/lib/notification-service'
import { v4 as uuidv4 } from 'uuid'
import crypto from 'crypto'

export async function GET(request: NextRequest) {
  try {
    const userId = 'user_demo'
    const connectors = await NotificationService.getConnectors(userId)

    console.log('[v0] Fetched connectors for user:', userId)

    const safeConnectors = connectors.map((connector) => {
      const safeConfig = { ...connector.config }
      for (const key of ['webhookUrl', 'accessToken', 'secret', 'apiKey']) {
        if (typeof safeConfig[key] === 'string' && safeConfig[key]) safeConfig[key] = `${safeConfig[key].slice(0, 8)}***`
      }
      return { ...connector, config: safeConfig, secret: undefined }
    })

    return NextResponse.json({
      success: true,
      connectors: safeConnectors,
      timestamp: new Date().toISOString(),
    })
  } catch (error) {
    console.error('[v0] Failed to fetch connectors:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to fetch connectors' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { type, config, events } = body
    const allowedTypes = ['slack', 'discord', 'teams', 'hubspot', 'email', 'sms', 'custom']
    const allowedEvents = ['transaction.completed', 'transaction.failed', 'balance.low', 'fraud.detected', 'account.updated']

    if (!allowedTypes.includes(type) || !config?.name || !Array.isArray(events) || events.length === 0 || events.some((event: string) => !allowedEvents.includes(event))) {
      return NextResponse.json({ success: false, error: 'Invalid connector configuration' }, { status: 400 })
    }

    const connector = {
      id: uuidv4(),
      userId: 'user_demo',
      type,
      name: String(config.name).trim().slice(0, 100),
      config: {
        ...config,
      },
      events,
      isActive: true,
      secret: crypto.randomBytes(32).toString('hex'),
      createdAt: new Date(),
      lastTriggeredAt: null,
      failureCount: 0,
    }

    await NotificationService.storeConnector(connector)

    console.log('[v0] Connector created:', connector.id, type)

    const safeConfig = { ...connector.config }
    for (const key of ['webhookUrl', 'accessToken', 'secret', 'apiKey']) {
      if (typeof safeConfig[key] === 'string' && safeConfig[key]) safeConfig[key] = `${safeConfig[key].slice(0, 8)}***`
    }

    return NextResponse.json({
      success: true,
      connector: { ...connector, config: safeConfig, secret: undefined },
    })
  } catch (error) {
    console.error('[v0] Failed to create connector:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create connector' },
      { status: 500 }
    )
  }
}

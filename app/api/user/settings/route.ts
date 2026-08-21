import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

const defaultSettings = {
  notifications: {
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    marketingEmails: false,
    paperStatements: false,
    soundAlerts: true,
    transactionAlerts: true,
    largeTransactionThreshold: 500,
    lowBalanceAlert: true,
    lowBalanceAmount: 100,
  },
  display: { darkMode: false, theme: 'auto', showBalance: true },
  security: { autoLogout: true, autoLogoutMinutes: 15, biometricLogin: true, twoFactorEnabled: false },
  preferences: { language: 'English', currency: 'USD', timezone: 'America/New_York' },
}

function mergeSettings(value: unknown) {
  const input = value && typeof value === 'object' ? value as Record<string, unknown> : {}
  return {
    ...defaultSettings,
    ...input,
    notifications: { ...defaultSettings.notifications, ...(input.notifications as object || {}) },
    display: { ...defaultSettings.display, ...(input.display as object || {}) },
    security: { ...defaultSettings.security, ...(input.security as object || {}) },
    preferences: { ...defaultSettings.preferences, ...(input.preferences as object || {}) },
  }
}

async function getAuthenticatedUser() {
  const supabase = await createClient()
  const { data, error } = await supabase.auth.getUser()
  return { supabase, user: data.user, error }
}

export async function GET() {
  try {
    const { user, error } = await getAuthenticatedUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    return NextResponse.json({ success: true, settings: mergeSettings(user.user_metadata?.app_settings) })
  } catch (error) {
    console.error('[v0] Error fetching settings:', error)
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    const settings = mergeSettings(body.settings)
    const { error: updateError } = await supabase.auth.updateUser({
      data: { app_settings: settings },
    })
    if (updateError) return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
    return NextResponse.json({ success: true, message: 'Settings saved successfully', settings })
  } catch (error) {
    console.error('[v0] Error saving settings:', error)
    return NextResponse.json({ error: 'Failed to save settings' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { supabase, user, error } = await getAuthenticatedUser()
    if (error || !user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    const body = await request.json()
    if (typeof body.path !== 'string' || body.value === undefined) {
      return NextResponse.json({ error: 'Path and value are required' }, { status: 400 })
    }
    const keys = body.path.split('.')
    if (keys.length !== 2 || !['notifications', 'display', 'security', 'preferences'].includes(keys[0])) {
      return NextResponse.json({ error: 'Invalid setting path' }, { status: 400 })
    }
    const settings = mergeSettings(user.user_metadata?.app_settings)
    const section = settings[keys[0] as keyof typeof settings] as Record<string, unknown>
    if (!(keys[1] in section)) return NextResponse.json({ error: 'Invalid setting path' }, { status: 400 })
    section[keys[1]] = body.value
    const { error: updateError } = await supabase.auth.updateUser({ data: { app_settings: settings } })
    if (updateError) return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
    return NextResponse.json({ success: true, settings })
  } catch (error) {
    console.error('[v0] Error updating setting:', error)
    return NextResponse.json({ error: 'Failed to update setting' }, { status: 500 })
  }
}

import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { data: accounts, error } = await supabase
      .from("accounts")
      .select("*")
      .eq("user_id", user.id)
      .order("is_default", { ascending: false })
      .order("created_at", { ascending: false })

    if (error) throw error

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
      accountName,
      accountNumber,
      routingNumber,
      bankName,
      accountType = "checking",
      balance = "0.00",
    } = body

    if (!accountName || !accountNumber || !routingNumber || !bankName) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      )
    }

    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { count, error: countError } = await supabase
      .from("accounts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
    if (countError) throw countError

    const { data: newAccount, error } = await supabase
      .from("accounts")
      .insert({
        user_id: user.id,
        account_name: accountName,
        account_number: accountNumber,
        routing_number: routingNumber,
        bank_name: bankName,
        account_type: accountType,
        balance,
        is_default: (count ?? 0) === 0,
      })
      .select("*")
      .single()
    if (error) throw error

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

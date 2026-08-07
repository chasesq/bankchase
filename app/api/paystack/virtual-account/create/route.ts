import { NextRequest, NextResponse } from 'next/server'
import axios from 'axios'
import { createClient } from '@/lib/supabase/server'

const PAYSTACK_API_BASE = 'https://api.paystack.co'
const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY

if (!PAYSTACK_SECRET_KEY) {
  console.warn('[v0] PAYSTACK_SECRET_KEY not configured')
}

const paystackClient = axios.create({
  baseURL: PAYSTACK_API_BASE,
  headers: {
    'Authorization': `Bearer ${PAYSTACK_SECRET_KEY}`,
    'Content-Type': 'application/json'
  }
})

/**
 * POST /api/paystack/virtual-account/create
 * 
 * Generate/Fetch dedicated virtual account for a user
 * Two-step flow:
 * 1. Create/Register customer on Paystack using user's info
 * 2. Assign dedicated virtual account to that customer
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Fetch user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      console.error('[v0] User profile not found:', profileError)
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    // Check if virtual account already assigned
    if (userProfile.paystack_customer_code && userProfile.virtual_account_assigned) {
      console.log('[v0] Virtual account already assigned for user:', user.id)
      return NextResponse.json(
        {
          success: true,
          message: 'Virtual account already assigned',
          data: {
            accountNumber: userProfile.virtual_account_number,
            bankName: userProfile.virtual_bank_name,
            accountName: userProfile.virtual_account_name,
            assigned: true
          }
        },
        { status: 200 }
      )
    }

    let customerCode = userProfile.paystack_customer_code

    // STEP 1: Create Paystack customer if not registered yet
    if (!customerCode) {
      try {
        console.log('[v0] Creating Paystack customer for user:', user.email)
        const customerRes = await paystackClient.post('/customer', {
          email: user.email,
          first_name: userProfile.first_name || 'User',
          last_name: userProfile.last_name || (user.email ?? 'user@example.com').split('@')[0],
          phone: userProfile.phone_number || ''
        })

        if (!customerRes.data.status) {
          throw new Error(customerRes.data.message || 'Failed to create customer')
        }

        customerCode = customerRes.data.data.customer_code
        console.log('[v0] Paystack customer created:', customerCode)

        // Save customer code to profile
        await supabase
          .from('profiles')
          .update({ paystack_customer_code: customerCode })
          .eq('id', user.id)
      } catch (error: any) {
        console.error('[v0] Paystack customer creation failed:', error.response?.data || error.message)
        return NextResponse.json(
          {
            success: false,
            error: error.response?.data?.message || 'Failed to create Paystack customer'
          },
          { status: 400 }
        )
      }
    }

    // STEP 2: Assign dedicated virtual account
    try {
      console.log('[v0] Assigning dedicated virtual account for customer:', customerCode)
      const vaRes = await paystackClient.post('/dedicated_account', {
        customer: customerCode,
        preferred_bank: 'wema-bank' // Options: 'wema-bank', 'providus-bank'
      })

      if (!vaRes.data.status) {
        throw new Error(vaRes.data.message || 'Failed to assign virtual account')
      }

      const vaData = vaRes.data.data

      console.log('[v0] Virtual account assigned successfully:', vaData.account_number)

      // Save virtual account details to profile
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          virtual_account_number: vaData.account_number,
          virtual_bank_name: vaData.bank.name,
          virtual_bank_code: vaData.bank.code,
          virtual_account_name: vaData.account_name,
          virtual_account_assigned: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id)

      if (updateError) {
        console.error('[v0] Failed to save virtual account to profile:', updateError)
        throw updateError
      }

      return NextResponse.json(
        {
          success: true,
          message: 'Virtual bank account assigned successfully',
          data: {
            accountNumber: vaData.account_number,
            bankName: vaData.bank.name,
            accountName: vaData.account_name,
            assigned: true
          }
        },
        { status: 200 }
      )
    } catch (error: any) {
      console.error('[v0] Virtual account assignment failed:', error.response?.data || error.message)
      return NextResponse.json(
        {
          success: false,
          error: error.response?.data?.message || 'Failed to assign virtual account'
        },
        { status: 400 }
      )
    }
  } catch (error: any) {
    console.error('[v0] Virtual account creation error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Internal server error'
      },
      { status: 500 }
    )
  }
}

/**
 * GET /api/paystack/virtual-account/create
 * 
 * Retrieve user's existing virtual account details
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { data: userProfile, error: profileError } = await supabase
      .from('profiles')
      .select('virtual_account_number, virtual_bank_name, virtual_account_name, virtual_account_assigned')
      .eq('id', user.id)
      .single()

    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }

    if (!userProfile.virtual_account_assigned) {
      return NextResponse.json(
        { error: 'No virtual account assigned yet', assigned: false },
        { status: 404 }
      )
    }

    return NextResponse.json(
      {
        success: true,
        data: {
          accountNumber: userProfile.virtual_account_number,
          bankName: userProfile.virtual_bank_name,
          accountName: userProfile.virtual_account_name,
          assigned: true
        }
      },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('[v0] Failed to fetch virtual account:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

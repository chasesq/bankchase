import { redis } from '@/lib/redis'
import { getStripe } from '@/lib/stripe'

const stripe = process.env.STRIPE_SECRET_KEY ? getStripe() : null

export interface PaymentData {
  amount: number
  currency: string
  description: string
  senderEmail: string
  senderName: string
  recipientEmail: string
  recipientName: string
  recipientPhone?: string
}

export interface PaymentResult {
  success: boolean
  transactionId?: string
  paymentIntentId?: string
  status?: string
  message: string
  error?: string
}

export async function createPaymentIntent(data: PaymentData): Promise<PaymentResult> {
  try {
    return {
      success: false,
      message: 'Stripe payments are disabled. Use the Paystack checkout flow.',
      error: 'PAYSTACK_ONLY',
    }

    console.log('[v0] Stripe payment request blocked; Paystack is required:', data.recipientEmail)
    /* Legacy Stripe implementation retained below for reference.
    console.log('[v0] Creating payment intent for:', data.recipientEmail)

    // If Stripe is not configured, use demo mode
    if (!stripe) {
      const demoTransactionId = `txn_demo_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      console.log('[v0] Stripe not configured. Using demo transaction ID:', demoTransactionId)

      // Store demo transaction in Redis
      try {
        await redis.setex(
          `transaction:${demoTransactionId}`,
          86400,
          JSON.stringify({
            paymentIntentId: demoTransactionId,
            ...data,
            createdAt: new Date().toISOString(),
            status: 'succeeded',
            isDemo: true,
          })
        )
      } catch (e) {
        console.log('[v0] Redis unavailable, using in-memory storage')
      }

      return {
        success: true,
        paymentIntentId: demoTransactionId,
        status: 'succeeded',
        message: 'Payment processed successfully (Demo Mode)',
      }
    }

    // Create payment intent with metadata
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(data.amount * 100), // Convert to cents
      currency: data.currency.toLowerCase(),
      description: `P2P Transfer from ${data.senderName} to ${data.recipientName}: ${data.description}`,
      payment_method_types: ['card', 'us_bank_account'],
      metadata: {
        senderEmail: data.senderEmail,
        senderName: data.senderName,
        recipientEmail: data.recipientEmail,
        recipientName: data.recipientName,
        recipientPhone: data.recipientPhone || '',
        transactionType: 'p2p_transfer',
      },
    })

    console.log('[v0] Payment intent created:', paymentIntent.id)

    // Store transaction metadata in Redis for quick access
    const transactionKey = `transaction:${paymentIntent.id}`
    try {
      await redis.setex(
        transactionKey,
        86400, // 24 hours
        JSON.stringify({
          paymentIntentId: paymentIntent.id,
          ...data,
          createdAt: new Date().toISOString(),
          status: paymentIntent.status,
        })
      )
    } catch (e) {
      console.log('[v0] Redis unavailable, transaction data not cached')
    }

    return {
      success: true,
      paymentIntentId: paymentIntent.id,
      status: paymentIntent.status,
      message: 'Payment intent created successfully',
    }
    */
  } catch (error) {
    console.error('[v0] Payment intent creation error:', error)
    return {
      success: false,
      message: 'Failed to create payment intent',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function confirmPayment(
  paymentIntentId: string,
  paymentMethodId: string
): Promise<PaymentResult> {
  try {
    console.log('[v0] Confirming payment:', paymentIntentId)

    // If Stripe is not configured, use demo mode
    if (!stripe) {
      console.log('[v0] Stripe not configured. Using demo confirmation.')
      try {
        const transactionKey = `transaction:${paymentIntentId}`
        const existingData = await redis.get<any>(transactionKey)

        if (existingData) {
          await redis.setex(
            transactionKey,
            86400,
            JSON.stringify({
              ...existingData,
              status: 'succeeded',
              updatedAt: new Date().toISOString(),
            })
          )
        }
      } catch (e) {
        console.log('[v0] Redis unavailable for confirmation')
      }

      return {
        success: true,
        paymentIntentId,
        transactionId: paymentIntentId,
        status: 'succeeded',
        message: 'Payment completed successfully (Demo Mode)',
      }
    }

    // Confirm the payment intent with payment method
    const confirmedIntent = await stripe.paymentIntents.confirm(paymentIntentId, {
      payment_method: paymentMethodId,
    })

    console.log('[v0] Payment confirmed:', confirmedIntent.status)

    // Update transaction status in Redis
    const transactionKey = `transaction:${paymentIntentId}`
    try {
      const existingData = await redis.get<any>(transactionKey)

      if (existingData) {
        await redis.setex(
          transactionKey,
          86400,
          JSON.stringify({
            ...existingData,
            status: confirmedIntent.status,
            updatedAt: new Date().toISOString(),
          })
        )
      }
    } catch (e) {
      console.log('[v0] Redis unavailable for confirmation')
    }

    return {
      success: confirmedIntent.status === 'succeeded',
      paymentIntentId: confirmedIntent.id,
      transactionId: confirmedIntent.id,
      status: confirmedIntent.status ?? undefined,
      message:
        confirmedIntent.status === 'succeeded'
          ? 'Payment completed successfully'
          : `Payment status: ${confirmedIntent.status}`,
    }
  } catch (error) {
    console.error('[v0] Payment confirmation error:', error)
    return {
      success: false,
      message: 'Failed to confirm payment',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

export async function getPaymentStatus(paymentIntentId: string): Promise<any> {
  try {
    if (!stripe) return null
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId)
    return {
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount / 100, // Convert from cents
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata,
      created: paymentIntent.created,
    }
  } catch (error) {
    console.error('[v0] Error retrieving payment status:', error)
    return null
  }
}

export async function refundPayment(paymentIntentId: string): Promise<PaymentResult> {
  try {
    if (!stripe) return { success: false, message: 'Stripe is not configured' }
    console.log('[v0] Initiating refund for:', paymentIntentId)

    const refund = await stripe.refunds.create({
      payment_intent: paymentIntentId,
    })

    console.log('[v0] Refund initiated:', refund.id)

    return {
      success: true,
      transactionId: refund.id,
      status: refund.status ?? undefined,
      message: 'Refund initiated successfully',
    }
  } catch (error) {
    console.error('[v0] Refund error:', error)
    return {
      success: false,
      message: 'Failed to initiate refund',
      error: error instanceof Error ? error.message : 'Unknown error',
    }
  }
}

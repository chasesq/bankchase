const PAYPAL_API_BASE =
  process.env.PAYPAL_ENVIRONMENT === 'production'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com'

async function getAccessToken() {
  const clientId = process.env.PAYPAL_CLIENT_ID
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    throw new Error('PayPal credentials are not configured')
  }

  const response = await fetch(`${PAYPAL_API_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
    cache: 'no-store',
  })

  if (!response.ok) {
    throw new Error(`PayPal authentication failed (${response.status})`)
  }

  const data = (await response.json()) as { access_token: string }
  return data.access_token
}

async function paypalRequest<T>(path: string, init: RequestInit = {}) {
  const token = await getAccessToken()
  const response = await fetch(`${PAYPAL_API_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(init.headers || {}),
    },
    cache: 'no-store',
  })

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data && typeof data === 'object' && 'message' in data ? data.message : 'PayPal request failed'
    throw new Error(`${message} (${response.status})`)
  }

  return data as T
}

export type PayPalOrder = {
  id: string
  status: string
  links?: Array<{ href: string; rel: string; method: string }>
}

export async function createPayPalOrder(input: {
  amount: string
  currency: string
  description: string
  returnUrl: string
  cancelUrl: string
}) {
  return paypalRequest<PayPalOrder>('/v2/checkout/orders', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify({
      intent: 'CAPTURE',
      purchase_units: [{
        description: input.description,
        amount: { currency_code: input.currency, value: input.amount },
      }],
      application_context: {
        brand_name: 'BankChase',
        user_action: 'PAY_NOW',
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
    }),
  })
}

export async function capturePayPalOrder(orderId: string) {
  return paypalRequest<PayPalOrder>(`/v2/checkout/orders/${encodeURIComponent(orderId)}/capture`, {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: '{}',
  })
}

export function getPayPalApprovalUrl(order: PayPalOrder) {
  return order.links?.find((link) => link.rel === 'approve')?.href
}

export type PayPalLink = { href: string; rel: string; method?: string }

export async function createPayPalSubscription(input: {
  planId: string
  returnUrl: string
  cancelUrl: string
}) {
  return paypalRequest<{ id: string; status: string; links?: PayPalLink[] }>('/v1/billing/subscriptions', {
    method: 'POST',
    body: JSON.stringify({
      plan_id: input.planId,
      application_context: {
        brand_name: 'BankChase',
        user_action: 'SUBSCRIBE_NOW',
        return_url: input.returnUrl,
        cancel_url: input.cancelUrl,
      },
    }),
  })
}

export async function createPayPalPayout(input: {
  recipientEmail: string
  amount: string
  currency: string
  note: string
}) {
  return paypalRequest<{ batch_header: { payout_batch_id: string; batch_status: string }; links?: PayPalLink[] }>('/v1/payments/payouts', {
    method: 'POST',
    body: JSON.stringify({
      sender_batch_header: {
        sender_batch_id: `bankchase-${crypto.randomUUID()}`,
        email_subject: 'You have a payout from BankChase',
        email_message: input.note,
      },
      items: [{
        recipient_type: 'EMAIL',
        amount: { value: input.amount, currency: input.currency },
        receiver: input.recipientEmail,
        note: input.note,
        sender_item_id: `item-${crypto.randomUUID()}`,
      }],
    }),
  })
}

export async function createPayPalInvoice(input: {
  recipientEmail: string
  amount: string
  currency: string
  description: string
}) {
  return paypalRequest<{ id: string; status: string; href?: string }>('/v2/invoicing/invoices', {
    method: 'POST',
    body: JSON.stringify({
      detail: {
        invoice_number: `BC-${Date.now()}`,
        currency_code: input.currency,
        note: input.description,
        payment_term: { term_type: 'NET_30' },
      },
      primary_recipients: [{
        billing_info: { email_address: input.recipientEmail },
      }],
      items: [{
        name: input.description,
        quantity: '1',
        unit_amount: { currency_code: input.currency, value: input.amount },
      }],
    }),
  })
}

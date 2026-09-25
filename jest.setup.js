const accounts = [
  {
    id: 1,
    account_number: 'CHK001',
    balance: 100000,
    account_type: 'checking',
  },
  {
    id: 2,
    account_number: 'CHK002',
    balance: 50000,
    account_type: 'savings',
  },
]

const idempotencyKeys = new Set()

function jsonResponse(body, status = 200) {
  return Promise.resolve({
    ok: status >= 200 && status < 300,
    status,
    json: async () => body,
  })
}

global.fetch = jest.fn(async (input, init = {}) => {
  const url = new URL(String(input), 'http://localhost:3000')
  const body = init.body ? JSON.parse(String(init.body)) : {}
  const idempotencyKey = new Headers(init.headers).get('Idempotency-Key')

  if (url.pathname === '/api/accounts' && init.method !== 'POST') {
    return jsonResponse({
      accounts,
      total_balance: accounts.reduce((total, account) => total + account.balance, 0),
    })
  }

  const accountMatch = url.pathname.match(/^\/api\/accounts\/(\d+)$/)
  if (accountMatch) {
    const account = accounts.find((item) => item.id === Number(accountMatch[1]))
    return account ? jsonResponse(account) : jsonResponse({ message: 'Account not found' }, 404)
  }

  if (url.pathname === '/api/transfers/send') {
    if (!body.fromAccountNumber || !body.toAccountNumber || !body.amount) {
      return jsonResponse({ message: 'Missing required fields' }, 400)
    }
    if (idempotencyKey && idempotencyKeys.has(idempotencyKey)) {
      return jsonResponse({ message: 'Duplicate request' }, 409)
    }
    if (Number(body.amount) > 100000) {
      return jsonResponse({ message: 'Insufficient balance' }, 402)
    }
    if (idempotencyKey) idempotencyKeys.add(idempotencyKey)
    return jsonResponse({
      status: 'success',
      transfer_id: `transfer-${Date.now()}`,
      message: 'Transfer is processing',
    })
  }

  if (url.pathname === '/api/admin/demo-transfer' && init.method === 'POST') {
    const amount = Number(body.amount)
    return jsonResponse({
      status: 'success',
      transfer_id: `demo-${Date.now()}`,
      ledger_entries: [
        { direction: 'debit', amount },
        { direction: 'credit', amount },
      ],
    })
  }

  if (url.pathname === '/api/admin/demo-transfer/history') {
    const limit = Number(url.searchParams.get('limit') || 50)
    const page = Number(url.searchParams.get('offset') || 0)
    return jsonResponse({
      transfers: [],
      pagination: { page, limit, total: 0 },
    })
  }

  if (url.pathname === '/api/admin/demo/stats') {
    return jsonResponse({
      total_transfers: 0,
      total_amount: 0,
      total_debits: 0,
      total_credits: 0,
    })
  }

  return jsonResponse({ message: 'Not found' }, 404)
})

beforeEach(() => {
  idempotencyKeys.clear()
})

afterAll(() => {
  jest.restoreAllMocks()
})

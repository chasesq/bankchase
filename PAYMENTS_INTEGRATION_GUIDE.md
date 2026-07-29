# Payments Integration Quick Start Guide

Complete step-by-step guide to integrate money transfer APIs into your BankChase application.

## Prerequisites

- Node.js 16+ with npm or yarn
- Supabase/PostgreSQL database with schema
- Paystack account (sandbox or live)
- Valid API keys configured

---

## 1. Setup Paystack Account

### 1.1 Create Paystack Account
1. Go to https://paystack.com
2. Sign up for a free account
3. Verify your email

### 1.2 Get API Keys
1. Log into Paystack dashboard
2. Go to **Settings > Developers > API Keys & Webhooks**
3. Copy **Test Secret Key** (starts with `sk_test_`)
4. Copy **Test Public Key** (starts with `pk_test_`)

### 1.3 Configure Webhook
1. In Paystack dashboard, go to **Settings > Developers > Webhook URL**
2. Set URL to: `https://yourdomain.com/api/paystack/webhooks`
3. Select events:
   - `charge.success` (for incoming deposits)
   - `transfer.success` (for outgoing transfers)
   - `transfer.failed` (for failed transfers)
4. Click **Save**

---

## 2. Configure Environment Variables

### 2.1 Copy Environment Template
```bash
cp .env.payments.example .env.local
```

### 2.2 Update with Your Paystack Keys
```bash
# .env.local
PAYSTACK_SECRET_KEY=sk_test_YOUR_SECRET_KEY
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_YOUR_PUBLIC_KEY
```

### 2.3 Verify Database Connection
```bash
# Make sure DATABASE_URL is set correctly
DATABASE_URL=postgresql://user:password@hostname/dbname
```

---

## 3. Database Schema Setup

### 3.1 Create Required Tables

Run these migrations in your Supabase console:

```sql
-- 1. Update profiles table to include payment fields
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS (
  wallet_balance TEXT DEFAULT '0',
  paystack_customer_code TEXT,
  virtual_account_assigned BOOLEAN DEFAULT false,
  virtual_account_number TEXT,
  virtual_bank_name TEXT,
  virtual_bank_code TEXT,
  virtual_account_name TEXT
);

-- 2. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_id UUID REFERENCES auth.users(id),
  type TEXT NOT NULL, -- 'transfer', 'deposit', 'payment', 'withdrawal', 'bank_transfer'
  amount TEXT NOT NULL,
  currency TEXT DEFAULT 'NGN',
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  reference TEXT UNIQUE,
  transfer_code TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_account TEXT,
  recipient_bank_code TEXT,
  channel TEXT,
  narration TEXT,
  transfer_type TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  completed_at TIMESTAMP
);

-- 3. Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL, -- 'transfer_sent', 'transfer_received', 'deposit_received', 'payment_sent', 'payment_received'
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  transaction_id UUID REFERENCES transactions(id),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT NOW()
);

-- 4. Create indexes for performance
CREATE INDEX idx_transactions_user_id ON transactions(user_id);
CREATE INDEX idx_transactions_status ON transactions(status);
CREATE INDEX idx_transactions_reference ON transactions(reference);
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_read ON notifications(read);
```

### 3.2 Enable Row Level Security (RLS)

```sql
-- Enable RLS on transactions
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own transactions
CREATE POLICY "Users can read own transactions"
ON transactions FOR SELECT
USING (auth.uid() = user_id);

-- Enable RLS on notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Allow users to read their own notifications
CREATE POLICY "Users can read own notifications"
ON notifications FOR SELECT
USING (auth.uid() = user_id);
```

---

## 4. Test the APIs

### 4.1 Start Dev Server
```bash
npm run dev
# or
yarn dev
```

### 4.2 Test Virtual Account Creation

```bash
# Get your auth token first (from login)
TOKEN="your_jwt_token_here"

curl -X POST http://localhost:3000/api/paystack/virtual-account/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Expected Response:**
```json
{
  "success": true,
  "message": "Virtual bank account assigned successfully",
  "data": {
    "accountNumber": "0123456789",
    "bankName": "Wema Bank",
    "accountName": "YOUR NAME",
    "assigned": true
  }
}
```

### 4.3 Test Send Transfer

```bash
curl -X POST http://localhost:3000/api/transfers/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountId": "account_123",
    "toAccountNumber": "0123456789",
    "toBankCode": "058",
    "amount": 1000,
    "recipientName": "John Doe",
    "narration": "Test transfer"
  }'
```

### 4.4 Test Send Payment

```bash
curl -X POST http://localhost:3000/api/payments/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "Your Name",
    "senderEmail": "you@example.com",
    "recipientName": "John Doe",
    "recipientEmail": "john@example.com",
    "amount": 5000,
    "currency": "NGN",
    "description": "Test payment"
  }'
```

### 4.5 Test Money Movement Status

```bash
curl http://localhost:3000/api/transfers/money-movement/status \
  -H "Authorization: Bearer $TOKEN"
```

---

## 5. Integrate Into UI Components

### 5.1 Virtual Account Display Component

```tsx
// components/virtual-account-display.tsx
import { useEffect, useState } from 'react'

export function VirtualAccountDisplay() {
  const [account, setAccount] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchAccount() {
      const response = await fetch('/api/paystack/virtual-account/create', {
        method: 'POST'
      })
      const data = await response.json()
      if (data.success) {
        setAccount(data.data)
      }
      setLoading(false)
    }

    fetchAccount()
  }, [])

  if (loading) return <div>Loading...</div>

  if (!account) return <div>Failed to load virtual account</div>

  return (
    <div className="p-6 bg-white rounded-lg shadow">
      <h2 className="text-xl font-bold mb-4">Your Virtual Account</h2>
      <div className="space-y-2">
        <p><strong>Account Number:</strong> {account.accountNumber}</p>
        <p><strong>Bank:</strong> {account.bankName}</p>
        <p><strong>Account Name:</strong> {account.accountName}</p>
      </div>
      <p className="text-sm text-gray-600 mt-4">
        Transfer money to this account to fund your wallet
      </p>
    </div>
  )
}
```

### 5.2 Send Money Form Component

```tsx
// components/send-money-form.tsx
import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function SendMoneyForm() {
  const [formData, setFormData] = useState({
    toAccountNumber: '',
    toBankCode: '',
    recipientName: '',
    amount: '',
    narration: ''
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('/api/transfers/send', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fromAccountId: 'user_account',
          ...formData,
          amount: parseFloat(formData.amount)
        })
      })

      const data = await response.json()

      if (data.success) {
        // Redirect to success page with transaction ID
        router.push(`/transfer-success/${data.transactionId}`)
      } else {
        setError(data.error || 'Transfer failed')
      }
    } catch (err) {
      setError('An error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 bg-white rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-6">Send Money</h2>

      {error && (
        <div className="mb-4 p-4 bg-red-100 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        <input
          type="text"
          placeholder="Recipient Name"
          value={formData.recipientName}
          onChange={(e) => setFormData({...formData, recipientName: e.target.value})}
          required
          className="w-full p-2 border rounded"
        />

        <input
          type="text"
          placeholder="Account Number"
          value={formData.toAccountNumber}
          onChange={(e) => setFormData({...formData, toAccountNumber: e.target.value})}
          required
          className="w-full p-2 border rounded"
        />

        <input
          type="text"
          placeholder="Bank Code (e.g., 058)"
          value={formData.toBankCode}
          onChange={(e) => setFormData({...formData, toBankCode: e.target.value})}
          required
          className="w-full p-2 border rounded"
        />

        <input
          type="number"
          placeholder="Amount"
          value={formData.amount}
          onChange={(e) => setFormData({...formData, amount: e.target.value})}
          required
          className="w-full p-2 border rounded"
        />

        <textarea
          placeholder="Description"
          value={formData.narration}
          onChange={(e) => setFormData({...formData, narration: e.target.value})}
          className="w-full p-2 border rounded"
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full p-3 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? 'Processing...' : 'Send Money'}
        </button>
      </div>
    </form>
  )
}
```

### 5.3 Transaction History Component

```tsx
// components/transaction-history.tsx
import { useEffect, useState } from 'react'

export function TransactionHistory() {
  const [transactions, setTransactions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchTransactions() {
      const response = await fetch('/api/transfers/money-movement/status?limit=10')
      const data = await response.json()

      if (data.success) {
        setTransactions(data.transactions)
      }

      setLoading(false)
    }

    fetchTransactions()
  }, [])

  if (loading) return <div>Loading...</div>

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Recent Transactions</h2>

      <div className="space-y-2">
        {transactions.map(tx => (
          <div key={tx.id} className="p-4 border rounded hover:bg-gray-50">
            <div className="flex justify-between">
              <div>
                <p className="font-semibold">{tx.recipient.name}</p>
                <p className="text-sm text-gray-600">{tx.type}</p>
              </div>
              <div className="text-right">
                <p className="font-semibold">₦{tx.amount.toFixed(2)}</p>
                <p className={`text-sm ${tx.status === 'completed' ? 'text-green-600' : 'text-yellow-600'}`}>
                  {tx.status}
                </p>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              {new Date(tx.timestamps.created).toLocaleString()}
            </p>
          </div>
        ))}
      </div>
    </div>
  )
}
```

---

## 6. Deploy to Production

### 6.1 Update Environment for Production

```bash
# .env.production
PAYSTACK_SECRET_KEY=sk_live_YOUR_LIVE_SECRET_KEY
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_live_YOUR_LIVE_PUBLIC_KEY
DATABASE_URL=postgresql://prod_user:prod_password@prod_host/prod_db
```

### 6.2 Deploy to Vercel

```bash
git add .
git commit -m "Add money transfer APIs"
git push origin main
```

Vercel will automatically deploy. Add environment variables in Vercel dashboard:
- `PAYSTACK_SECRET_KEY`
- `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`

### 6.3 Update Paystack Webhook URL

In Paystack dashboard:
1. Go to **Settings > Developers > Webhook URL**
2. Change to: `https://yourdomain.vercel.app/api/paystack/webhooks`

---

## 7. Monitoring & Debugging

### 7.1 Check Logs
```bash
# Development
tail -f v0_debug_logs.log | grep "\[v0\]"

# Production (Vercel)
vercel logs
```

### 7.2 Test Webhook (Paystack Sandbox)

Go to Paystack dashboard > Testing > Charge Test
- Send a test charge
- Should trigger `charge.success` webhook

### 7.3 Common Issues

**Issue:** `PAYSTACK_SECRET_KEY not configured`
- **Fix:** Add environment variable to `.env.local`

**Issue:** Webhook not received
- **Fix:** Verify webhook URL is correct in Paystack dashboard
- **Fix:** Check firewall/CORS settings

**Issue:** "Invalid bank account details"
- **Fix:** Verify bank code is correct (e.g., GTB = 058, Access = 044)
- **Fix:** Ensure account number is valid NUBAN format (10 digits)

**Issue:** Transfer rejected
- **Fix:** Check insufficient balance error first
- **Fix:** Verify recipient account exists in bank

---

## Support & Resources

- **Paystack Documentation:** https://paystack.com/docs/api/
- **Paystack Test Cards:** https://paystack.com/docs/developers/test-keys/
- **BankChase API Docs:** See `MONEY_TRANSFER_API_DOCS.md`
- **GitHub Issues:** Create issue on your repository

---

## Next Steps

1. ✅ Setup Paystack account
2. ✅ Configure environment variables
3. ✅ Create database schema
4. ✅ Test API endpoints
5. ✅ Integrate UI components
6. ✅ Deploy to production
7. ✅ Monitor and debug issues

Your money transfer system is ready! 🎉

# Money Transfer & Payment APIs Documentation

Complete guide for implementing and using the BankChase money transfer, payment, and money movement APIs.

## Table of Contents

1. [Overview](#overview)
2. [Paystack Virtual Account API](#paystack-virtual-account-api)
3. [Transfer/Send Money API](#transfersend-money-api)
4. [Payments/Send Money API](#paymentssend-money-api)
5. [Money Movement Status API](#money-movement-status-api)
6. [Paystack Webhooks](#paystack-webhooks)
7. [Error Handling](#error-handling)
8. [Integration Examples](#integration-examples)
9. [Testing](#testing)

---

## Overview

The BankChase payment system provides three main APIs:

| API | Purpose | Use Case |
|-----|---------|----------|
| **Paystack Virtual Account** | Generate dedicated virtual accounts for users | Receive deposits via bank transfers |
| **Transfers/Send** | Send money to bank accounts | Transfer funds to external accounts |
| **Payments/Send** | Send payments to other users | P2P transfers, wallet-to-wallet |
| **Money Movement Status** | Track transaction status and history | View all money movements |

---

## Paystack Virtual Account API

### Create/Get Virtual Account

**Endpoint:** `POST /api/paystack/virtual-account/create`

**Authentication:** Required (Bearer token)

**Description:** 
Creates a dedicated virtual account for a user on Paystack. Two-step process:
1. Register customer on Paystack
2. Assign dedicated virtual account

**Request Body:**
```json
{
  // No body required - uses authenticated user's profile
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Virtual bank account assigned successfully",
  "data": {
    "accountNumber": "0123456789",
    "bankName": "Wema Bank",
    "accountName": "JOHN DOE",
    "assigned": true
  }
}
```

**Response (Already Assigned):**
```json
{
  "success": true,
  "message": "Virtual account already assigned",
  "data": {
    "accountNumber": "0123456789",
    "bankName": "Wema Bank",
    "accountName": "JOHN DOE",
    "assigned": true
  }
}
```

**Error Responses:**
- `401`: Unauthorized
- `404`: User profile not found
- `400`: Paystack API error

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/paystack/virtual-account/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### Get Existing Virtual Account

**Endpoint:** `GET /api/paystack/virtual-account/create`

**Authentication:** Required

**Description:** Retrieve user's existing virtual account details

**Response:**
```json
{
  "success": true,
  "data": {
    "accountNumber": "0123456789",
    "bankName": "Wema Bank",
    "accountName": "JOHN DOE",
    "assigned": true
  }
}
```

---

## Transfer/Send Money API

### Send Money to Bank Account

**Endpoint:** `POST /api/transfers/send`

**Authentication:** Required

**Description:**
Enhanced transfer endpoint with real-time balance updates and Paystack integration. Attempts Paystack first for bank transfers, falls back to internal transfers.

**Request Body:**
```json
{
  "fromAccountId": "account_123",
  "toAccountNumber": "0123456789",
  "toBankCode": "058",
  "amount": 50000,
  "recipientName": "John Doe",
  "narration": "Payment for services",
  "transferType": "bank_transfer"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| fromAccountId | string | Yes | Sender's account ID |
| toAccountNumber | string | Yes | Recipient's bank account number (NUBAN) |
| toBankCode | string | Yes | Bank code (e.g., "058" for GTB) |
| amount | number | Yes | Amount in major units (₦50,000) |
| recipientName | string | Yes | Recipient's full name |
| narration | string | No | Transaction description |
| transferType | string | No | "bank_transfer" or "internal" |

**Response (Success):**
```json
{
  "success": true,
  "message": "Transfer initiated successfully",
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "reference": "TXN_550e8400-e29b-41d4-a716-446655440000",
  "status": "processing",
  "details": {
    "amount": 50000,
    "recipientName": "John Doe",
    "recipientAccount": "0123456789",
    "narration": "Payment for services"
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Insufficient balance. Available: ₦10,000, Required: ₦50,000"
}
```

Status Codes:
- `200`: Success
- `400`: Validation error (insufficient funds, invalid amount, missing fields)
- `401`: Unauthorized
- `404`: Account not found
- `500`: Server error

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/transfers/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "fromAccountId": "account_123",
    "toAccountNumber": "0123456789",
    "toBankCode": "058",
    "amount": 50000,
    "recipientName": "John Doe",
    "narration": "Payment for services"
  }'
```

---

## Payments/Send Money API

### Send Payment to User or Recipient

**Endpoint:** `POST /api/payments/send`

**Authentication:** Required

**Description:**
Send money to another user's wallet or external recipient. If recipient has an app account, funds are credited immediately. Otherwise, payment is recorded for recipient notification.

**Request Body:**
```json
{
  "senderName": "Jane Smith",
  "senderEmail": "jane@example.com",
  "recipientName": "John Doe",
  "recipientEmail": "john@example.com",
  "recipientPhoneNumber": "+234801234567",
  "amount": 25000,
  "currency": "NGN",
  "description": "Lunch reimbursement",
  "transferType": "wallet_transfer"
}
```

**Parameters:**
| Field | Type | Required | Description |
|-------|------|----------|-------------|
| senderName | string | Yes | Sender's full name |
| senderEmail | string | Yes | Sender's email |
| recipientName | string | Yes | Recipient's full name |
| recipientEmail | string | Yes | Recipient's email |
| recipientPhoneNumber | string | No | Recipient's phone number |
| amount | number | Yes | Amount to send |
| currency | string | No | Currency code (default: "NGN") |
| description | string | Yes | Payment description/reason |
| transferType | string | No | "wallet_transfer", "bank_transfer", "mobile_money" |

**Response (Success):**
```json
{
  "success": true,
  "message": "Payment sent successfully",
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "details": {
    "amount": 25000,
    "currency": "NGN",
    "recipient": "John Doe",
    "senderNewBalance": 75000,
    "timestamp": "2024-07-28T10:30:00Z"
  }
}
```

**Error Responses:**
```json
{
  "success": false,
  "error": "Insufficient balance. Available: 10000, Required: 25000"
}
```

Status Codes:
- `200`: Success
- `400`: Validation error
- `401`: Unauthorized
- `404`: Sender profile not found
- `500`: Server error

**cURL Example:**
```bash
curl -X POST http://localhost:3000/api/payments/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "Jane Smith",
    "senderEmail": "jane@example.com",
    "recipientName": "John Doe",
    "recipientEmail": "john@example.com",
    "amount": 25000,
    "currency": "NGN",
    "description": "Lunch reimbursement"
  }'
```

---

## Money Movement Status API

### Get Transaction Status and History

**Endpoint:** `GET /api/transfers/money-movement/status`

**Authentication:** Required

**Description:**
Get comprehensive transaction status, history, and summaries with pagination and filtering.

**Query Parameters:**
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| transactionId | string | - | Get specific transaction |
| reference | string | - | Get transaction by reference |
| limit | number | 50 | Transactions per page (max 100) |
| offset | number | 0 | Pagination offset |
| status | string | - | Filter: completed, processing, failed, pending |
| type | string | - | Filter: transfer, deposit, payment, withdrawal |

**Response (All Transactions):**
```json
{
  "success": true,
  "transactions": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440000",
      "type": "transfer",
      "status": "completed",
      "amount": 50000,
      "currency": "NGN",
      "recipient": {
        "name": "John Doe",
        "email": "john@example.com",
        "account": "0123456789",
        "bankCode": "058"
      },
      "reference": "TXN_550e8400",
      "description": "Payment for services",
      "timestamps": {
        "created": "2024-07-28T10:00:00Z",
        "updated": "2024-07-28T10:30:00Z",
        "completed": "2024-07-28T10:30:00Z"
      }
    }
  ],
  "pagination": {
    "limit": 50,
    "offset": 0,
    "total": 150,
    "hasMore": true
  },
  "summary": {
    "totalTransactions": 50,
    "transactionCounts": {
      "all": 50,
      "completed": 45,
      "processing": 3,
      "failed": 2
    },
    "totalAmounts": {
      "sent": "500000.00",
      "received": "750000.00",
      "net": "250000.00"
    }
  },
  "_links": {
    "next": "/api/transfers/money-movement/status?limit=50&offset=50",
    "prev": null
  }
}
```

**Response (Single Transaction):**
```json
{
  "success": true,
  "transaction": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "type": "transfer",
    "status": "processing",
    "amount": 50000,
    "currency": "NGN",
    "recipient": {
      "name": "John Doe",
      "email": "john@example.com",
      "account": "0123456789",
      "bankCode": "058"
    },
    "reference": "TXN_550e8400",
    "transferCode": "TRF_12345",
    "description": "Payment for services",
    "channel": "bank_transfer",
    "timestamps": {
      "created": "2024-07-28T10:00:00Z",
      "updated": "2024-07-28T10:30:00Z",
      "completed": null
    }
  }
}
```

**cURL Examples:**

Get all transactions:
```bash
curl http://localhost:3000/api/transfers/money-movement/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Get specific transaction:
```bash
curl "http://localhost:3000/api/transfers/money-movement/status?transactionId=550e8400-e29b-41d4-a716-446655440000" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

Get transactions by status:
```bash
curl "http://localhost:3000/api/transfers/money-movement/status?status=completed&limit=100" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Paystack Webhooks

### Webhook Events

**Endpoint:** `POST /api/paystack/webhooks`

**Authentication:** HMAC-SHA512 signature verification (no bearer token)

**Supported Events:**

#### 1. `charge.success` - Incoming Virtual Account Deposit
```json
{
  "event": "charge.success",
  "data": {
    "reference": "deposit_ref_123",
    "amount": 5000000,
    "customer": {
      "customer_code": "CUS_123456"
    },
    "channel": "dedicated_nuban"
  }
}
```

**Processing:**
- Credits user's wallet balance
- Creates deposit transaction record
- Sends notification to user

#### 2. `transfer.success` - Outgoing Transfer Completed
```json
{
  "event": "transfer.success",
  "data": {
    "reference": "TXN_550e8400",
    "transfer_code": "TRF_12345",
    "recipient": {
      "name": "John Doe"
    }
  }
}
```

**Processing:**
- Updates transaction status to "completed"
- Sends completion notification

#### 3. `transfer.failed` - Transfer Failed
```json
{
  "event": "transfer.failed",
  "data": {
    "reference": "TXN_550e8400",
    "reason": "Insufficient funds"
  }
}
```

**Processing:**
- Marks transaction as failed
- Refunds wallet balance
- Sends failure notification

### Webhook Verification

All webhooks are verified using HMAC-SHA512 signature:

```typescript
// Verification process
const hash = crypto
  .createHmac('sha512', PAYSTACK_SECRET_KEY)
  .update(rawBody)
  .digest('hex')

if (hash !== request.headers['x-paystack-signature']) {
  // Invalid signature - reject
}
```

---

## Error Handling

### Common Error Responses

**Unauthorized:**
```json
{
  "error": "Unauthorized",
  "status": 401
}
```

**Validation Error:**
```json
{
  "success": false,
  "error": "Missing required fields: accountNumber, bankCode, recipientName, amount",
  "status": 400
}
```

**Insufficient Balance:**
```json
{
  "success": false,
  "error": "Insufficient balance. Available: ₦10,000, Required: ₦50,000",
  "status": 400
}
```

**Invalid Account:**
```json
{
  "success": false,
  "error": "Invalid bank account details",
  "status": 400
}
```

**Server Error:**
```json
{
  "success": false,
  "error": "Internal server error while processing transfer",
  "details": "[error message in dev mode]",
  "status": 500
}
```

---

## Integration Examples

### Example 1: Create Virtual Account and Display to User

```typescript
async function setupVirtualAccount() {
  const response = await fetch('/api/paystack/virtual-account/create', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    }
  })

  const data = await response.json()

  if (data.success) {
    console.log('Your virtual account:')
    console.log(`Account Number: ${data.data.accountNumber}`)
    console.log(`Bank: ${data.data.bankName}`)
    console.log(`Account Name: ${data.data.accountName}`)
  }
}
```

### Example 2: Send Money to Bank Account

```typescript
async function sendMoneyToBank(
  accountNumber: string,
  bankCode: string,
  amount: number,
  recipientName: string
) {
  const response = await fetch('/api/transfers/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      fromAccountId: 'user_account_id',
      toAccountNumber: accountNumber,
      toBankCode: bankCode,
      amount: amount,
      recipientName: recipientName,
      narration: 'Transfer via BankChase'
    })
  })

  const data = await response.json()

  if (data.success) {
    console.log(`Transfer initiated: ${data.reference}`)
    console.log(`Status: ${data.status}`)
  } else {
    console.error(`Error: ${data.error}`)
  }
}
```

### Example 3: Send Payment to Another User

```typescript
async function sendPaymentToUser(
  recipientEmail: string,
  amount: number,
  reason: string
) {
  const response = await fetch('/api/payments/send', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      senderName: 'Jane Smith',
      senderEmail: 'jane@example.com',
      recipientName: 'John Doe',
      recipientEmail: recipientEmail,
      amount: amount,
      currency: 'NGN',
      description: reason,
      transferType: 'wallet_transfer'
    })
  })

  const data = await response.json()

  if (data.success) {
    console.log(`Payment sent successfully`)
    console.log(`New balance: ${data.details.senderNewBalance}`)
  }
}
```

### Example 4: Check Transaction Status

```typescript
async function checkTransactionStatus(transactionId: string) {
  const response = await fetch(
    `/api/transfers/money-movement/status?transactionId=${transactionId}`,
    {
      headers: {
        'Authorization': `Bearer ${accessToken}`
      }
    }
  )

  const data = await response.json()

  if (data.success) {
    const tx = data.transaction
    console.log(`Status: ${tx.status}`)
    console.log(`Amount: ${tx.amount}`)
    console.log(`Recipient: ${tx.recipient.name}`)
    console.log(`Completed: ${tx.timestamps.completed || 'Pending'}`)
  }
}
```

### Example 5: View Transaction History

```typescript
async function getTransactionHistory(
  statusFilter?: string,
  typeFilter?: string
) {
  let url = '/api/transfers/money-movement/status?limit=50'

  if (statusFilter) url += `&status=${statusFilter}`
  if (typeFilter) url += `&type=${typeFilter}`

  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  const data = await response.json()

  if (data.success) {
    console.log(`Total transactions: ${data.pagination.total}`)
    console.log(`Sent: ${data.summary.totalAmounts.sent}`)
    console.log(`Received: ${data.summary.totalAmounts.received}`)
    console.log(`Net: ${data.summary.totalAmounts.net}`)

    data.transactions.forEach(tx => {
      console.log(`${tx.type.toUpperCase()}: ${tx.amount} - ${tx.status}`)
    })
  }
}
```

---

## Testing

### Test with Sandbox Credentials

1. **Get Paystack Test Keys**
   - Register at paystack.com
   - Go to Settings > API Keys & Webhooks
   - Copy Test Secret Key

2. **Set Environment Variables**
   ```bash
   PAYSTACK_SECRET_KEY=sk_test_xxxxx
   ```

3. **Test Virtual Account Creation**
   ```bash
   curl -X POST http://localhost:3000/api/paystack/virtual-account/create \
     -H "Authorization: Bearer test_token" \
     -H "Content-Type: application/json"
   ```

4. **Monitor Logs**
   ```bash
   # In development, check console for [v0] logs
   tail -f logs/dev.log | grep "\[v0\]"
   ```

### Simulate Incoming Deposit Webhook

```bash
curl -X POST http://localhost:3000/api/paystack/webhooks \
  -H "x-paystack-signature: computed_signature" \
  -H "Content-Type: application/json" \
  -d '{
    "event": "charge.success",
    "data": {
      "reference": "test_deposit_123",
      "amount": 5000000,
      "customer": {
        "customer_code": "CUS_123456"
      },
      "channel": "dedicated_nuban"
    }
  }'
```

---

## Database Schema Requirements

Ensure your Supabase/database has these tables:

```sql
-- Profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY,
  email TEXT,
  wallet_balance TEXT DEFAULT '0',
  paystack_customer_code TEXT,
  virtual_account_assigned BOOLEAN DEFAULT false,
  virtual_account_number TEXT,
  virtual_bank_name TEXT,
  virtual_account_name TEXT,
  updated_at TIMESTAMP
);

-- Transactions table
CREATE TABLE transactions (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  recipient_id UUID REFERENCES profiles(id),
  type TEXT,
  amount TEXT,
  currency TEXT DEFAULT 'NGN',
  status TEXT,
  reference TEXT UNIQUE,
  transfer_code TEXT,
  recipient_name TEXT,
  recipient_email TEXT,
  recipient_phone TEXT,
  recipient_account TEXT,
  recipient_bank_code TEXT,
  channel TEXT,
  failure_reason TEXT,
  created_at TIMESTAMP,
  updated_at TIMESTAMP,
  completed_at TIMESTAMP
);

-- Notifications table
CREATE TABLE notifications (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES profiles(id),
  type TEXT,
  title TEXT,
  message TEXT,
  transaction_id UUID REFERENCES transactions(id),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP
);
```

---

## Support

For issues or questions:
1. Check logs: `tail -f v0_debug_logs.log`
2. Verify Paystack keys are set correctly
3. Ensure database schema matches requirements
4. Check Paystack webhook configuration in dashboard

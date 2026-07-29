# Notification System API Reference

Complete API reference for the multi-channel notification system.

## Overview

The notification system automatically sends alerts across three channels when money movement events occur:

- **Email** (Resend) - Transactional emails with rich formatting
- **SMS** (Termii) - 160-character text alerts  
- **Push** (In-app) - Real-time notifications shown in app

All notifications are triggered asynchronously without blocking the transaction flow.

## Notification Types

### 1. Credit Alert
Sent when user **receives money**

**Triggers:**
- Incoming bank transfer to virtual account
- P2P payment from another user
- System deposit

**Channels:** Email, SMS, Push

### 2. Debit Alert
Sent when user **sends money**

**Triggers:**
- Send money via bank transfer
- P2P payment to another user
- Any debit transaction

**Channels:** Email, SMS, Push

### 3. Transfer Failed Alert
Sent when **transfer fails**

**Triggers:**
- Bank transfer rejection
- Insufficient balance (already checked)
- Network error during transfer

**Channels:** Email, SMS, Push

### 4. Deposit Notification
Sent when money is **deposited to virtual account**

**Triggers:**
- Receiving bank transfers to NUBAN
- Virtual account credit

**Channels:** Email, SMS, Push

---

## API Endpoints

### Get User Notifications

Retrieve paginated list of user's notifications.

```http
GET /api/notifications?limit=20&offset=0&unreadOnly=false
```

**Query Parameters:**
- `limit` (number, default: 20) - Notifications per page
- `offset` (number, default: 0) - Pagination offset
- `unreadOnly` (boolean, default: false) - Show only unread

**Response:**
```json
{
  "success": true,
  "notifications": [
    {
      "id": "uuid",
      "user_id": "uuid",
      "type": "credit",
      "title": "Money Received",
      "message": "You received ₦5,000 from John Doe",
      "data": {
        "transactionId": "tx_xxx",
        "amount": 5000,
        "currency": "NGN",
        "reference": "REF_XXX"
      },
      "action_url": "/dashboard/transactions/tx_xxx",
      "read": false,
      "created_at": "2024-01-15T10:30:00Z"
    }
  ],
  "total": 45,
  "hasMore": true
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Unauthorized"
}
```

---

### Get Single Notification

Retrieve a specific notification by ID.

```http
GET /api/notifications/:id
```

**Response:**
```json
{
  "success": true,
  "notification": {
    "id": "uuid",
    "user_id": "uuid",
    "type": "debit",
    "title": "Money Sent",
    "message": "You sent ₦2,500 to Jane Smith",
    "read": false,
    "created_at": "2024-01-15T10:25:00Z"
  }
}
```

---

### Mark Notification as Read

Mark a single notification as read.

```http
PUT /api/notifications/:id/read
```

**Response:**
```json
{
  "success": true,
  "message": "Notification marked as read"
}
```

---

### Mark All Notifications as Read

Mark all unread notifications as read for current user.

```http
PUT /api/notifications/read-all
```

**Response:**
```json
{
  "success": true,
  "message": "All notifications marked as read"
}
```

---

### Delete Notification

Delete a notification.

```http
DELETE /api/notifications/:id
```

**Response:**
```json
{
  "success": true,
  "message": "Notification deleted"
}
```

---

## Webhook Events

### Paystack Webhooks

The system automatically listens for these Paystack events:

#### charge.success
Triggered when money is deposited to a virtual account.

**Payload:**
```json
{
  "event": "charge.success",
  "data": {
    "reference": "txref_123",
    "amount": 500000,
    "customer": {
      "customer_code": "CUS_xxxx"
    },
    "channel": "dedicated_nuban"
  }
}
```

**System Action:**
1. Verify HMAC signature
2. Find user by customer code
3. Credit wallet balance
4. Record transaction
5. Send credit alert (Email, SMS, Push)

---

#### transfer.success
Triggered when an outgoing transfer completes successfully.

**Payload:**
```json
{
  "event": "transfer.success",
  "data": {
    "reference": "ref_send_123",
    "transfer_code": "TRF_xxxx",
    "recipient": {
      "name": "Jane Smith",
      "account_number": "0123456789"
    }
  }
}
```

**System Action:**
1. Verify HMAC signature
2. Find transaction by reference
3. Update status to "completed"
4. Send debit confirmation (Email, SMS, Push)

---

#### transfer.failed
Triggered when an outgoing transfer fails.

**Payload:**
```json
{
  "event": "transfer.failed",
  "data": {
    "reference": "ref_send_123",
    "reason": "Invalid account number"
  }
}
```

**System Action:**
1. Verify HMAC signature
2. Find transaction by reference
3. Refund amount to wallet balance
4. Update status to "failed"
5. Send failure alert (Email, SMS, Push)

---

## Email Templates

### Credit Alert Email

**When:** User receives money
**From:** `alerts@bankchase.app`
**Subject:** `Credit Alert: ₦5,000 received`

**Contains:**
- Transaction amount (formatted)
- Sender name
- Transaction reference
- Date and time (Nigeria timezone)
- New account balance
- "View Transaction" button
- Security notice

---

### Debit Alert Email

**When:** User sends money
**From:** `alerts@bankchase.app`
**Subject:** `Transaction Confirmed: ₦2,500 sent`

**Contains:**
- Transaction amount
- Recipient name
- Transaction reference
- Date and time
- Remaining balance
- "View Details" button

---

### Transfer Failed Email

**When:** Transfer fails
**From:** `alerts@bankchase.app`
**Subject:** `Transfer Failed: ₦5,000 - Action Required`

**Contains:**
- Failed amount
- Transaction reference
- Failure reason
- Refund confirmation
- "Contact Support" button
- Support contact info

---

## SMS Templates

### Credit Alert SMS

```
Credit Alert! Amt: NGN 5,000 from John Doe. Bal: NGN 25,000. Ref: TXN123
```

**Length:** < 160 characters (1 SMS credit)
**Sent via:** DND route (ensures delivery)

---

### Debit Alert SMS

```
Debit Alert! NGN 2,500 sent to Jane Smith. Bal: NGN 22,500. Ref: TXN124
```

**Length:** < 160 characters (1 SMS credit)

---

### Transfer Failed SMS

```
Transfer Failed! NGN 5,000 transfer failed. Acct not debited. Ref: TXN125
```

**Length:** < 160 characters

---

### OTP SMS

```
Your BankChase verification code is 123456. It expires in 10 minutes.
```

---

## Push Notification Objects

### Credit Notification

```json
{
  "type": "credit",
  "title": "Money Received",
  "message": "You received ₦5,000 from John Doe",
  "data": {
    "transactionId": "tx_abc123",
    "amount": 5000,
    "currency": "NGN",
    "reference": "REF_001"
  },
  "action_url": "/dashboard/transactions/tx_abc123"
}
```

---

### Debit Notification

```json
{
  "type": "debit",
  "title": "Money Sent",
  "message": "You sent ₦2,500 to Jane Smith",
  "data": {
    "transactionId": "tx_def456",
    "amount": 2500,
    "currency": "NGN",
    "reference": "REF_002"
  },
  "action_url": "/dashboard/transactions/tx_def456"
}
```

---

### Transfer Failed Notification

```json
{
  "type": "transfer_failed",
  "title": "Transfer Failed",
  "message": "Transfer of ₦5,000 to Recipient failed. Account not debited.",
  "data": {
    "transactionId": "tx_ghi789",
    "amount": 5000,
    "currency": "NGN",
    "reference": "REF_003"
  },
  "action_url": "/support?transaction=tx_ghi789"
}
```

---

## Error Handling

### Common Errors

#### 401 Unauthorized
```json
{
  "success": false,
  "error": "Unauthorized"
}
```
**Solution:** Include valid Bearer token in Authorization header

#### 404 Not Found
```json
{
  "success": false,
  "error": "Notification not found"
}
```
**Solution:** Verify notification ID exists and belongs to user

#### 500 Server Error
```json
{
  "success": false,
  "error": "Failed to process request"
}
```
**Solution:** Check server logs for detailed error

---

## Rate Limiting

### Email Sending
- **Limit:** 20 emails per minute per user
- **Queue:** Async (non-blocking)
- **Retry:** 3 automatic retries on failure

### SMS Sending
- **Limit:** 10 SMS per minute per user
- **Queue:** Async (non-blocking)
- **Retry:** 1 retry on failure

### Push Notifications
- **Limit:** Unlimited (database writes)
- **Queue:** Async (non-blocking)

---

## Best Practices

### 1. Verify HMAC Signatures
Always verify webhook signatures before processing:
```typescript
const hash = crypto
  .createHmac('sha512', PAYSTACK_SECRET_KEY)
  .update(rawBody)
  .digest('hex')

if (hash !== signature) {
  return { error: 'Invalid signature' }
}
```

### 2. Idempotency Checks
Check if notification already sent before processing:
```typescript
const existing = await db.transactions
  .where('reference', reference)
  .first()

if (existing) return // Already processed
```

### 3. Async Execution
Never block webhook response waiting for notifications:
```typescript
// Return immediately
res.status(200).json({ success: true })

// Process notifications asynchronously
Promise.allSettled([
  sendEmail(...),
  sendSMS(...),
  sendPush(...)
]).catch(err => logger.error(err))
```

### 4. Phone Number Formatting
Always use international format with country code:
```typescript
// ✓ Correct
+2348000000000
2348000000000

// ✗ Wrong
08000000000
```

### 5. Error Logging
Log all notification failures for debugging:
```typescript
sendEmail(...).catch(err => {
  logger.error('Email failed', {
    recipient: email,
    error: err.message,
    transaction: txId
  })
})
```

---

## Integration Examples

### React Component: Display Notifications

```tsx
import { useEffect, useState } from 'react'

export function NotificationCenter() {
  const [notifications, setNotifications] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    const res = await fetch('/api/notifications?limit=10')
    const data = await res.json()
    setNotifications(data.notifications)
    setLoading(false)
  }

  const markAsRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT' })
    fetchNotifications()
  }

  if (loading) return <div>Loading...</div>

  return (
    <div className="notifications">
      {notifications.map(notif => (
        <div key={notif.id} className="notification-item">
          <h3>{notif.title}</h3>
          <p>{notif.message}</p>
          <small>{new Date(notif.created_at).toLocaleString()}</small>
          {!notif.read && (
            <button onClick={() => markAsRead(notif.id)}>Mark as Read</button>
          )}
        </div>
      ))}
    </div>
  )
}
```

### Server: Send Notification

```typescript
import { notifyOnCredit } from '@/lib/notifications'

// In your transaction handler
await notifyOnCredit({
  context: {
    userId: user.id,
    userEmail: user.email,
    userPhone: user.phone,
    userName: user.name
  },
  transactionId: transaction.id,
  amount: 5000,
  currency: 'NGN',
  recipientName: 'John Doe',
  reference: 'TXN_001',
  balance: 25000,
  type: 'credit'
})
```

---

## Support & Debugging

### Enable Debug Logging

Add to your environment:
```env
DEBUG=bankchase:notifications
LOG_LEVEL=debug
```

### View Notification Logs

Check server logs for notification activity:
```
[NOTIFY] Credit event - User: uuid, Amount: 5000
[EMAIL ✓] Credit alert sent to user@example.com
[SMS ✓] Credit alert sent to +2348000000000
[PUSH ✓] Notification saved for user uuid
```

### Test Notification Channels

```bash
# Test email
curl -X POST http://localhost:3000/api/notifications/test-email \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Test SMS
curl -X POST http://localhost:3000/api/notifications/test-sms \
  -H "Content-Type: application/json" \
  -d '{"phone": "+2348000000000"}'

# Test all
curl -X POST http://localhost:3000/api/notifications/test-all \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "phone": "+2348000000000"}'
```

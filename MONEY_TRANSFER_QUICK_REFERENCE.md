# Money Transfer APIs - Quick Reference Card

## Setup (5 Minutes)

```bash
# 1. Copy environment template
cp .env.payments.example .env.local

# 2. Add Paystack keys
PAYSTACK_SECRET_KEY=sk_test_xxxxx

# 3. Test virtual account creation
curl -X POST http://localhost:3000/api/paystack/virtual-account/create \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json"
```

## API Endpoints Quick Reference

### 1. Create Virtual Account
```
POST /api/paystack/virtual-account/create
Response: { accountNumber, bankName, accountName }
```

### 2. Send Money to Bank
```
POST /api/transfers/send
Body: { toAccountNumber, toBankCode, amount, recipientName }
Response: { transactionId, reference, status }
```

### 3. Send Payment to User
```
POST /api/payments/send
Body: { recipientEmail, amount, description }
Response: { transactionId, status, senderNewBalance }
```

### 4. Check Transaction Status
```
GET /api/transfers/money-movement/status
Query: ?transactionId=ID or ?status=completed
Response: { transactions[], pagination, summary }
```

## Common Bank Codes

| Bank | Code |
|------|------|
| GTB | 058 |
| Access | 044 |
| First Bank | 011 |
| Zenith | 057 |
| UBA | 033 |
| Wema | 035 |
| FCMB | 020 |

## Error Messages & Fixes

| Error | Fix |
|-------|-----|
| `Unauthorized` | Add `Authorization: Bearer TOKEN` header |
| `Insufficient balance` | Check user has enough funds |
| `Invalid bank account details` | Verify account number (10 digits) and bank code |
| `User profile not found` | Ensure user profile exists in database |
| `PAYSTACK_SECRET_KEY not configured` | Add to `.env.local` |

## Response Status Codes

| Code | Meaning |
|------|---------|
| 200 | Success ✅ |
| 400 | Bad request (validation error) |
| 401 | Unauthorized (missing/invalid token) |
| 404 | Not found (transaction/user/account) |
| 500 | Server error |

## Transaction Statuses

- `pending` - Not yet processed
- `processing` - Being transferred
- `completed` - Successfully transferred ✅
- `failed` - Transfer failed, balance refunded

## Transaction Types

- `transfer` - Bank account transfer
- `deposit` - Incoming transfer to virtual account
- `payment` - P2P wallet transfer
- `withdrawal` - User withdrawal
- `bank_transfer` - Paystack bank transfer

## Webhook Events (Automatic)

| Event | Meaning | Action |
|-------|---------|--------|
| `charge.success` | Deposit received | Credit wallet |
| `transfer.success` | Transfer complete | Update status |
| `transfer.failed` | Transfer failed | Refund & notify |

## Security Checklist

- ✅ All endpoints require authentication
- ✅ Users can only see their own transactions
- ✅ Amount limits: ₦100 - ₦10,000,000
- ✅ Webhooks verified with HMAC-SHA512
- ✅ Sensitive data not logged
- ✅ SQL injection protection (parameterized queries)

## Testing Flow

```bash
# 1. Get auth token (from login)
TOKEN="your_jwt_token"

# 2. Create virtual account (if needed)
curl -X POST http://localhost:3000/api/paystack/virtual-account/create \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"

# 3. Send money to user
curl -X POST http://localhost:3000/api/payments/send \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "senderName": "You",
    "senderEmail": "you@example.com",
    "recipientName": "Friend",
    "recipientEmail": "friend@example.com",
    "amount": 5000,
    "currency": "NGN",
    "description": "Test payment"
  }'

# 4. Check status
curl "http://localhost:3000/api/transfers/money-movement/status" \
  -H "Authorization: Bearer $TOKEN"
```

## Request Template

### Send Money Request
```json
{
  "senderName": "John Doe",
  "senderEmail": "john@example.com",
  "recipientName": "Jane Smith",
  "recipientEmail": "jane@example.com",
  "recipientPhoneNumber": "+234801234567",
  "amount": 50000,
  "currency": "NGN",
  "description": "Payment for services",
  "transferType": "wallet_transfer"
}
```

### Bank Transfer Request
```json
{
  "fromAccountId": "account_123",
  "toAccountNumber": "0123456789",
  "toBankCode": "058",
  "amount": 100000,
  "recipientName": "John Doe",
  "narration": "Invoice payment",
  "transferType": "bank_transfer"
}
```

## Response Template

### Success Response
```json
{
  "success": true,
  "message": "Operation successful",
  "transactionId": "550e8400-e29b-41d4-a716-446655440000",
  "status": "completed",
  "details": { ... }
}
```

### Error Response
```json
{
  "success": false,
  "error": "Error description",
  "status": 400
}
```

## Environment Variables

```bash
# Required
PAYSTACK_SECRET_KEY=sk_test_xxxxx

# Optional but recommended
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxx
LOG_LEVEL=debug
MAX_TRANSFER_AMOUNT=10000000
MIN_TRANSFER_AMOUNT=100
```

## Files & Documentation

| File | Purpose |
|------|---------|
| `MONEY_TRANSFER_API_DOCS.md` | Complete API reference (813 lines) |
| `PAYMENTS_INTEGRATION_GUIDE.md` | Setup & integration guide (533 lines) |
| `MONEY_TRANSFER_IMPLEMENTATION_SUMMARY.md` | Overview of all changes (546 lines) |
| `.env.payments.example` | Environment variables template |
| `/app/api/paystack/*` | Paystack integration endpoints |
| `/app/api/transfers/money-movement/*` | Transaction status endpoints |

## Debugging

### View Logs
```bash
# Development
tail -f v0_debug_logs.log | grep "[v0]"

# Production (Vercel)
vercel logs
```

### Common Issues

**Webhook not received:**
- Check webhook URL in Paystack dashboard
- Verify HMAC signature is correct
- Check firewall allows POST requests

**Transfer rejected:**
- Verify account number is valid NUBAN (10 digits)
- Check bank code is correct
- Ensure sufficient balance

**Virtual account not created:**
- Check Paystack API key
- Verify user profile exists
- Check Paystack account is active

## Production Checklist

- [ ] Update Paystack keys to live (`sk_live_*`)
- [ ] Configure webhook URL for production domain
- [ ] Set `NODE_ENV=production`
- [ ] Enable HTTPS
- [ ] Setup database backups
- [ ] Configure logging/monitoring
- [ ] Setup email notifications
- [ ] Test all endpoints in staging
- [ ] Document runbooks
- [ ] Setup support procedures

## Support Links

- **Paystack API Docs:** https://paystack.com/docs/api/
- **This Project Docs:** See files in project root
- **Test Cards:** https://paystack.com/docs/developers/test-keys/
- **GitHub Issues:** Create issue with logs attached

## Quick Copy-Paste

### cURL: Create Virtual Account
```bash
curl -X POST http://localhost:3000/api/paystack/virtual-account/create \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

### cURL: Send Payment
```bash
curl -X POST http://localhost:3000/api/payments/send \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "senderName":"You","senderEmail":"you@test.com",
    "recipientName":"Friend","recipientEmail":"friend@test.com",
    "amount":5000,"currency":"NGN","description":"Test"
  }'
```

### cURL: Get Transactions
```bash
curl http://localhost:3000/api/transfers/money-movement/status \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

**Last Updated:** July 2024
**Status:** Production Ready ✅
**Version:** 1.0

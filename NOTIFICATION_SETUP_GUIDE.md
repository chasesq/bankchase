# Multi-Channel Notification System Setup Guide

Complete guide to set up Email (Resend), SMS (Termii), and Push notifications for all money movement events.

## Table of Contents
1. [Quick Start](#quick-start)
2. [Resend Setup (Email)](#resend-setup-email)
3. [Termii Setup (SMS)](#termii-setup-sms)
4. [Database Migration](#database-migration)
5. [Configuration](#configuration)
6. [Testing](#testing)
7. [Troubleshooting](#troubleshooting)

---

## Quick Start

### 1. Copy Environment Template
```bash
cp .env.notifications.example .env.local
```

### 2. Fill in API Keys
```env
RESEND_API_KEY=re_xxxxx
TERMII_API_KEY=TL_xxxxx
PAYSTACK_SECRET_KEY=sk_test_xxxxx
SENDER_EMAIL=alerts@bankchase.app
SMS_SENDER_ID=BankChase
APP_URL=http://localhost:3000
```

### 3. Run Database Migration
```bash
# Create notifications table in Supabase
npm run migrate
```

### 4. Test Setup
```bash
curl -X POST http://localhost:3000/api/notifications/test \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+2348000000000",
    "testType": "credit"
  }'
```

---

## Resend Setup (Email)

### Step 1: Create Resend Account
- Go to [https://resend.com](https://resend.com)
- Click "Sign Up" and create your account
- Verify your email address

### Step 2: Verify Sender Domain or Email
#### Option A: Verify Email (Quick - for development)
1. In Resend dashboard, go to **"Senders"**
2. Click **"Add Sender"**
3. Enter your email (e.g., `alerts@example.com`)
4. Resend sends verification link to that email
5. Click verification link in email
6. Email is now verified for sending

#### Option B: Setup Domain (Recommended for production)
1. In Resend dashboard, go to **"Domains"**
2. Click **"Add Domain"**
3. Enter your domain (e.g., `mail.bankchase.com`)
4. Add DNS records provided by Resend to your domain provider
5. Wait for DNS propagation (5-30 minutes)
6. Domain becomes verified

### Step 3: Get API Key
1. Go to **Settings** → **API Keys**
2. Click **"Create API Key"**
3. Copy the key starting with `re_`
4. Add to `.env.local`:
```env
RESEND_API_KEY=re_xxxxxxxxxxxxxxxxxxxx
SENDER_EMAIL=alerts@bankchase.app
```

### Step 4: Test Email
```bash
curl -X POST http://localhost:3000/api/notifications/test-email \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "recipientName": "John Doe",
    "amount": 5000
  }'
```

---

## Termii Setup (SMS)

### Step 1: Create Termii Account
- Go to [https://termii.com](https://termii.com)
- Click **"Get Started"** or **"Sign Up"**
- Fill in your details:
  - Business name: "BankChase"
  - Phone: Your phone number
  - Email: Your email
- Verify phone (OTP sent via SMS)
- Verify email (link sent to email)

### Step 2: Setup Sender ID
1. Go to **Dashboard** → **Sender ID**
2. Click **"Request New Sender ID"**
3. Enter Sender ID (max 11 chars, alphanumeric):
   ```
   BankChase
   ```
4. Reason: "Transactional alerts for banking app"
5. Submit
6. Wait for approval (usually instant)

### Step 3: Get API Key
1. Go to **Settings** → **API Token**
2. Copy your API token starting with `TL_`
3. Add to `.env.local`:
```env
TERMII_API_KEY=TLxxxxxxxxxxxxxxxxxxxxxxxx
SMS_SENDER_ID=BankChase
```

### Step 4: Fund Account (Optional for testing)
- Go to **Dashboard** → **Account Balance**
- To send real SMS, add credits
- For development/testing, contact Termii support for test credits
- SMS rate: Typically ₦3-5 per SMS in Nigeria

### Step 5: Test SMS
```bash
curl -X POST http://localhost:3000/api/notifications/test-sms \
  -H "Content-Type: application/json" \
  -d '{
    "phone": "+2348000000000",
    "amount": 5000,
    "senderName": "John Doe"
  }'
```

---

## Database Migration

### Create Notifications Table

Run this SQL in your Supabase SQL editor:

```sql
-- Notifications table for push notifications and notification history
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('credit', 'debit', 'transfer_failed', 'deposit', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  data JSONB,
  action_url TEXT,
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for user queries
CREATE INDEX notifications_user_id_idx ON notifications(user_id);
CREATE INDEX notifications_user_id_created_at_idx ON notifications(user_id, created_at DESC);
CREATE INDEX notifications_user_id_read_idx ON notifications(user_id, read);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can only see their own notifications
CREATE POLICY notifications_user_isolation ON notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Allow webhook to insert notifications
CREATE POLICY notifications_webhook_insert ON notifications
  FOR INSERT WITH CHECK (true);
```

### Update Profiles Table

Add phone number field if not exists:

```sql
ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS phone_number TEXT,
ADD COLUMN IF NOT EXISTS notifications_enabled BOOLEAN DEFAULT true;

-- Optional: Add notification preferences
ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{"email": true, "sms": true, "push": true}'::jsonb;
```

---

## Configuration

### Environment Variables

```env
# Email
RESEND_API_KEY=re_xxxxx
SENDER_EMAIL=alerts@bankchase.app

# SMS
TERMII_API_KEY=TL_xxxxx
SMS_SENDER_ID=BankChase

# Payment Gateway
PAYSTACK_SECRET_KEY=sk_test_xxxxx

# App
APP_URL=http://localhost:3000

# Optional: Feature flags
ENABLE_EMAIL_NOTIFICATIONS=true
ENABLE_SMS_NOTIFICATIONS=true
ENABLE_PUSH_NOTIFICATIONS=true
```

### Webhook URL Configuration

Add Paystack webhook in [Paystack Dashboard](https://dashboard.paystack.co):

1. Go to **Settings** → **Webhooks**
2. Add webhook URL:
   ```
   https://bankchase.app/api/paystack/webhooks
   ```
   (For development: `http://localhost:3000/api/paystack/webhooks`)

3. Select events:
   - `charge.success` (incoming deposits)
   - `transfer.success` (outgoing transfers succeeded)
   - `transfer.failed` (outgoing transfers failed)

4. Save

---

## Testing

### Test All Channels

Create test endpoint response:

```bash
curl -X POST http://localhost:3000/api/notifications/test-all \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "phone": "+2348000000000",
    "userName": "John Doe"
  }'
```

### View Sent Notifications

```bash
# Get user notifications
curl -X GET http://localhost:3000/api/notifications \
  -H "Authorization: Bearer YOUR_TOKEN"

# Mark as read
curl -X PUT http://localhost:3000/api/notifications/NOTIFICATION_ID/read \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Check Webhook Delivery

**Paystack Dashboard:**
1. Go to **Settings** → **Webhooks**
2. Click **Webhook Log**
3. See recent deliveries and responses

**Local Testing:**
Use webhook relay service:
```bash
# Install ngrok
npm install -g ngrok

# Start tunnel
ngrok http 3000

# Use generated URL in Paystack webhook settings
# e.g., https://xxxx-xx-xxx-xxx-xx.ngrok.io/api/paystack/webhooks
```

---

## Troubleshooting

### Email Not Sending

**Issue:** "Invalid sender email"
- **Solution:** Verify email in Resend dashboard first
- Resend Settings → Senders → Add & verify email

**Issue:** "RESEND_API_KEY not configured"
- **Solution:** Add key to `.env.local`
- Restart dev server: `npm run dev`

**Issue:** "401 Unauthorized"
- **Solution:** Check API key is correct (starts with `re_`)
- Regenerate new key in Resend if needed

### SMS Not Sending

**Issue:** "Invalid phone number"
- **Solution:** Use international format with country code
- ✓ Correct: `+2348000000000` or `2348000000000`
- ✗ Wrong: `08000000000` (missing country code)

**Issue:** "TERMII_API_KEY not configured"
- **Solution:** Add key to `.env.local`
- Key should start with `TL_`
- Restart dev server

**Issue:** "SMS Rate limit exceeded"
- **Solution:** Wait or increase `SMS_RATE_LIMIT` in env
- Default: 10 SMS per minute

**Issue:** No test SMS credits
- **Solution:** Contact Termii support for test credits
- Or add payment method to send real SMS

### Push Notifications Not Showing

**Issue:** Notifications not appearing in app
- **Solution:** Check database has `notifications` table
- Run SQL migration above

**Issue:** "User ID not found"
- **Solution:** Ensure user is authenticated
- Include `Authorization: Bearer TOKEN` header

### Webhook Not Triggering

**Issue:** "Webhook signature verification failed"
- **Solution:** Verify `PAYSTACK_SECRET_KEY` is correct
- Get secret key from Paystack Settings → API Keys

**Issue:** "Transaction not found"
- **Solution:** Check transaction was created with correct reference
- Webhook reference must match transaction reference

**Issue:** "Connection refused" (local testing)
- **Solution:** Use ngrok to expose local server
- See Testing section above

---

## API Endpoints

### Notification Endpoints

```
GET  /api/notifications              Get user notifications
GET  /api/notifications/:id          Get single notification
PUT  /api/notifications/:id/read     Mark as read
DELETE /api/notifications/:id        Delete notification
PUT  /api/notifications/read-all     Mark all as read
```

### Test Endpoints

```
POST /api/notifications/test-email   Test email sending
POST /api/notifications/test-sms     Test SMS sending
POST /api/notifications/test-all     Test all channels
```

### Webhook Endpoints

```
POST /api/paystack/webhooks          Receive Paystack events
```

---

## Production Checklist

- [ ] Add real domain in Resend (not verified email)
- [ ] Add production API keys (not test keys)
- [ ] Update webhook URL to production domain
- [ ] Set `APP_URL` to production domain
- [ ] Enable all notification channels in settings
- [ ] Test with real transaction
- [ ] Monitor Paystack webhook delivery
- [ ] Set up error logging/monitoring
- [ ] Create notification preferences UI for users
- [ ] Add unsubscribe links in emails

---

## Support

- **Resend Help:** https://resend.com/docs
- **Termii Help:** https://termii.com/docs
- **Paystack Help:** https://paystack.com/support
- **BankChase Support:** support@bankchase.app

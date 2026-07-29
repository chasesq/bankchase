# Notifications - Quick Start Guide

## 5-Minute Setup

### Step 1: Get Your API Keys (2 min)

**Resend (Email):**
1. Go to https://resend.com
2. Sign up (free tier included)
3. Go to API Keys
4. Copy your API key

**Termii (SMS):**
1. Go to https://app.ng.termii.com
2. Sign up (free credits included)
3. Go to Settings → API Keys
4. Copy your API Key

### Step 2: Add Environment Variables (1 min)

```bash
# In your .env.local file:
RESEND_API_KEY=re_your_key_here
TERMII_API_KEY=termii_your_key_here
SENDER_EMAIL=noreply@yourdomain.com
SMS_SENDER_ID=YourBrandName
```

### Step 3: Deploy (2 min)

**Local Testing:**
```bash
npm run dev
# Notifications will log to console
```

**Production (Vercel):**
1. Go to Project Settings → Environment Variables
2. Add all 4 variables
3. Click "Save"
4. Redeploy

That's it! 🎉

## What Happens Now

When a user:

**Receives Money:**
- ✉️ Email with amount & new balance
- 📱 SMS with transaction alert
- 🔔 App notification

**Sends Money:**
- ✉️ Confirmation email
- 📱 SMS confirmation
- 🔔 App notification

**Transfer Fails:**
- ✉️ Failure notification with refund status
- 📱 SMS alert with refund amount
- 🔔 App notification

## Testing

### Test Email Delivery
```bash
# Monitor these logs for "Email sent" messages
npm run dev
```

### Test SMS Delivery
Check your phone for test SMS messages.

### Check Webhook
1. Go to Paystack Dashboard
2. Click Settings → Webhooks
3. Copy webhook URL
4. See live event logs

## Troubleshooting

| Issue | Solution |
|-------|----------|
| No emails received | Check RESEND_API_KEY and SENDER_EMAIL |
| No SMS received | Check TERMII_API_KEY and phone format |
| Webhook not triggering | Verify webhook URL in Paystack settings |
| Function not found error | Ensure `.env.local` is loaded (`npm run dev`) |

## Cost Estimate

- **Resend:** $0.50 per email (after free tier)
- **Termii:** $0.006 per SMS (approximately)

For a typical banking app with 1000 transactions/day:
- ~1000 emails × $0.50 = $500/month
- ~1000 SMS × $0.006 = $6/month

## More Information

- [NOTIFICATION_SYSTEM_COMPLETE.md](./NOTIFICATION_SYSTEM_COMPLETE.md) - Full documentation
- [NOTIFICATION_SETUP_GUIDE.md](./NOTIFICATION_SETUP_GUIDE.md) - Detailed setup
- [NOTIFICATION_API_REFERENCE.md](./NOTIFICATION_API_REFERENCE.md) - API reference

## Files Created

- ✅ Multi-channel notification system
- ✅ Paystack webhook integration
- ✅ Email via Resend
- ✅ SMS via Termii
- ✅ Push notifications
- ✅ Error handling
- ✅ Logging

## Next Steps

1. Set environment variables ✅
2. Test with local dev server ✅
3. Deploy to production ✅
4. Monitor notification delivery ✅
5. Adjust templates if needed ✅

---

**Ready to send notifications?** 
Run `npm run dev` and watch the magic happen! 🚀

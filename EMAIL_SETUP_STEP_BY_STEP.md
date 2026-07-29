# Email Management System - Step-by-Step Implementation Guide

## Total Setup Time: ~30 minutes

## Step 1: Database Migration (5 minutes)

### 1.1 Access Supabase
1. Go to https://app.supabase.com
2. Select your project (BankChase)
3. Click "SQL Editor" in the left sidebar

### 1.2 Run Migration
1. Click "New Query"
2. Copy all content from `/migrations/email_management.sql`
3. Paste into the SQL editor
4. Click "Run" button
5. Verify success message appears

### 1.3 Verify Tables Created
1. Click "Table Editor" in left sidebar
2. Refresh the page
3. You should see these new tables:
   - email_domains
   - email_templates
   - sender_identities
   - email_logs
   - email_settings

## Step 2: Configure Environment Variables (3 minutes)

### 2.1 Get Resend API Key
1. Go to https://resend.com
2. Sign in or create account
3. Click "API Keys" in dashboard
4. Copy your API key (starts with `re_`)

### 2.2 Update .env.local
Add to your `/vercel/share/v0-project/.env.local`:

```bash
# Email Configuration
RESEND_API_KEY=re_your_api_key_here
SENDER_EMAIL=noreply@bankchase.com
SMS_SENDER_ID=N-Alert
```

### 2.3 Verify Environment Variables
1. Run: `echo $RESEND_API_KEY`
2. Should output your API key (masked)

## Step 3: Set Up First Domain (5 minutes)

### 3.1 Access Email Dashboard
1. Start your dev server: `npm run dev`
2. Navigate to: `http://localhost:3000/dashboard/email`
3. Click "Domains" tab
4. Click "Add Domain" button

### 3.2 Add Your Domain
1. Enter your domain name (e.g., `bankchase.com`)
2. Click "Add Domain"
3. Copy the DNS record information:
   - Type: CNAME
   - Name: bounce.bankchase.com
   - Value: bounce.resend.com

### 3.3 Configure DNS Records
1. Go to your domain registrar (GoDaddy, Namecheap, Route53, etc.)
2. Login to your account
3. Find "DNS Records" or "DNS Management"
4. Add new CNAME record:
   - Name: `bounce.bankchase.com`
   - Value: `bounce.resend.com`
   - TTL: 3600 (default)
5. Save changes

### 3.4 Wait for Propagation
- DNS changes take 15-30 minutes to propagate
- You can check status at: https://mxtoolbox.com
- Enter your domain name
- Run "CNAME Lookup"

### 3.5 Verify Domain
1. Return to Email Dashboard (Domains tab)
2. Wait for DNS propagation (15-30 min)
3. Click "Verify" button next to your domain
4. If successful, domain status changes to "Verified"

## Step 4: Create Email Templates (5 minutes)

### 4.1 Access Templates
1. Go to `/dashboard/email`
2. Click "Templates" tab
3. Click "Create Template" button

### 4.2 Create "Transaction Alert" Template
Fill in:
- **Name:** Transaction Alert
- **Subject:** Transaction Confirmation: {{amount}}
- **HTML Body:**
```html
<div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 8px;">
  <h2>Transaction Confirmation</h2>
  <p>Dear {{firstName}},</p>
  <p>Your transaction has been processed successfully.</p>
  
  <div style="background-color: #f5f5f5; padding: 15px; border-radius: 4px; margin: 20px 0;">
    <p><strong>Amount:</strong> ₦{{amount}}</p>
    <p><strong>Type:</strong> {{type}}</p>
    <p><strong>Reference:</strong> {{reference}}</p>
    <p><strong>Status:</strong> {{status}}</p>
  </div>
  
  <p>If you have any questions, please contact our support team.</p>
  <p>Best regards,<br>BankChase Team</p>
</div>
```
- **Text Body:**
```
Transaction Confirmation

Dear {{firstName}},

Your transaction has been processed successfully.

Amount: ₦{{amount}}
Type: {{type}}
Reference: {{reference}}
Status: {{status}}

If you have any questions, please contact our support team.

Best regards,
BankChase Team
```

### 4.3 Create "Welcome Email" Template
Repeat process with:
- **Name:** Welcome Email
- **Subject:** Welcome to BankChase, {{firstName}}!
- Create similar HTML/text bodies

## Step 5: Configure Sender Identity (3 minutes)

### 5.1 Go to Settings
1. Click "Settings" tab in Email Dashboard

### 5.2 Add Sender Identity
1. Ensure domain is verified (from Step 3)
2. Scroll to "Sender Identities" section (if separate page/API)
3. Or create via API:
```bash
curl -X POST http://localhost:3000/api/email/senders \
  -H "Content-Type: application/json" \
  -d '{
    "domain_id": "domain-uuid-from-step-3",
    "from_email": "noreply@bankchase.com",
    "from_name": "BankChase Team"
  }'
```

### 5.3 Set Default Configuration
In Settings tab:
- **Default Domain:** Select your verified domain
- **Default Sender:** Select your sender identity
- **Default Template:** Select Transaction Alert template
- Enable tracking options:
  - ✓ Delivery Tracking
  - ✓ Open Tracking
  - ✓ Click Tracking
  - ✓ Unsubscribe Header

## Step 6: Send Your First Email (5 minutes)

### 6.1 Using sendEmailWithManagement Function

Create a test file: `/vercel/share/v0-project/test-email.ts`

```typescript
import { sendEmailWithManagement } from '@/lib/email-notification-integration'

async function testEmail() {
  const result = await sendEmailWithManagement({
    userId: 'your-user-id', // Replace with actual user ID
    recipientEmail: 'test@example.com',
    recipientName: 'Test User',
    subject: 'Test Email from BankChase',
    htmlBody: '<h1>Hello {{firstName}}!</h1><p>This is a test email.</p>',
    variables: {
      firstName: 'Test'
    },
    metadata: {
      type: 'test',
      source: 'manual_test'
    }
  })

  console.log('Email sent:', result)
  return result
}

testEmail()
```

### 6.2 Run Test
```bash
# Using ts-node or tsx
npx tsx test-email.ts
```

### 6.3 Check Email Logs
1. Go to `/dashboard/email`
2. Click "Email Logs" tab
3. Should see your test email with status "sent"

## Step 7: Monitor Delivery (Ongoing)

### 7.1 Email Logs Dashboard
- View all sent emails
- Filter by status (sent, delivered, opened, bounced)
- See open rates and click rates
- Export logs if needed

### 7.2 Track Metrics
Monitor in `/dashboard/email`:
- **Total Sent:** How many emails sent
- **Delivered:** How many successfully delivered
- **Opened:** How many were opened
- **Clicked:** How many links were clicked
- **Bounced:** How many failed

### 7.3 Adjust Settings
If delivery rate low:
1. Check bounce logs for errors
2. Verify sender domain reputation
3. Review email content for spam triggers
4. Adjust sending frequency

## Step 8: Integrate with Notification System (10 minutes)

### 8.1 Update Webhook Handler
In `/app/api/paystack/webhooks/route.ts`, update to use new system:

```typescript
import { sendEmailWithManagement } from '@/lib/email-notification-integration'

// In your webhook handler:
await sendEmailWithManagement({
  userId: transaction.user_id,
  recipientEmail: userDetails.email,
  recipientName: userDetails.full_name,
  subject: `Transaction Alert: ₦${amount}`,
  variables: {
    firstName: userDetails.full_name.split(' ')[0],
    amount: amount.toLocaleString(),
    reference: reference,
    type: 'Deposit',
    status: 'Success'
  },
  metadata: {
    transactionId: transaction.id,
    type: 'transaction_alert',
    source: 'paystack_webhook'
  }
})
```

### 8.2 Update Other Notification Calls
Replace all instances of old notification functions with `sendEmailWithManagement`

### 8.3 Test Integration
1. Create a test transaction via Paystack
2. Check email logs for the triggered email
3. Verify email was delivered and sent

## Step 9: Verify Everything Works (3 minutes)

### 9.1 Test Checklist
- [ ] Domain is verified
- [ ] Templates are created
- [ ] Sender identity is configured
- [ ] Environment variables are set
- [ ] Test email sent successfully
- [ ] Email appears in logs
- [ ] Status tracking works
- [ ] Metrics display correctly

### 9.2 Run Full Build
```bash
npm run build
```

Verify:
- No TypeScript errors
- All types compile correctly
- API endpoints load

### 9.3 Test in Development
```bash
npm run dev
```

Visit: `http://localhost:3000/dashboard/email`

Verify all tabs load:
- Domains ✓
- Templates ✓
- Email Logs ✓
- Settings ✓

## Step 10: Deploy to Production

### 10.1 Push Changes
```bash
git add .
git commit -m "feat: Add comprehensive email management system"
git push origin main
```

### 10.2 Deploy to Vercel
1. Go to https://vercel.com
2. Your project auto-deploys on push
3. Wait for build to complete

### 10.3 Set Production Environment Variables
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add:
   - `RESEND_API_KEY=your_key`
   - `SENDER_EMAIL=noreply@bankchase.com`
   - `SMS_SENDER_ID=N-Alert`

### 10.4 Verify Production
1. Visit your production domain
2. Navigate to `/dashboard/email`
3. Try sending a test email
4. Monitor in Email Logs

## Troubleshooting Guide

### Issue: "Domain not found" error

**Solution:**
1. Ensure domain was added successfully
2. Check SQL: `SELECT * FROM email_domains WHERE user_id = 'your-id'`
3. Verify user ID matches

### Issue: "DNS verification pending"

**Solution:**
1. Wait 15-30 minutes for DNS propagation
2. Check DNS record is correct in your registrar
3. Use https://mxtoolbox.com to verify CNAME
4. Try verification again

### Issue: "Resend API key not configured"

**Solution:**
1. Check `.env.local` has `RESEND_API_KEY`
2. Restart dev server: `npm run dev`
3. Verify API key starts with `re_`

### Issue: Emails not sending

**Solution:**
1. Check email logs for error messages
2. Verify sender email is within verified domain
3. Ensure RESEND_API_KEY is correct
4. Check recipient email is valid

### Issue: Low delivery rate

**Solution:**
1. Add SPF/DKIM records (Resend setup)
2. Monitor bounce reasons
3. Reduce email frequency
4. Check for spam score

## Support Resources

- **Resend Docs:** https://resend.com/docs
- **Supabase Docs:** https://supabase.com/docs
- **Email Logs:** `/dashboard/email/logs`
- **Settings:** `/dashboard/email/settings`
- **API Docs:** See `EMAIL_MANAGEMENT_COMPLETE.md`

## Success Criteria

Your email system is working when:
1. ✓ Domains can be added and verified
2. ✓ Templates render with variables
3. ✓ Emails send to Resend successfully
4. ✓ Email logs show sent status
5. ✓ Statistics display correctly
6. ✓ Settings can be configured
7. ✓ Integration with notification system works
8. ✓ No console errors

## Estimated Timeline

- Day 1: Complete Steps 1-5 (20 mins)
- Day 2: Test with Step 6-7 (15 mins)
- Day 3: Integrate system (10 mins)
- Day 4: Deploy to production (10 mins)

**Total Active Time: ~55 minutes across 4 days**

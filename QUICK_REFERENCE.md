# Email Management System - Quick Reference Guide

## Access Dashboard
```
http://localhost:3000/dashboard/email
```

## Quick API Reference

### Send Email
```typescript
import { sendEmailWithManagement } from '@/lib/email-notification-integration'

const result = await sendEmailWithManagement({
  userId: 'user-id',
  recipientEmail: 'user@example.com',
  recipientName: 'John Doe',
  subject: 'Hello', // optional
  templateId: 'template-id', // optional
  variables: {
    firstName: 'John',
    amount: '1000'
  },
  metadata: {
    transactionId: 'txn-123'
  }
})

console.log(result.success, result.messageId)
```

### Get Email Stats
```typescript
import { getEmailStatistics } from '@/lib/email-notification-integration'

const stats = await getEmailStatistics('user-id', 30) // Last 30 days
console.log(stats.stats.openRate, stats.stats.clickRate)
```

### Update Email Status
```typescript
import { updateEmailStatus } from '@/lib/email-notification-integration'

await updateEmailStatus('message-id', 'opened')
await updateEmailStatus('message-id', 'clicked')
```

### Render Template
```typescript
import { renderEmailTemplate } from '@/lib/email-notification-integration'

const rendered = await renderEmailTemplate(
  'user-id',
  'template-id',
  { firstName: 'John', amount: '1000' }
)
console.log(rendered.subject, rendered.htmlBody)
```

## API Endpoints

### Domains
```bash
# List domains
GET /api/email/domains

# Add domain
POST /api/email/domains
Body: { "domain_name": "example.com" }

# Verify domain
POST /api/email/domains/verify
Body: { "domain_id": "uuid" }
```

### Templates
```bash
# List templates
GET /api/email/templates

# Create template
POST /api/email/templates
Body: {
  "name": "Welcome",
  "subject": "Welcome {{firstName}}",
  "html_body": "<p>Hello {{firstName}}</p>",
  "text_body": "Hello {{firstName}}"
}
```

### Senders
```bash
# List senders
GET /api/email/senders

# Create sender
POST /api/email/senders
Body: {
  "domain_id": "uuid",
  "from_email": "noreply@example.com",
  "from_name": "Company Name"
}
```

### Email Logs
```bash
# List logs
GET /api/email/logs?status=sent&page=1&limit=20

# Create log
POST /api/email/logs
Body: {
  "template_id": "uuid",
  "recipient_email": "user@example.com",
  "recipient_name": "John",
  "subject": "Subject",
  "message_id": "resend-id"
}
```

### Settings
```bash
# Get settings
GET /api/email/settings

# Update settings
PUT /api/email/settings
Body: {
  "default_domain_id": "uuid",
  "default_sender_id": "uuid",
  "enable_delivery_tracking": true,
  "enable_open_tracking": true
}
```

## Database Queries

### Find User's Domains
```sql
SELECT * FROM email_domains WHERE user_id = 'user-id';
```

### Get Email Statistics
```sql
SELECT status, COUNT(*) FROM email_logs 
WHERE user_id = 'user-id' 
GROUP BY status;
```

### Find Failed Emails
```sql
SELECT * FROM email_logs 
WHERE user_id = 'user-id' AND status = 'bounced'
ORDER BY created_at DESC;
```

### Get User's Templates
```sql
SELECT * FROM email_templates 
WHERE user_id = 'user-id'
ORDER BY created_at DESC;
```

## Dashboard Navigation

| Tab | Purpose | Link |
|-----|---------|------|
| Domains | Verify domains, see DNS records | `/dashboard/email?tab=domains` |
| Templates | Create/edit templates | `/dashboard/email?tab=templates` |
| Email Logs | View sent emails, track delivery | `/dashboard/email?tab=logs` |
| Settings | Configure defaults, tracking | `/dashboard/email?tab=settings` |

## Setup Checklist

- [ ] Run database migration
- [ ] Set RESEND_API_KEY in .env.local
- [ ] Add domain in dashboard
- [ ] Add DNS record to registrar
- [ ] Wait 15-30 minutes for DNS propagation
- [ ] Click "Verify" in dashboard
- [ ] Create email template
- [ ] Create sender identity
- [ ] Configure settings
- [ ] Send test email
- [ ] Check email logs

## Common Tasks

### Add New Domain
1. Dashboard → Domains → Add Domain
2. Enter domain name
3. Copy DNS record
4. Add to registrar
5. Wait 15-30 minutes
6. Click "Verify"

### Create Email Template
1. Dashboard → Templates → Create Template
2. Fill name, subject, content
3. Use {{variable}} format
4. Save

### Send Email with Template
```typescript
await sendEmailWithManagement({
  userId: 'user-id',
  templateId: 'template-id',
  recipientEmail: 'user@example.com',
  variables: { name: 'John' }
})
```

### Track Email
1. Dashboard → Email Logs
2. Search by email or subject
3. Filter by status
4. Check timestamps

### Check Delivery Rate
```typescript
const stats = await getEmailStatistics('user-id')
const rate = (stats.delivered / stats.total) * 100
console.log(`Delivery rate: ${rate}%`)
```

## Environment Variables

```bash
# Required
RESEND_API_KEY=re_xxxxxxxxxxxx

# Optional
SENDER_EMAIL=noreply@bankchase.com
SMS_SENDER_ID=N-Alert
```

## Troubleshooting

### Domain won't verify
- Check DNS record added to registrar
- Wait 15-30 minutes for propagation
- Use mxtoolbox.com to check CNAME

### Email not sending
- Verify RESEND_API_KEY is set
- Check sender email is verified
- Check recipient email is valid

### Template variables not working
- Use {{variableName}} format
- Pass variables in send call
- Check spelling (case-sensitive)

### Low delivery rate
- Add SPF/DKIM records
- Reduce sending frequency
- Check bounce reasons in logs

## Performance Tips

1. **Batch Send Emails**
   ```typescript
   const promises = emails.map(e => 
     sendEmailWithManagement({
       userId: 'user-id',
       recipientEmail: e.email,
       variables: e.vars
     })
   )
   await Promise.all(promises)
   ```

2. **Clean Old Logs**
   ```typescript
   import { cleanupOldEmailLogs } from '@/lib/email-notification-integration'
   await cleanupOldEmailLogs('user-id', 90) // 90-day retention
   ```

3. **Use Templates**
   - Preload templates at startup
   - Render once, cache result
   - Reuse across sends

## Files Reference

| File | Purpose |
|------|---------|
| `migrations/email_management.sql` | Database schema |
| `app/api/email/*` | API endpoints |
| `app/dashboard/email/` | Dashboard UI |
| `lib/email-notification-integration.ts` | Integration functions |
| `EMAIL_MANAGEMENT_COMPLETE.md` | Full documentation |
| `EMAIL_SETUP_STEP_BY_STEP.md` | Step-by-step setup |

## Support

- **Full Docs:** Read `EMAIL_MANAGEMENT_COMPLETE.md`
- **Setup Help:** Read `EMAIL_SETUP_STEP_BY_STEP.md`
- **API Issues:** Check `/api/email/logs` for errors
- **Dashboard:** Visit `/dashboard/email`

## Build Command

```bash
npm run build
```

## Start Dev Server

```bash
npm run dev
# Visit http://localhost:3000/dashboard/email
```

## Deploy

```bash
git add .
git commit -m "Email management system"
git push origin main
# Auto-deploys on Vercel
```

---

**Version:** 1.0.0
**Status:** Production Ready
**Last Updated:** 2024

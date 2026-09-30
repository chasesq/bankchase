# Resend Email Instrumentation with Kubiks

This guide explains how to integrate Resend email instrumentation with Kubiks OpenTelemetry for email delivery tracking.

## What You Get

With Resend instrumentation enabled, you'll automatically trace:

- ✅ **All email sends** - Every `resend.emails.send()` call is traced
- ✅ **Recipient tracking** - TO, CC, BCC addresses are captured
- ✅ **Email metadata** - Subject, sender, template IDs are tracked
- ✅ **Message IDs** - Resend message ID is captured for delivery tracking
- ✅ **Error tracking** - Failed email sends with error details
- ✅ **Performance metrics** - Duration of email send operations

## Available Span Attributes

Each email send creates a span with these attributes:

| Attribute | Description | Example |
|-----------|-------------|---------|
| `messaging.system` | Messaging system | `resend` |
| `messaging.operation` | Operation type | `send` |
| `resend.resource` | Resource name | `emails` |
| `resend.target` | Full operation | `emails.send` |
| `resend.to_addresses` | TO addresses (comma-separated) | `user@example.com, another@example.com` |
| `resend.cc_addresses` | CC addresses (comma-separated) | `cc@example.com` |
| `resend.bcc_addresses` | BCC addresses (comma-separated) | `bcc@example.com` |
| `resend.recipient_count` | Total recipients | `3` |
| `resend.from` | Sender email address | `noreply@example.com` |
| `resend.subject` | Email subject | `Welcome to BankChase` |
| `resend.template_id` | Template ID (if using templates) | `tmpl_123` |
| `resend.message_id` | Resend message ID | `email_abc123xyz` |
| `resend.message_count` | Number of messages sent | `1` |

## Implementation

The instrumentation is automatically applied when you call `getResendClient()`:

```typescript
// This now automatically creates instrumented Resend spans
const resend = getResendClient()
const result = await resend.emails.send({
  from: 'noreply@bankchase.app',
  to: 'user@example.com',
  subject: 'Your Account Statement',
  html: '<p>Your statement is ready</p>',
})
```

## Usage Examples

### Basic Email Send

```typescript
import { getResendClient } from '@/lib/email/resend-client'

async function sendEmail() {
  const resend = getResendClient()
  
  const result = await resend.emails.send({
    from: 'noreply@bankchase.app',
    to: 'user@example.com',
    subject: 'Welcome to BankChase',
    html: '<p>Welcome!</p>',
  })
  
  // ✨ Automatically traced with:
  // - Span name: resend.emails.send
  // - Recipient count: 1
  // - Message ID captured for tracking
  // - Delivery status tracked
  
  return result
}
```

### Email with Multiple Recipients

```typescript
import { getResendClient } from '@/lib/email/resend-client'

async function sendBulkEmail() {
  const resend = getResendClient()
  
  const result = await resend.emails.send({
    from: 'notifications@bankchase.app',
    to: [
      'user1@example.com',
      'user2@example.com',
      'user3@example.com',
    ],
    cc: 'admin@bankchase.app',
    bcc: 'archive@bankchase.app',
    subject: 'Monthly Statements Available',
    html: '<p>Your statements are ready</p>',
  })
  
  // ✨ Automatically traced with:
  // - TO addresses: user1@example.com, user2@example.com, user3@example.com
  // - CC: admin@bankchase.app
  // - BCC: archive@bankchase.app
  // - Recipient count: 5
  // - Message ID for tracking all recipients
  
  return result
}
```

### Email with Template

```typescript
import { getResendClient } from '@/lib/email/resend-client'

async function sendTemplateEmail() {
  const resend = getResendClient()
  
  const result = await resend.emails.send({
    from: 'onboarding@bankchase.app',
    to: 'newuser@example.com',
    subject: 'Complete Your Setup',
    react: MyEmailTemplate({ name: 'John' }),
  })
  
  // ✨ Automatically traced with:
  // - Recipient: newuser@example.com
  // - Subject captured
  // - Message ID for tracking delivery
  
  return result
}
```

## Current Configuration

Your application is configured with:
- **Email Service**: Resend
- **Client Caching**: Enabled (single instance reused)
- **Auto-Instrumentation**: Enabled for all email sends
- **Metadata Capture**: Enabled (addresses, subjects, IDs)

## Integration Points

The following functions automatically send instrumented emails:

1. **`sendOnboardingEmail()`** - Welcome emails on user signup
   - FROM: `onboarding@bankchase.app`
   - SUBJECT: `Welcome to BankChase AI Suite`
   - Tracked: User email and name

2. **`sendWorkflowCompletionEmail()`** - Setup completion emails
   - FROM: `onboarding@bankchase.app`
   - SUBJECT: `Your AI Suite Setup is Complete`
   - Tracked: User email, name, workflow ID

## Span Visualization

In Kubiks dashboard, you'll see:

```
Request Span (HTTP GET /api/workflow)
  ├── Database Span (drizzle.select)
  ├── Email Span (resend.emails.send) ✨
  │   ├── TO: user@example.com
  │   ├── SUBJECT: Your AI Suite Setup is Complete
  │   ├── MESSAGE_ID: email_xyz123
  │   └── DURATION: 245ms
  └── Response [200 OK]
```

## Monitoring & Debugging

### View Email Delivery Status
- Check message IDs in Resend dashboard
- Correlate with trace IDs for full flow visibility
- Track email success rate across requests

### Error Tracking
- Failed email sends are automatically captured with error details
- Stack traces included for debugging
- Helps identify email delivery issues quickly

## Data Privacy

The instrumentation captures:
- ✅ Email addresses (needed for delivery tracking)
- ✅ Subject lines (helps identify emails)
- ✅ Template IDs (optional, only if using templates)
- ✅ Metadata (sender, recipient count)

The instrumentation does NOT capture:
- ❌ Email body/content
- ❌ HTML templates
- ❌ Sensitive information from email content

## Performance Considerations

The instrumentation adds minimal overhead:
- Single client instance (cached after first call)
- No additional network calls
- Span creation cost is negligible
- All tracking happens within Resend SDK calls

## Next Steps

1. **Deploy** the changes to Vercel
2. **Trigger emails** by using your application features:
   - Complete onboarding flow to send welcome email
   - Finish workflow to send completion email
3. **View traces** in Kubiks dashboard:
   - Look for `resend.emails.send` spans
   - Check recipient and subject information
   - Monitor email delivery success rate
4. **Correlate** email sends with requests for full visibility

## Troubleshooting

### Emails not appearing in traces?

1. Ensure `RESEND_API_KEY` environment variable is set
2. Verify you're calling `getResendClient()` to get the instrumented instance
3. Check that `@kubiks/otel-resend` is installed
4. Make sure OpenTelemetry is initialized before sending emails

### Want to disable instrumentation?

To send emails without instrumentation, use Resend directly:

```typescript
import { Resend } from 'resend'

const resend = new Resend(process.env.RESEND_API_KEY)
await resend.emails.send({...})
```

## See Also

- [Kubiks Documentation](https://docs.kubiks.ai)
- [Resend Documentation](https://resend.com/docs)
- [OpenTelemetry Messaging Conventions](https://opentelemetry.io/docs/specs/semconv/messaging/)

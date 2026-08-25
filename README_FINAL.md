# BankChase — Final README

BankChase is a production-ready banking dashboard built with Next.js 16, React 19, TypeScript, Tailwind CSS, Neon/Drizzle, Supabase, Upstash, Inngest, Stripe, Plaid, and Vercel.

## Quick start

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000). Configure secrets in Vercel Project Settings → Vars or `.env.local`; never commit credentials.

Validate locally:

```bash
pnpm build
pnpm lint
pnpm test
```

## 11 core pages

1. `/landing` — product entry page
2. `/login` — sign in
3. `/signup` — registration
4. `/dashboard` — balances and activity overview
5. `/accounts` — connected account management
6. `/cards` — card controls
7. `/transfers` — transfer history and status
8. `/pay-transfer` — initiate payments and transfers
9. `/spending` — spending analysis
10. `/savings` — savings goals and progress
11. `/settings` — account preferences

Supporting routes include onboarding, notifications, messages, documents, rewards, profile, security, help, statements, and administration.

## 3 durable workflows

| Workflow | Endpoint | Purpose |
| --- | --- | --- |
| Signup | `POST /api/workflows/signup` | Validates signup, creates the account, sends welcome communication, configures preferences, and completes onboarding. |
| Transaction | `POST /api/workflows/transaction` | Validates, checks, processes, and records a transaction while updating balances and sending confirmation. |
| Notification | `POST /api/workflows/notification` | Validates and stores notifications, optionally sends email/SMS, and logs delivery. |

Workflow monitoring is available at `/workflows`. Upstash Workflow provides resumable step execution and retries.

## API examples

### Search transactions with Upstash Vector

```bash
curl -X POST http://localhost:3000/api/search/transactions \
  -H 'content-type: application/json' \
  -d '{"query":"coffee shop","topK":5}'
```

The route uses Upstash Vector when configured and returns a safe fallback when an optional search service is unavailable.

### Trigger a transaction workflow

```bash
curl -X POST http://localhost:3000/api/workflows/transaction \
  -H 'content-type: application/json' \
  -d '{"transactionId":"txn_123","userId":"user_123","type":"transfer","amount":125.50,"fromAccount":"checking","toAccount":"savings","description":"Monthly savings","userEmail":"person@example.com"}'
```

### Trigger a notification workflow

```bash
curl -X POST http://localhost:3000/api/workflows/notification \
  -H 'content-type: application/json' \
  -d '{"userId":"user_123","type":"alert","title":"Transfer alert","message":"A transfer needs your attention","priority":"high","email":"person@example.com"}'
```

### Health checks

```bash
curl http://localhost:3000/api/health
curl http://localhost:3000/api/search/transactions
```

## Deployment to Vercel

1. Push the repository to GitHub and import it into Vercel.
2. Configure the required environment variables for Preview and Production.
3. Confirm database, authentication, Upstash Vector, Upstash Workflow/QStash, Stripe, Plaid, and webhook credentials are configured for each environment.
4. Deploy through the Vercel dashboard or Git integration.
5. Verify `/api/health`, authentication, transaction search, and all three workflow endpoints on the deployment.
6. Review Vercel logs and workflow delivery status after the first release.

Required integrations are environment-dependent. At minimum, configure the database/auth variables used by the selected deployment, plus `UPSTASH_VECTOR_REST_URL`, `UPSTASH_VECTOR_REST_TOKEN`, `QSTASH_URL`, and `QSTASH_TOKEN` for search and durable workflows.

## CircleCI continuous integration

The repository includes `.circleci/config.yml` for CircleCI validation. It runs frontend dependency installation, ESLint, TypeScript checks, Jest tests, the Next.js production build, Python lint/type checks/tests, and a Docker smoke build. The Docker job is restricted to `main` and `release/*` branches; the other checks run on every push.

To use the CircleCI VS Code extension, open this repository as a workspace and keep the configuration at `.circleci/config.yml`. Authenticate the extension with a CircleCI personal API token to inspect and manage pipelines. Configure provider credentials and deployment secrets in CircleCI project environment variables rather than committing them to YAML.

For local parity, run:

```bash
pnpm install --frozen-lockfile
pnpm lint
pnpm exec tsc --noEmit
pnpm test -- --ci
pnpm build
```

## Production checklist

- Run `pnpm build`, `pnpm lint`, and the relevant test suites.
- Apply database migrations and verify user-level access controls.
- Use HTTPS and secure, HTTP-only session cookies.
- Validate webhook signatures and use idempotency for financial operations.
- Keep service-role keys and private tokens server-side.
- Configure monitoring, backups, and alerting.
- Test Preview and Production independently after deployment.

## Architecture

- **Frontend:** Next.js App Router, React, TypeScript, Tailwind CSS, and accessible component primitives.
- **Data:** Neon/Drizzle and Supabase integrations with authenticated user scoping.
- **Search:** Upstash Vector with resilient database/empty-result fallback behavior.
- **Workflows:** Upstash Workflow and Inngest for durable processing.
- **Banking and payments:** Plaid and Stripe integrations where enabled.
- **Observability:** Health endpoints, structured API responses, and Vercel logs.

## Status

Project completion documentation is consolidated here. The application is ready for deployment after production credentials, migrations, and external provider webhooks are configured.

Co-authored-by: v0agent <it+v0agent@vercel.com>

Co-authored-by: v0 <it+v0agent@vercel.com>

Co-authored-by: v0agent <it+v0agent@vercel.com>

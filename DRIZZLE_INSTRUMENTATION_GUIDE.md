# Drizzle ORM Instrumentation with Kubiks

This guide explains how to integrate Drizzle ORM instrumentation with Kubiks OpenTelemetry for database query tracing.

## What You Get

With Drizzle ORM instrumentation enabled, you'll automatically trace:

- ✅ **All database queries** - SELECT, INSERT, UPDATE, DELETE
- ✅ **Query performance** - Duration and timing for each query
- ✅ **SQL statements** - Full query text with parameters (configurable)
- ✅ **Transaction tracking** - All queries within transactions are traced
- ✅ **Error tracking** - Failed queries with stack traces
- ✅ **RLS queries** - Row Level Security queries like `SET LOCAL role` are captured

## Available Span Attributes

Each database query creates a span with these attributes:

| Attribute | Description | Example |
|-----------|-------------|---------|
| `db.operation` | SQL operation type | `SELECT`, `INSERT`, `UPDATE`, `DELETE` |
| `db.statement` | Full SQL query text | `select "id", "name" from "users" where "id" = $1` |
| `db.system` | Database system | `postgresql` |
| `db.name` | Database name | `bankchase` |
| `db.transaction` | Transaction flag | `true` for queries in transactions |
| `operation.name` | Client operation | `kubiks_otel-drizzle.client` |

## Implementation

The instrumentation is automatically applied when you:

1. Import the `getInstrumentedDb()` function from `instrumentation.ts`
2. Use it to get your database instance instead of creating a raw Drizzle instance

### Example Usage

```typescript
// Instead of:
import { drizzle } from 'drizzle-orm/postgres-js';
const db = drizzle(process.env.DATABASE_URL);

// Use:
import { getInstrumentedDb } from '@/instrumentation';
const db = getInstrumentedDb();

// All queries are now automatically traced
const users = await db.select().from(usersTable);
```

## Configuration Options

The instrumentation accepts these configuration options:

```typescript
instrumentDrizzleClient(db, {
  dbSystem: 'postgresql',         // Database type: 'postgresql' | 'mysql' | 'sqlite'
  dbName: 'bankchase',            // Database name for spans
  captureQueryText: true,         // Include SQL in traces (default: true)
  maxQueryTextLength: 1000,       // Max SQL length (default: 1000)
  peerName: 'db.example.com',     // Database server hostname (optional)
  peerPort: 5432,                 // Database server port (optional)
});
```

## Current Configuration

Your application is configured with:
- **Database**: PostgreSQL (Neon)
- **Query Capture**: Enabled (SQL statements included)
- **Max Query Length**: 1000 characters

## Next Steps

1. **Update your database initialization** to use `getInstrumentedDb()` from `instrumentation.ts`
2. **Deploy** the changes to Vercel
3. **Generate some requests** by using your application
4. **View database traces** in your Kubiks dashboard

Database spans will appear as children of your request spans, showing:
- Query execution time
- SQL statements executed
- Transaction information
- Any errors or exceptions

## Troubleshooting

### Queries not appearing in traces?

1. Ensure you're using `getInstrumentedDb()` for your database instance
2. Verify environment variables are set correctly
3. Check that `@kubiks/otel-drizzle` is installed

### Sensitive data in queries?

Set `captureQueryText: false` to exclude SQL statements from traces:

```typescript
instrumentDrizzleClient(db, {
  captureQueryText: false,  // SQL statements won't be captured
});
```

## See Also

- [Kubiks Documentation](https://docs.kubiks.ai)
- [Drizzle ORM Documentation](https://orm.drizzle.team/)
- [OpenTelemetry Database Semantic Conventions](https://opentelemetry.io/docs/specs/semconv/database/)

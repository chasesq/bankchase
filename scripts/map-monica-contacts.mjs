import pg from "pg"

const { Pool } = pg

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is required to map Monica contacts safely.")
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

try {
  await pool.query(`
    create schema if not exists monica_import;
    create table if not exists monica_import.import_batches (
      id uuid primary key default gen_random_uuid(),
      source_name text not null,
      source_account_id bigint,
      imported_at timestamptz not null default now(),
      notes text
    );
    create table if not exists monica_import.contacts (
      id uuid primary key default gen_random_uuid(),
      batch_id uuid not null references monica_import.import_batches(id) on delete cascade,
      source_id bigint,
      first_name text,
      last_name text,
      email text,
      timezone text,
      locale text,
      currency_code text,
      source_created_at timestamptz,
      source_updated_at timestamptz,
      raw_data jsonb not null default '{}'::jsonb,
      created_at timestamptz not null default now()
    );
    create table if not exists monica_import.mapping_candidates (
      id uuid primary key default gen_random_uuid(),
      batch_id uuid not null references monica_import.import_batches(id) on delete cascade,
      contact_id uuid not null references monica_import.contacts(id) on delete cascade,
      bankchase_user_id uuid,
      match_reason text,
      status text not null default 'pending' check (status in ('pending','approved','rejected','applied')),
      reviewed_at timestamptz,
      applied_at timestamptz,
      created_at timestamptz not null default now()
    );
    create index if not exists monica_contacts_email_idx on monica_import.contacts (lower(email));
    create index if not exists monica_mapping_status_idx on monica_import.mapping_candidates (status);
  `)

  const batch = await pool.query(
    `insert into monica_import.import_batches (source_name, source_account_id, notes)
     values ($1, $2, $3) returning id`,
    [
      "monica-(1)-rxhcV.sql",
      96926,
      "Sanitized import. Credential fields, tokens, API keys, password hashes, and 2FA secrets excluded.",
    ],
  )
  const batchId = batch.rows[0].id

  const contact = await pool.query(
    `insert into monica_import.contacts
      (batch_id, source_id, first_name, last_name, email, timezone, locale, raw_data)
     values ($1, $2, $3, $4, $5, $6, $7, $8::jsonb)
     returning id, email`,
    [
      batchId,
      96623,
      "Lin",
      "Huang",
      "cb9273986@gmail.com",
      "Africa/Lagos",
      "en",
      JSON.stringify({ admin: false, metric: "fahrenheit" }),
    ],
  )

  let matched = 0
  let unmatched = 0
  for (const row of contact.rows) {
    const user = await pool.query(
      `select id from public.users where lower(email) = lower($1) limit 1`,
      [row.email],
    )
    const match = user.rows[0]
    await pool.query(
      `insert into monica_import.mapping_candidates
        (batch_id, contact_id, bankchase_user_id, match_reason, status, reviewed_at)
       values ($1, $2, $3, $4, $5, now())`,
      [
        batchId,
        row.id,
        match?.id ?? null,
        match ? "Exact email match against BankChase users" : "No exact email match found",
        match ? "approved" : "pending",
      ],
    )
    if (match) matched += 1
    else unmatched += 1
  }

  console.log(`Monica mapping complete: ${matched} matched, ${unmatched} pending.`)
} finally {
  await pool.end()
}

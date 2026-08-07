import { createClient } from "@supabase/supabase-js"
import pg from "pg"

const { Pool } = pg

const required = [
  "DATABASE_URL",
  "SUPABASE_URL",
  "SUPABASE_SERVICE_ROLE_KEY",
]

for (const name of required) {
  if (!process.env[name]) {
    throw new Error(`${name} is required to map Monica contacts safely.`)
  }
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } },
)

try {
  const { data: contacts, error: contactsError } = await supabase
    .schema("monica_import")
    .from("contacts")
    .select("id, batch_id, email")
    .not("email", "is", null)

  if (contactsError) throw contactsError

  let matched = 0
  let unmatched = 0

  for (const contact of contacts ?? []) {
    const result = await pool.query(
      'select id from "user" where lower(email) = lower($1) limit 1',
      [contact.email],
    )
    const user = result.rows[0]

    const update = await supabase
      .schema("monica_import")
      .from("mapping_candidates")
      .update({
        bankchase_user_id: user?.id ?? null,
        match_reason: user
          ? "Exact email match against the BankChase Better Auth user table"
          : "No exact email match found in the BankChase Better Auth user table",
        status: user ? "approved" : "pending",
        reviewed_at: new Date().toISOString(),
      })
      .eq("contact_id", contact.id)
      .eq("status", "pending")

    if (update.error) throw update.error

    if (user) matched += 1
    else unmatched += 1
  }

  console.log(`Monica mapping complete: ${matched} matched, ${unmatched} pending.`)
} finally {
  await pool.end()
}

import { createClient } from '@/lib/supabase/server'

export const dynamic = 'force-dynamic'

export default async function NotesPage() {
  const supabase = await createClient()
  const { data: notes, error } = await supabase
    .from('notes')
    .select('id, title')
    .order('id', { ascending: true })

  return (
    <main className="min-h-screen bg-background px-6 py-16 text-foreground">
      <section className="mx-auto flex w-full max-w-2xl flex-col gap-8">
        <header className="flex flex-col gap-3">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-primary">BankChase workspace</p>
          <h1 className="text-4xl font-semibold tracking-tight">Notes</h1>
          <p className="text-muted-foreground leading-relaxed">
            Data on this page is loaded securely from the connected Supabase database.
          </p>
        </header>

        {error ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5 text-destructive" role="alert">
            Notes are temporarily unavailable. Please try again shortly.
          </div>
        ) : notes?.length ? (
          <ol className="flex flex-col gap-3" aria-label="Saved notes">
            {notes.map((note) => (
              <li key={note.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
                {note.title}
              </li>
            ))}
          </ol>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-8 text-center text-muted-foreground">
            No notes have been added yet.
          </div>
        )}
      </section>
    </main>
  )
}

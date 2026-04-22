import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

export const dynamic = "force-dynamic"

export async function GET() {
  const session = await getServerSession(authOptions)

  if (!session?.user?.isAdmin) {
    return NextResponse.json({ ok: false, error: "Not signed in as admin" }, { status: 403 })
  }

  const sessionId = session.user.id as string

  // Does the session's user.id actually exist in public.users?
  const { data: userRow, error: userErr } = await supabaseAdmin
    .from("users")
    .select("id, email, username, is_admin, email_verified")
    .eq("id", sessionId)
    .maybeSingle()

  // If the session id doesn't match, look up by email so we can surface
  // the REAL users row id and tell the user what to do.
  let userRowByEmail: any = null
  if (!userRow && session.user.email) {
    const r = await supabaseAdmin
      .from("users")
      .select("id, email, username, is_admin, email_verified")
      .eq("email", session.user.email)
      .maybeSingle()
    userRowByEmail = r.data || null
  }

  // Actual minimal article insert attempt against the live DB.
  const testTitle = `__diag ${new Date().toISOString()}`
  const testSlug = `__diag-${Date.now()}`
  const insertResult = await supabaseAdmin
    .from("articles")
    .insert({
      title: testTitle,
      slug: testSlug,
      body: "diagnostic insert — safe to delete",
      published: false,
      author_id: sessionId,
    })
    .select("id, slug, published, created_at:created_at")
    .single()

  // If the insert worked, delete it so we don't litter the table.
  let deleted = false
  if (insertResult.data?.id) {
    await supabaseAdmin.from("articles").delete().eq("id", insertResult.data.id)
    deleted = true
  }

  // Columns actually present in articles right now.
  const { data: columns } = await supabaseAdmin.rpc("pg_catalog_articles_columns" as any).then(
    (r: any) => r,
    () => ({ data: null })
  )

  // Fallback: query information_schema via a raw select against a view
  // isn't available through the JS client, so we just report what the
  // insert told us (if any column is missing PostgREST throws PGRST204).

  return NextResponse.json({
    ok: true,
    session: {
      id: sessionId,
      email: session.user.email,
      username: (session.user as any).username,
      isAdmin: session.user.isAdmin,
    },
    userLookup: {
      byId: userRow,
      byIdError: userErr?.message ?? null,
      byEmailFallback: userRowByEmail,
      sessionIdMatchesUsersTable: !!userRow,
    },
    articleInsertAttempt: {
      ok: !insertResult.error,
      error: insertResult.error && {
        message: insertResult.error.message,
        code: insertResult.error.code,
        details: insertResult.error.details,
        hint: insertResult.error.hint,
      },
      insertedRow: insertResult.data,
      cleanedUp: deleted,
    },
    articlesColumns: columns,
    nextSteps:
      !userRow && userRowByEmail
        ? [
            "Your session JWT has a stale user.id from the pre-Supabase database.",
            "Sign out (top nav) and sign back in. Your session will rebuild with the correct users.id.",
            "Then retry the article save — the FK (articles.author_id → users.id) will resolve.",
          ]
        : insertResult.error
        ? [
            `Insert failed at DB level: ${insertResult.error.code || "?"} ${insertResult.error.message}`,
            "Fix this error in the DB, then the admin editor will work.",
          ]
        : [
            "Test insert + delete round-trip succeeded.",
            "If the admin form still shows 0 articles, the issue is elsewhere — check the POST response in DevTools Network tab.",
          ],
  })
}

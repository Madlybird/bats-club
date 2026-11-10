import crypto from "crypto"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "@/lib/supabase"
import { sendWelcomeEmail } from "@/lib/email"

export const USERNAME_RE = /^[a-zA-Z0-9_-]{3,30}$/

// ilike gives case-insensitive equality, but "_" and "%" are wildcards in
// it ("kiwi_bird" would also match "kiwiXbird"), so escape them.
function ilikeExact(value: string): string {
  return value.replace(/[\\%_]/g, (c) => `\\${c}`)
}

// Google users have no password. The users.password column is NOT NULL, so
// they get a bcrypt hash of 32 random bytes that is never stored or shown
// anywhere: password sign-in can't match it, and "Forgot password" lets
// them set a real one later if they want.
async function unusablePasswordHash(): Promise<string> {
  return bcrypt.hash(crypto.randomBytes(32).toString("hex"), 12)
}

function baseFromEmail(email: string): string {
  let base = email.split("@")[0].toLowerCase().replace(/[^a-z0-9_-]+/g, "_")
  base = base.replace(/^[_-]+|[_-]+$/g, "").slice(0, 24)
  if (base.length < 3) base = `collector${base}`.slice(0, 24)
  return base
}

async function usernameTaken(username: string, exceptId?: string): Promise<boolean> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .ilike("username", ilikeExact(username))
    .limit(1)
  if (error) throw error
  return !!data?.length && data[0].id !== exceptId
}

// A free username derived from the email's local part: "kiwi_bird", then
// "kiwi_bird_4821" etc. if taken.
export async function suggestUsername(email: string, exceptId?: string): Promise<string> {
  const base = baseFromEmail(email)
  if (!(await usernameTaken(base, exceptId))) return base
  for (let i = 0; i < 8; i++) {
    const candidate = `${base}_${crypto.randomInt(1000, 10000)}`
    if (!(await usernameTaken(candidate, exceptId))) return candidate
  }
  return `${base}_${crypto.randomBytes(3).toString("hex")}`
}

export async function isUsernameAvailable(username: string, userId: string): Promise<boolean> {
  return !(await usernameTaken(username, userId))
}

export interface GoogleUserResult {
  id: string
  username: string
  isAdmin: boolean
  isNew: boolean // true → show the "choose your username" step
}

// Finds or creates the Bats Club account for a Google sign-in. Only called
// with an email Google itself reports as verified.
//  - verified account with this email → same account (orders, stamps,
//    wishlist all stay);
//  - unverified row (abandoned sign-up, squatted address, guest-checkout
//    buyer) → taken over: Google proves the address belongs to this
//    person, so the row is marked verified and any password someone else
//    set on it is replaced (which also revokes that password's sessions);
//  - no row → new account, auto username, welcome email.
export async function findOrCreateGoogleUser(
  rawEmail: string,
  displayName: string | null | undefined,
): Promise<GoogleUserResult> {
  const email = rawEmail.trim().toLowerCase()

  const { data: existing, error } = await supabaseAdmin
    .from("users")
    .select("id, username, is_admin, email_verified")
    .ilike("email", ilikeExact(email))
    .maybeSingle()
  if (error) throw error

  if (existing?.email_verified) {
    return { id: existing.id, username: existing.username, isAdmin: !!existing.is_admin, isNew: false }
  }

  if (existing) {
    const { data, error: upErr } = await supabaseAdmin
      .from("users")
      .update({
        email_verified: true,
        password: await unusablePasswordHash(),
        password_changed_at: new Date(Date.now() - 1000).toISOString(),
      })
      .eq("id", existing.id)
      .select("id, username, is_admin")
      .single()
    if (upErr || !data) throw upErr || new Error("google takeover matched no row")
    await welcome(email, data.username)
    return { id: data.id, username: data.username, isAdmin: !!data.is_admin, isNew: true }
  }

  const name = (displayName || email.split("@")[0]).trim().slice(0, 80) || "Collector"
  // Retry once on a username race (unique constraint).
  for (let attempt = 0; attempt < 2; attempt++) {
    const username = await suggestUsername(email)
    const { data, error: insErr } = await supabaseAdmin
      .from("users")
      .insert({ name, username, email, password: await unusablePasswordHash(), email_verified: true })
      .select("id, username, is_admin")
      .single()
    if (!insErr && data) {
      await welcome(email, data.username)
      return { id: data.id, username: data.username, isAdmin: !!data.is_admin, isNew: true }
    }
    if (insErr?.code !== "23505") throw insErr
  }
  throw new Error("could not create google user")
}

async function welcome(email: string, username: string) {
  try {
    await sendWelcomeEmail(email, username)
  } catch (e: any) {
    console.error("[google-auth] welcome email failed:", e?.message)
  }
}

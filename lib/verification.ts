import crypto from "crypto"
import { supabaseAdmin } from "@/lib/supabase"
import { sendVerificationEmail } from "@/lib/email"

export const VERIFY_CODE_TTL_MS = 15 * 60 * 1000
/** An unverified account whose last code is older than this can be re-registered. */
export const PENDING_HOLD_MS = 24 * 60 * 60 * 1000

/**
 * Issues a fresh 6-digit email verification code: retires the user's
 * unused codes, stores the new one (15-min expiry) and emails it.
 */
export async function issueVerificationCode(userId: string, email: string): Promise<void> {
  await supabaseAdmin
    .from("verification_tokens")
    .update({ used: true })
    .eq("user_id", userId)
    .eq("used", false)

  const code = String(crypto.randomInt(100000, 1000000))
  const { error } = await supabaseAdmin.from("verification_tokens").insert({
    user_id: userId,
    token: code,
    expires_at: new Date(Date.now() + VERIFY_CODE_TTL_MS).toISOString(),
  })
  if (error) throw error

  await sendVerificationEmail(email, code)
}

/**
 * When the latest verification code for this user was issued (ms), or 0.
 * Used to tell a live sign-up (code sent recently) from an abandoned or
 * squatted one that its real owner may take over.
 */
export async function lastCodeIssuedAt(userId: string): Promise<number> {
  const { data } = await supabaseAdmin
    .from("verification_tokens")
    .select("created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  return data?.created_at ? new Date(data.created_at).getTime() : 0
}

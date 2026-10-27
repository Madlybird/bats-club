import { NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { supabaseAdmin } from "@/lib/supabase"
import { checkRateLimit, rateLimit } from "@/lib/rate-limit"
import { issueVerificationCode } from "@/lib/verification"

// Same constant as lib/auth.ts: keeps unknown-email responses as slow as real ones.
const DUMMY_HASH = "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW"

// One reply for every outcome (unknown email, wrong password, already
// verified, sent) so this can't be used to probe accounts or passwords.
const OK = { ok: true, message: "If the email and password match a pending account, a new code is on its way." }

/**
 * Re-sends the email verification code. Requires the password chosen at
 * sign-up, so only the person who registered can trigger it — a squatter
 * can't use it to push codes at the real inbox owner.
 */
export async function POST(req: Request) {
  // 3 / 15 min per IP; the per-email cap below stops mail-bombing one inbox.
  const limited = checkRateLimit(req, "resend-code", 3, 15 * 60 * 1000)
  if (limited) return limited

  try {
    const { email, password } = await req.json()
    if (typeof email !== "string" || typeof password !== "string" || !email || !password) {
      return NextResponse.json({ error: "Email and password are required" }, { status: 400 })
    }

    const perEmail = rateLimit(`resend-code-email:${email.toLowerCase()}`, 3, 60 * 60 * 1000)
    if (!perEmail.ok) {
      return NextResponse.json(
        { error: "Too many requests. Please try again later." },
        { status: 429, headers: { "Retry-After": String(perEmail.retryAfterSec) } },
      )
    }

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, email, password, email_verified")
      .eq("email", email)
      .maybeSingle()

    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH)
      return NextResponse.json(OK)
    }
    if (!(await bcrypt.compare(password, user.password)) || user.email_verified) {
      return NextResponse.json(OK)
    }

    await issueVerificationCode(user.id, user.email)
    return NextResponse.json(OK)
  } catch (err) {
    console.error("[resend-code]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

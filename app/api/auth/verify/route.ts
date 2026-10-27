import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendWelcomeEmail } from "@/lib/email"
import { checkRateLimit, rateLimit } from "@/lib/rate-limit"
import bcrypt from "bcryptjs"

// Compared against when the email is unknown, so the response time doesn't
// reveal whether an account exists (same constant as lib/auth.ts).
const DUMMY_HASH = "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW"

export async function POST(req: Request) {
  // Cap brute force of the 6-digit code on two axes:
  //  - per IP+email (10 / 10 min) — stops a single host hammering, and
  //  - per email regardless of IP (20 / 15 min) — stops a distributed
  //    attempt from cracking the 10^6 space across many IPs.
  let emailForKey = ""
  try {
    emailForKey = String((await req.clone().json())?.email || "").toLowerCase()
  } catch {}
  const limited = checkRateLimit(req, "verify", 10, 10 * 60 * 1000, emailForKey)
  if (limited) return limited
  if (emailForKey) {
    const perEmail = rateLimit(`verify-email:${emailForKey}`, 20, 15 * 60 * 1000)
    if (!perEmail.ok) {
      return NextResponse.json(
        { error: "Too many attempts. Please request a new code later." },
        { status: 429, headers: { "Retry-After": String(perEmail.retryAfterSec) } },
      )
    }
  }

  try {
    const { email, code, password } = await req.json()
    if (!email || !code || !password) {
      return NextResponse.json({ error: "Email, code and password are required" }, { status: 400 })
    }
    if (typeof email !== "string" || typeof code !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }

    // Find the user
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, username, email_verified, password")
      .eq("email", email)
      .maybeSingle()

    // The code alone isn't enough: it must come with the password chosen
    // at sign-up. Otherwise someone who registered another person's email
    // (setting their own password) could get that person to type in the
    // code and end up owning a verified account under their address.
    // Every failure (unknown email, wrong password, wrong/expired/used
    // code, already verified) gets the same reply, so this endpoint can't
    // be used to test passwords or probe accounts.
    const bad = () => NextResponse.json({ error: "Invalid or expired code, or wrong password" }, { status: 400 })
    if (!user) {
      await bcrypt.compare(password, DUMMY_HASH)
      return bad()
    }
    const passwordOk = await bcrypt.compare(password, user.password)

    const { data: token } = await supabaseAdmin
      .from("verification_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("token", code)
      .eq("used", false)
      .maybeSingle()

    if (!passwordOk || user.email_verified || !token || new Date(token.expires_at) < new Date()) {
      return bad()
    }

    // Mark token as used (atomically — a code can be redeemed once)
    const { data: claimed } = await supabaseAdmin
      .from("verification_tokens")
      .update({ used: true })
      .eq("id", token.id)
      .eq("used", false)
      .select("id")
      .maybeSingle()
    if (!claimed) return bad()

    // Mark user as verified
    await supabaseAdmin
      .from("users")
      .update({ email_verified: true })
      .eq("id", user.id)

    // Send welcome email
    await sendWelcomeEmail(email, user.username)

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[verify]", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

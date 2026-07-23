import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendWelcomeEmail } from "@/lib/email"
import { checkRateLimit, rateLimit } from "@/lib/rate-limit"

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
    const { email, code } = await req.json()
    if (!email || !code) {
      return NextResponse.json({ error: "Email and code are required" }, { status: 400 })
    }

    // Find the user
    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id, username, email_verified")
      .eq("email", email)
      .single()

    if (!user) {
      return NextResponse.json({ error: "Invalid verification code" }, { status: 400 })
    }

    if (user.email_verified) {
      return NextResponse.json({ ok: true, alreadyVerified: true })
    }

    // Find valid token
    const { data: token } = await supabaseAdmin
      .from("verification_tokens")
      .select("*")
      .eq("user_id", user.id)
      .eq("token", code)
      .eq("used", false)
      .single()

    if (!token || new Date(token.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invalid or expired verification code" }, { status: 400 })
    }

    // Mark token as used
    await supabaseAdmin
      .from("verification_tokens")
      .update({ used: true })
      .eq("id", token.id)

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

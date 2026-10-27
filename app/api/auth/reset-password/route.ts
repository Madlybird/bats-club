import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import { checkRateLimit } from "@/lib/rate-limit"

export async function POST(req: Request) {
  // Throttle token guessing: 10 / 10 min per IP.
  const limited = checkRateLimit(req, "reset-password", 10, 10 * 60 * 1000)
  if (limited) return limited

  try {
    const { token, password } = await req.json()
    if (!token || !password) return NextResponse.json({ error: "Token and password required" }, { status: 400 })
    if (typeof token !== "string" || typeof password !== "string") {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 })
    }
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    if (password.length > 128) return NextResponse.json({ error: "Password must be at most 128 characters" }, { status: 400 })

    // Claim the token atomically: only one request can flip used=false →
    // true, so a link can't be redeemed twice in parallel.
    const { data: record } = await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("token", token)
      .eq("used", false)
      .gt("expires_at", new Date().toISOString())
      .select("email")
      .maybeSingle()

    if (!record) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)

    // password_changed_at revokes every session issued before now
    // (lib/auth.ts). Following the emailed link proves the address, so it
    // also verifies the email — that's how a pending account (e.g. one
    // created for a guest checkout, or squatted by someone else) is
    // recovered by its real owner.
    const { error: updateError } = await supabaseAdmin
      .from("users")
      .update({
        password: hashed,
        password_changed_at: new Date().toISOString(),
        email_verified: true,
      })
      .eq("email", record.email)
    if (updateError) throw updateError

    // Any other outstanding reset links for this address are now stale.
    await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("email", record.email)
      .eq("used", false)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[reset-password]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

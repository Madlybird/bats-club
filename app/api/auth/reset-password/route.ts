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
    if (password.length < 8) return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    if (password.length > 128) return NextResponse.json({ error: "Password must be at most 128 characters" }, { status: 400 })

    const { data: record } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .single()

    if (!record || record.used || new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 12)

    await supabaseAdmin
      .from("users")
      .update({ password: hashed })
      .eq("email", record.email)

    await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("token", token)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[reset-password]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { token, password } = await req.json()
    if (!token || !password) return NextResponse.json({ error: "Token and password required" }, { status: 400 })
    if (password.length < 6) return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })

    const { data: record } = await supabaseAdmin
      .from("password_reset_tokens")
      .select("*")
      .eq("token", token)
      .single()

    if (!record || record.used || new Date(record.expires_at) < new Date()) {
      return NextResponse.json({ error: "Invalid or expired reset link" }, { status: 400 })
    }

    const hashed = await bcrypt.hash(password, 10)

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

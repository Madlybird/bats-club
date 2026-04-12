import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendPasswordResetEmail } from "@/lib/email"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    const { email } = await req.json()
    if (!email) return NextResponse.json({ error: "Email required" }, { status: 400 })

    const { data: user } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    // Always return success to prevent email enumeration
    if (!user) return NextResponse.json({ ok: true })

    // Invalidate old tokens for this email
    await supabaseAdmin
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("email", email)
      .eq("used", false)

    const token = crypto.randomBytes(32).toString("hex")
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString() // 1 hour

    const { error } = await supabaseAdmin
      .from("password_reset_tokens")
      .insert({ token, email, expires_at: expiresAt })

    if (error) throw error

    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://batsclub.com"
    const resetUrl = `${baseUrl}/reset-password?token=${token}`

    await sendPasswordResetEmail(email, resetUrl)

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[forgot-password]", err)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

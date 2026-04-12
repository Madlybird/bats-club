import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendWelcomeEmail } from "@/lib/email"

export async function POST(req: Request) {
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

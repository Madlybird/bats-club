import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendVerificationEmail } from "@/lib/email"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    const { name, username, email, password } = await req.json()

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    const { data: existingEmail } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .single()

    if (existingEmail) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    const { data: existingUsername } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .single()

    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const { data: user, error } = await supabaseAdmin
      .from("users")
      .insert({ name, username, email, password: hashedPassword, email_verified: false })
      .select("id, name, username, email")
      .single()

    if (error) throw error

    // Generate 6-digit verification code
    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString() // 15 minutes

    await supabaseAdmin.from("verification_tokens").insert({
      user_id: user.id,
      token: code,
      expires_at: expiresAt,
    })

    await sendVerificationEmail(email, code)

    return NextResponse.json({ ...user, needsVerification: true }, { status: 201 })
  } catch (error) {
    console.error("Register error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

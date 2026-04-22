import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendVerificationEmail } from "@/lib/email"
import bcrypt from "bcryptjs"

function errorResponse(stage: string, error: any, status = 500) {
  const payload = {
    error: error?.message || "Request failed",
    stage,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  }
  console.error(`[register] ${stage} failed`, payload)
  return NextResponse.json(payload, { status })
}

export async function POST(req: Request) {
  let stage = "parse-body"
  try {
    const { name, username, email, password } = await req.json()

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters" }, { status: 400 })
    }

    stage = "check-email"
    const { data: existingEmail, error: emailError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("email", email)
      .maybeSingle()
    if (emailError) return errorResponse(stage, emailError)
    if (existingEmail) {
      return NextResponse.json({ error: "Email already in use" }, { status: 409 })
    }

    stage = "check-username"
    const { data: existingUsername, error: usernameError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle()
    if (usernameError) return errorResponse(stage, usernameError)
    if (existingUsername) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    stage = "insert-user"
    const { data: user, error: insertError } = await supabaseAdmin
      .from("users")
      .insert({ name, username, email, password: hashedPassword, email_verified: false })
      .select("id, name, username, email")
      .single()
    if (insertError || !user) {
      return errorResponse(stage, insertError || new Error("insert returned no row"))
    }

    const code = String(Math.floor(100000 + Math.random() * 900000))
    const expiresAt = new Date(Date.now() + 15 * 60 * 1000).toISOString()

    stage = "insert-token"
    const { error: tokenError } = await supabaseAdmin
      .from("verification_tokens")
      .insert({ user_id: user.id, token: code, expires_at: expiresAt })
    if (tokenError) return errorResponse(stage, tokenError)

    stage = "send-email"
    try {
      await sendVerificationEmail(email, code)
    } catch (mailErr: any) {
      return errorResponse(stage, mailErr)
    }

    return NextResponse.json({ ...user, needsVerification: true }, { status: 201 })
  } catch (error: any) {
    return errorResponse(stage, error)
  }
}

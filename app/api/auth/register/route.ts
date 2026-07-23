import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { sendVerificationEmail } from "@/lib/email"
import bcrypt from "bcryptjs"
import crypto from "crypto"
import { checkRateLimit } from "@/lib/rate-limit"

function errorResponse(stage: string, error: any, status = 500) {
  // Full detail to server logs only; generic message to the client.
  console.error(`[register] ${stage} failed`, {
    message: error?.message,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  })
  return NextResponse.json({ error: "Request failed", stage }, { status })
}

export async function POST(req: Request) {
  // Throttle account creation / verification-email sends: 5 / 10 min per IP.
  const limited = checkRateLimit(req, "register", 5, 10 * 60 * 1000)
  if (limited) return limited

  let stage = "parse-body"
  try {
    const { name, username, email, password } = await req.json()

    if (!name || !username || !email || !password) {
      return NextResponse.json({ error: "All fields are required" }, { status: 400 })
    }

    if (password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }

    // Format validation — reject malformed email and unsafe usernames
    // (username appears in /profile/[username] URLs, so restrict it to a
    // safe charset and length).
    if (typeof email !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 })
    }
    if (typeof username !== "string" || !/^[a-zA-Z0-9_-]{3,30}$/.test(username)) {
      return NextResponse.json(
        { error: "Username must be 3–30 characters: letters, numbers, _ or -" },
        { status: 400 },
      )
    }
    if (typeof name !== "string" || name.length > 80) {
      return NextResponse.json({ error: "Name is too long" }, { status: 400 })
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

    const code = String(crypto.randomInt(100000, 1000000))
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

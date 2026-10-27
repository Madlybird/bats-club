import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import { checkRateLimit } from "@/lib/rate-limit"
import { issueVerificationCode, lastCodeIssuedAt, PENDING_HOLD_MS } from "@/lib/verification"

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

    if (typeof password !== "string" || password.length < 8) {
      return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 })
    }
    if (password.length > 128) {
      return NextResponse.json({ error: "Password must be at most 128 characters" }, { status: 400 })
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
      .select("id, email_verified")
      .eq("email", email)
      .maybeSingle()
    if (emailError) return errorResponse(stage, emailError)

    // An unverified account with this email is either a sign-up in
    // progress, an abandoned/squatted one, or a guest-checkout buyer record
    // (created by the Stripe webhook). It is taken over by this sign-up
    // (same row, so past orders stay attached) unless a code went out in
    // the last 24h — that keeps a live sign-up from being hijacked. Taking
    // over never grants access by itself: the code goes to the inbox, and
    // /api/auth/verify also requires the password set here.
    let reclaimId: string | null = null
    if (existingEmail) {
      if (existingEmail.email_verified) {
        return NextResponse.json({ error: "Email already in use" }, { status: 409 })
      }
      stage = "check-pending"
      if (Date.now() - (await lastCodeIssuedAt(existingEmail.id)) < PENDING_HOLD_MS) {
        return NextResponse.json(
          {
            error:
              "This email is waiting for verification. Enter the code we sent, or request a new one on the verification page.",
            pendingVerification: true,
          },
          { status: 409 },
        )
      }
      reclaimId = existingEmail.id
    }

    stage = "check-username"
    const { data: existingUsername, error: usernameError } = await supabaseAdmin
      .from("users")
      .select("id")
      .eq("username", username)
      .maybeSingle()
    if (usernameError) return errorResponse(stage, usernameError)
    if (existingUsername && existingUsername.id !== reclaimId) {
      return NextResponse.json({ error: "Username already taken" }, { status: 409 })
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    let user: { id: string; name: string; username: string; email: string } | null = null
    if (reclaimId) {
      stage = "reclaim-user"
      const { data, error } = await supabaseAdmin
        .from("users")
        .update({
          name,
          username,
          password: hashedPassword,
          // Revokes any session tied to the previous password.
          password_changed_at: new Date().toISOString(),
          email_verified: false,
        })
        .eq("id", reclaimId)
        .eq("email_verified", false)
        .select("id, name, username, email")
        .maybeSingle()
      if (error || !data) return errorResponse(stage, error || new Error("reclaim matched no row"))
      user = data
    } else {
      stage = "insert-user"
      const { data, error: insertError } = await supabaseAdmin
        .from("users")
        .insert({ name, username, email, password: hashedPassword, email_verified: false })
        .select("id, name, username, email")
        .single()
      if (insertError || !data) {
        return errorResponse(stage, insertError || new Error("insert returned no row"))
      }
      user = data
    }

    stage = "issue-code"
    try {
      await issueVerificationCode(user.id, email)
    } catch (mailErr: any) {
      return errorResponse(stage, mailErr)
    }

    return NextResponse.json({ ...user, needsVerification: true }, { status: 201 })
  } catch (error: any) {
    return errorResponse(stage, error)
  }
}

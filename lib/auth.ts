import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import { supabaseAdmin } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import { rateLimit } from "@/lib/rate-limit"

// Generic message used for every credential failure (no account, wrong
// password) so an attacker can't enumerate which emails are registered.
const INVALID_CREDS = "Invalid email or password"

// Valid bcrypt hash (cost 12) compared against when the account doesn't
// exist, so a missing-account response takes the same time as a wrong
// password — closes the timing side-channel for enumeration.
const DUMMY_HASH = "$2a$12$R9h/cIPz0gi.URNNX3kh2OPST9/PgBkqquzi.Ss7KIUgO2t0jWMUW"

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required")
        }

        // Throttle brute-force: 10 attempts / 5 min per IP+email.
        // Use x-real-ip (Vercel-trusted); xff[0] is client-spoofable.
        const h = req?.headers || {}
        const xffLast = (h["x-forwarded-for"] as string | undefined)
          ?.split(",").map((p) => p.trim()).filter(Boolean).pop()
        const ip = (h["x-real-ip"] as string | undefined)?.trim() || xffLast || "unknown"
        const limited = rateLimit(
          `login:${ip}:${credentials.email.toLowerCase()}`,
          10,
          5 * 60 * 1000,
        )
        if (!limited.ok) {
          throw new Error("Too many login attempts. Please try again later.")
        }

        const { data: user, error } = await supabaseAdmin
          .from("users")
          .select("id, email, name, username, password, is_admin, email_verified")
          .eq("email", credentials.email)
          .single()

        // Same generic error whether the account is missing or the
        // password is wrong — prevents email enumeration. Still run a
        // bcrypt compare on a dummy hash when the user is missing so the
        // response time doesn't reveal account existence either.
        if (error || !user) {
          await bcrypt.compare(credentials.password, DUMMY_HASH)
          throw new Error(INVALID_CREDS)
        }

        const isPasswordValid = await bcrypt.compare(credentials.password, user.password)
        if (!isPasswordValid) {
          throw new Error(INVALID_CREDS)
        }

        if (!user.email_verified) {
          throw new Error("Please verify your email before signing in.")
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          username: user.username,
          isAdmin: user.is_admin,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id
        token.username = (user as any).username
        token.isAdmin = (user as any).isAdmin
      } else if (token.isAdmin && token.id) {
        // Re-verify admin status against the DB on every request so a
        // revoked admin loses access on their next request instead of
        // keeping it until the JWT expires (up to maxAge). Only sessions
        // that currently claim admin pay this query — regular users skip
        // it entirely.
        const { data } = await supabaseAdmin
          .from("users")
          .select("is_admin")
          .eq("id", token.id as string)
          .maybeSingle()
        token.isAdmin = !!data?.is_admin
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.isAdmin = token.isAdmin as boolean
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
    // Cap the window in which a stale/compromised token stays valid.
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

import { NextAuthOptions } from "next-auth"
import CredentialsProvider from "next-auth/providers/credentials"
import GoogleProvider from "next-auth/providers/google"
import { supabaseAdmin } from "@/lib/supabase"
import bcrypt from "bcryptjs"
import { rateLimit } from "@/lib/rate-limit"
import { findOrCreateGoogleUser } from "@/lib/google-auth"

export const googleAuthEnabled = !!(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET)

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

        const isPasswordValid = user.password
          ? await bcrypt.compare(credentials.password, user.password)
          : false
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
    ...(googleAuthEnabled
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID!,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
            // Always show Google's account chooser, so a shared computer
            // doesn't silently sign in whoever used Google last.
            authorization: { params: { prompt: "select_account" } },
          }),
        ]
      : []),
  ],
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider === "google") {
        // Only accept addresses Google itself has verified — that check
        // replaces our email code for Google sign-ins.
        const p = profile as { email?: string; email_verified?: boolean } | undefined
        return !!(p?.email && p.email_verified === true)
      }
      return true
    },
    async jwt({ token, user, account, profile, trigger }) {
      if (account?.provider === "google") {
        const p = profile as { email: string; name?: string }
        const g = await findOrCreateGoogleUser(p.email, p.name)
        token.id = g.id
        token.username = g.username
        token.isAdmin = g.isAdmin
        token.needsUsername = g.isNew
        // Google's own user id must never be used as ours.
        token.sub = g.id
        return token
      }
      if (trigger === "update" && token.id) {
        // Sent by the username step after it saved. Re-read from the DB —
        // never trust values the client passes to update().
        const { data } = await supabaseAdmin
          .from("users")
          .select("username")
          .eq("id", token.id as string)
          .maybeSingle()
        if (data) token.username = data.username
        token.needsUsername = false
      }
      if (user) {
        token.id = user.id
        token.username = (user as any).username
        token.isAdmin = (user as any).isAdmin
      } else if (token.id) {
        // Re-check the account on every request:
        //  - a password change (reset) revokes every session issued before
        //    it, so a hijacked session dies on its next request instead of
        //    living until the JWT expires (up to maxAge);
        //  - a deleted account loses its sessions;
        //  - a revoked admin loses admin immediately.
        // Throwing makes NextAuth clear the session cookie and treat the
        // request as signed out (getServerSession → null).
        const { data, error } = await supabaseAdmin
          .from("users")
          .select("is_admin, password_changed_at")
          .eq("id", token.id as string)
          .maybeSingle()
        if (error) {
          // Transient DB error: keep the session (don't sign everyone out)
          // but never keep admin rights we couldn't confirm.
          console.error("[auth] session re-check failed:", error.message)
          token.isAdmin = false
          return token
        }
        if (!data) throw new Error("SessionRevoked: account no longer exists")
        const changedAt = (data as any).password_changed_at
          ? Math.floor(new Date((data as any).password_changed_at).getTime() / 1000)
          : 0
        const issuedAt = typeof token.iat === "number" ? token.iat : 0
        if (changedAt > issuedAt) throw new Error("SessionRevoked: password changed")
        // Only ever demote: admin is granted at sign-in, not mid-session.
        token.isAdmin = !!token.isAdmin && !!data.is_admin
      }
      return token
    },
    async session({ session, token }) {
      if (token && session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string
        session.user.isAdmin = token.isAdmin as boolean
        session.user.needsUsername = !!token.needsUsername
      }
      return session
    },
  },
  pages: {
    signIn: "/login",
    // Failed Google sign-ins land back on /login?error=..., not on
    // NextAuth's bare built-in error page.
    error: "/login",
  },
  session: {
    strategy: "jwt",
    // Cap the window in which a stale/compromised token stays valid.
    maxAge: 7 * 24 * 60 * 60, // 7 days
  },
  secret: process.env.NEXTAUTH_SECRET,
}

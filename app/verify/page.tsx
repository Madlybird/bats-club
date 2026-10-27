"use client"

import { useEffect, useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { signIn } from "next-auth/react"
import Image from "next/image"
import BatsOverlay from "@/components/BatsOverlay"

// RegisterForm hands over the address in sessionStorage (kept out of the
// URL so it never reaches analytics) and the password as _bats_pw (used
// for auto sign-in and, now, required by /api/auth/verify). ?email= is
// still read for old links.
const EMAIL_KEY = "_bats_verify_email"
const PW_KEY = "_bats_pw"
const RESEND_COOLDOWN_S = 60

function readSession(key: string): string {
  try {
    return sessionStorage.getItem(key) || ""
  } catch {
    return ""
  }
}

function VerifyForm() {
  const router = useRouter()
  const params = useSearchParams()

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [hasStoredPw, setHasStoredPw] = useState(false)
  const [hasEmail, setHasEmail] = useState(false)
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [notice, setNotice] = useState("")
  const [done, setDone] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const handed = readSession(EMAIL_KEY) || params.get("email") || ""
    setEmail(handed)
    setHasEmail(!!handed)
    const pw = readSession(PW_KEY)
    if (pw) {
      setPassword(pw)
      setHasStoredPw(true)
    }
    setReady(true)
  }, [params])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setNotice("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: code.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Verification failed")
        return
      }
      setDone(true)
      try {
        sessionStorage.removeItem(PW_KEY)
        sessionStorage.removeItem(EMAIL_KEY)
      } catch {
        /* ignore */
      }
      // Auto-sign in after verification
      const result = await signIn("credentials", { email: email.trim(), password, redirect: false })
      if (!result?.error) {
        router.push("/")
        router.refresh()
        return
      }
      setTimeout(() => router.push("/login"), 3000)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError("")
    setNotice("")
    if (!email.trim() || !password) {
      setError("Enter your email and password to get a new code.")
      return
    }
    setCooldown(RESEND_COOLDOWN_S)
    try {
      const res = await fetch("/api/auth/resend-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Could not send a new code. Please try again later.")
        return
      }
      setNotice(data.message || "A new code is on its way.")
    } catch {
      setError("Something went wrong. Please try again.")
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <BatsOverlay />
      <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Bats Club" width={160} height={48} className="h-16 w-auto mx-auto mb-2" />
          <p className="text-white/35 text-sm mt-1">Email Verification</p>
        </div>

        <div className="card p-8" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {done ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.3)" }}>
                <svg className="w-6 h-6" fill="none" stroke="#ff2d78" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">Email verified!</h2>
              <p className="text-white/40 text-sm">Signing you in...</p>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-2">Check your email</h2>
              <p className="text-white/35 text-sm mb-6">
                We sent a 6-digit code to <span className="text-white/70">{email || "your email"}</span>. Enter it below.
              </p>

              <form onSubmit={handleSubmit} className="space-y-4">
                {ready && !hasEmail && (
                  <div>
                    <label className="block text-sm text-white/40 mb-1.5 font-medium">Email</label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="input"
                    />
                  </div>
                )}
                {ready && !hasStoredPw && (
                  <div>
                    <label className="block text-sm text-white/40 mb-1.5 font-medium">Password</label>
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      autoComplete="current-password"
                      className="input"
                    />
                    <p className="text-[11px] text-white/25 mt-1">The password you chose when signing up.</p>
                  </div>
                )}
                <div>
                  <label className="block text-sm text-white/40 mb-1.5 font-medium">Verification Code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    required
                    maxLength={6}
                    className="input text-center text-2xl tracking-[0.3em] font-bold"
                    autoFocus
                  />
                </div>

                {error && (
                  <div className="bg-red-900/20 border border-red-900/50 rounded-lg px-4 py-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}
                {notice && (
                  <div className="rounded-lg px-4 py-3 border border-white/10 bg-white/[0.03]">
                    <p className="text-white/60 text-sm">{notice}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || code.length < 6 || !password}
                  className="w-full py-3 text-base font-bold mt-2 rounded-lg text-white transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: "#ff2d78" }}
                >
                  {loading ? "Verifying..." : "Verify Email"}
                </button>
              </form>

              <div className="text-center mt-4 space-y-2">
                <p className="text-xs text-white/20">Code expires in 15 minutes.</p>
                <button
                  type="button"
                  onClick={handleResend}
                  disabled={cooldown > 0}
                  className="text-xs font-semibold text-[#ff2d78] hover:underline disabled:text-white/25 disabled:no-underline"
                >
                  {cooldown > 0 ? `Send a new code in ${cooldown}s` : "Didn't get it? Send a new code"}
                </button>
                <p className="text-[11px] text-white/25">
                  Forgot the password you signed up with?{" "}
                  <a href="/forgot-password" className="text-white/50 hover:text-white underline">
                    Reset it
                  </a>{" "}
                  — that also confirms your email.
                </p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}

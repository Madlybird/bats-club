"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import BatsOverlay from "@/components/BatsOverlay"

interface ResetPasswordLabels {
  subtitle: string
  heading: string
  newPassword: string
  confirmPassword: string
  submit: string
  updating: string
  doneHeading: string
  doneDesc: string
  signinNow: string
  errorMismatch: string
  errorLength: string
  errorInvalidToken: string
  errorGeneric: string
  loginHref: string
}

function ResetPasswordFormInner({ labels }: { labels: ResetPasswordLabels }) {
  const router = useRouter()
  const params = useSearchParams()
  const token = params.get("token") ?? ""

  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [done, setDone] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!token) setError(labels.errorInvalidToken)
  }, [token, labels.errorInvalidToken])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (password !== confirm) { setError(labels.errorMismatch); return }
    // Matches the server-side minimum in app/api/auth/reset-password/route.ts.
    if (password.length < 8) { setError(labels.errorLength); return }
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || labels.errorGeneric); return }
      setDone(true)
      setTimeout(() => router.push(labels.loginHref), 3000)
    } catch {
      setError(labels.errorGeneric)
    } finally {
      setLoading(false)
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
          <p className="text-white/35 text-sm mt-1">{labels.subtitle}</p>
        </div>

        <div className="card p-8" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          {done ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.3)" }}>
                <svg className="w-6 h-6" fill="none" stroke="#ff2d78" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">{labels.doneHeading}</h2>
              <p className="text-white/40 text-sm mb-2">{labels.doneDesc}</p>
              <Link href={labels.loginHref} className="text-sm font-medium" style={{ color: "#ff2d78" }}>{labels.signinNow}</Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-6">{labels.heading}</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/40 mb-1.5 font-medium">{labels.newPassword}</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    minLength={8}
                    required
                    className="input"
                  />
                </div>
                <div>
                  <label className="block text-sm text-white/40 mb-1.5 font-medium">{labels.confirmPassword}</label>
                  <input
                    type="password"
                    value={confirm}
                    onChange={(e) => setConfirm(e.target.value)}
                    placeholder="••••••••"
                    required
                    className="input"
                  />
                </div>

                {error && (
                  <div className="bg-red-900/20 border border-red-900/50 rounded-lg px-4 py-3">
                    <p className="text-red-400 text-sm">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || !token}
                  className="w-full py-3 text-base font-bold mt-2 rounded-lg text-white transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: "#ff2d78" }}
                >
                  {loading ? labels.updating : labels.submit}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordForm({ labels }: { labels: ResetPasswordLabels }) {
  return (
    <Suspense>
      <ResetPasswordFormInner labels={labels} />
    </Suspense>
  )
}

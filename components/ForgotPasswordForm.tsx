"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import BatsOverlay from "@/components/BatsOverlay"

interface ForgotPasswordLabels {
  subtitle: string
  heading: string
  desc: string
  email: string
  submit: string
  sending: string
  sentHeading: string
  sentDesc: string // contains "{email}" placeholder
  backToSignin: string
  errorGeneric: string
  loginHref: string
}

export default function ForgotPasswordForm({ labels }: { labels: ForgotPasswordLabels }) {
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || labels.errorGeneric); return }
      setSent(true)
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
          {sent ? (
            <div className="text-center py-4">
              <div className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: "rgba(255,45,120,0.1)", border: "1px solid rgba(255,45,120,0.3)" }}>
                <svg className="w-6 h-6" fill="none" stroke="#ff2d78" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-lg font-bold text-white mb-2">{labels.sentHeading}</h2>
              <p className="text-white/40 text-sm leading-relaxed mb-6">
                {labels.sentDesc.split("{email}")[0]}
                <span className="text-white/70">{email}</span>
                {labels.sentDesc.split("{email}")[1]}
              </p>
              <Link href={labels.loginHref} className="text-sm font-medium" style={{ color: "#ff2d78" }}>
                {labels.backToSignin}
              </Link>
            </div>
          ) : (
            <>
              <h2 className="text-xl font-bold text-white mb-2">{labels.heading}</h2>
              <p className="text-white/35 text-sm mb-6">{labels.desc}</p>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm text-white/40 mb-1.5 font-medium">{labels.email}</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
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
                  disabled={loading}
                  className="w-full py-3 text-base font-bold mt-2 rounded-lg text-white transition-opacity disabled:opacity-50"
                  style={{ backgroundColor: "#ff2d78" }}
                >
                  {loading ? labels.sending : labels.submit}
                </button>
              </form>

              <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
                <Link href={labels.loginHref} className="text-sm text-white/30 hover:text-white/60 transition-colors">
                  {labels.backToSignin}
                </Link>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

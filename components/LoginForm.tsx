"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import BatsOverlay from "@/components/BatsOverlay"

interface LoginFormLabels {
  heading: string
  subtitle: string
  email: string
  password: string
  submit: string
  loading: string
  noAccount: string
  joinLink: string
  registerHref: string
}

export default function LoginForm({ labels }: { labels: LoginFormLabels }) {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const result = await signIn("credentials", { email, password, redirect: false })
      if (result?.error) {
        setError(result.error)
      } else {
        router.push("/")
        router.refresh()
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <BatsOverlay />

      <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Bats Club" width={160} height={48} className="h-16 w-auto mx-auto mb-2" />
          <p className="text-white/35 text-sm mt-1">{labels.subtitle}</p>
        </div>

        <div className="card p-8" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h2 className="text-xl font-bold text-white mb-6">{labels.heading}</h2>

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
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm text-white/40 font-medium">{labels.password}</label>
                <Link href="/forgot-password" className="text-xs transition-colors hover:text-white/60" style={{ color: "#ff2d78" }}>
                  Forgot password?
                </Link>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
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
              disabled={loading}
              className="w-full py-3 text-base font-bold mt-2 rounded-lg text-white transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ backgroundColor: "#ff2d78" }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  {labels.loading}
                </span>
              ) : (
                labels.submit
              )}
            </button>
          </form>

          <div className="mt-6 pt-6 border-t border-white/[0.06] text-center">
            <p className="text-sm text-white/30">
              {labels.noAccount}{" "}
              <Link
                href={labels.registerHref}
                className="font-medium transition-colors"
                style={{ color: "#ff2d78" }}
              >
                {labels.joinLink}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { signIn } from "next-auth/react"
import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import BatsOverlay from "@/components/BatsOverlay"

interface RegisterFormLabels {
  heading: string
  subtitle: string
  name: string
  username: string
  usernameHint: string
  email: string
  password: string
  passwordHint: string
  submit: string
  loading: string
  hasAccount: string
  signinLink: string
  loginHref: string
}

export default function RegisterForm({ labels }: { labels: RegisterFormLabels }) {
  const router = useRouter()
  const [formData, setFormData] = useState({ name: "", username: "", email: "", password: "" })
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Registration failed")
        return
      }
      const result = await signIn("credentials", {
        email: formData.email,
        password: formData.password,
        redirect: false,
      })
      if (result?.error) {
        router.push(labels.loginHref)
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
    <div className="relative min-h-screen flex items-center justify-center px-4 py-12">
      <BatsOverlay />

      <div className="absolute top-1/4 left-1/3 w-[500px] h-[500px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />
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
              <label className="block text-sm text-white/40 mb-1.5 font-medium">{labels.name}</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder="Rem Collector"
                required
                minLength={2}
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-white/40 mb-1.5 font-medium">{labels.username}</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                placeholder="figurefiend"
                required
                minLength={3}
                pattern="[a-zA-Z0-9_-]+"
                className="input"
              />
              <p className="text-xs text-white/20 mt-1">{labels.usernameHint}</p>
            </div>
            <div>
              <label className="block text-sm text-white/40 mb-1.5 font-medium">{labels.email}</label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="you@example.com"
                required
                className="input"
              />
            </div>
            <div>
              <label className="block text-sm text-white/40 mb-1.5 font-medium">{labels.password}</label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="••••••••"
                required
                minLength={6}
                className="input"
              />
              <p className="text-xs text-white/20 mt-1">{labels.passwordHint}</p>
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
              {labels.hasAccount}{" "}
              <Link
                href={labels.loginHref}
                className="font-medium transition-colors"
                style={{ color: "#ff2d78" }}
              >
                {labels.signinLink}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

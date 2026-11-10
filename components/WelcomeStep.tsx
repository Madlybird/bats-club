"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { useSession } from "next-auth/react"
import Image from "next/image"
import BatsOverlay from "@/components/BatsOverlay"
import { trackLogin, trackSignUp } from "@/lib/analytics"

interface WelcomeLabels {
  heading: string
  body: string
  username: string
  usernameHint: string
  suggested: string
  suggestedHint: string
  submit: string
  saving: string
}

export default function WelcomeStep({
  userId,
  username,
  needsUsername,
  profilePrefix,
  src,
  labels,
}: {
  userId: string
  username: string
  needsUsername: boolean
  profilePrefix: string
  src: string
  labels: WelcomeLabels
}) {
  const router = useRouter()
  const { update } = useSession()
  const [value, setValue] = useState("")
  const [suggestion, setSuggestion] = useState(username)
  const [error, setError] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // Fire sign_up / login once per account+session, not on every refresh.
    const key = `batsclub_google_tracked_${userId}`
    let already = false
    try {
      already = !!sessionStorage.getItem(key)
      sessionStorage.setItem(key, "1")
      sessionStorage.removeItem("batsclub_signup_src")
    } catch {
      /* ignore */
    }
    if (!already) {
      if (needsUsername) trackSignUp("google", src)
      else trackLogin("google")
    }
    if (!needsUsername) {
      router.replace(`${profilePrefix}${username}`)
      router.refresh()
    }
  }, [userId, needsUsername, src, profilePrefix, username, router])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setSaving(true)
    try {
      const res = await fetch("/api/auth/username", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: value.trim() }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || "Something went wrong. Please try again.")
        if (data.suggestion) setSuggestion(data.suggestion)
        return
      }
      await update() // re-reads username from the DB, clears the step
      router.replace(`${profilePrefix}${data.username}`)
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setSaving(false)
    }
  }

  if (!needsUsername) return <div className="min-h-screen" />

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4">
      <BatsOverlay />
      <div className="absolute top-1/4 right-1/3 w-[500px] h-[500px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />

      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="Bats Club" width={160} height={48} className="h-16 w-auto mx-auto mb-2" />
        </div>

        <div className="card p-8" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
          <h2 className="text-xl font-bold text-white mb-2">{labels.heading}</h2>
          <p className="text-sm text-white/40 mb-6">{labels.body}</p>

          <form onSubmit={submit} className="space-y-4">
            <div>
              <label className="block text-sm text-white/40 mb-1.5 font-medium">{labels.username}</label>
              <input
                type="text"
                value={value}
                onChange={(e) => setValue(e.target.value)}
                autoFocus
                autoComplete="username"
                maxLength={30}
                className="input"
              />
              <p className="text-xs text-white/30 mt-1.5">{labels.usernameHint}</p>
              <p className="text-sm text-white/50 mt-3">
                {labels.suggested}{" "}
                <button
                  type="button"
                  onClick={() => setValue(suggestion)}
                  className="font-semibold underline-offset-2 hover:underline"
                  style={{ color: "#ff2d78" }}
                >
                  {suggestion}
                </button>
              </p>
              <p className="text-xs text-white/30 mt-1">{labels.suggestedHint}</p>
            </div>

            {error && (
              <div className="bg-red-900/20 border border-red-900/50 rounded-lg px-4 py-3">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 text-base font-bold mt-2 rounded-lg text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: "#ff2d78" }}
            >
              {saving ? labels.saving : labels.submit}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

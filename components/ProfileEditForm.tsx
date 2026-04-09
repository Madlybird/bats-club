"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import BatsOverlay from "@/components/BatsOverlay"

interface Figure {
  id: string
  name: string
  imageUrl: string | null
  series: string
}

interface Props {
  username: string
  currentAvatar: string | null
  currentBio: string
  wishlistFigures: Figure[]
}

export default function ProfileEditForm({ username, currentAvatar, currentBio, wishlistFigures }: Props) {
  const router = useRouter()
  const [avatar, setAvatar] = useState<string | null>(currentAvatar)
  const [bio, setBio] = useState(currentBio)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState("")

  const handleSave = async () => {
    setSaving(true)
    setError("")
    try {
      const res = await fetch("/api/user/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar, bio }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error || "Failed to save"); return }
      setSaved(true)
      setTimeout(() => {
        router.push(`/profile/${username}`)
        router.refresh()
      }, 800)
    } catch {
      setError("Something went wrong.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="relative min-h-screen">
      <BatsOverlay />
      <div className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />
      <div className="absolute inset-0 opacity-[0.025] pointer-events-none" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

      <div className="relative max-w-2xl mx-auto px-4 sm:px-6 py-12">
        {/* Header */}
        <div className="flex items-center gap-4 mb-10">
          <Link href={`/profile/${username}`} className="text-white/30 hover:text-white/60 transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </Link>
          <div>
            <span className="inline-block w-8 h-px bg-[#ff2d78] mb-1" />
            <h1 className="text-2xl font-black text-white">Edit Profile</h1>
          </div>
        </div>

        <div className="space-y-8">
          {/* Avatar preview */}
          <div className="flex items-center gap-5">
            <div className="relative flex-shrink-0">
              {avatar ? (
                <Image
                  src={avatar}
                  alt="Avatar"
                  width={80}
                  height={80}
                  className="rounded-full border-2 border-[#ff2d78]/60 object-cover"
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-3xl font-black text-white border-2 border-[#ff2d78]/60"
                  style={{ background: "#0a0a0a" }}
                >
                  {username.charAt(0).toUpperCase()}
                </div>
              )}
            </div>
            <div>
              <p className="text-sm font-medium text-white/60">@{username}</p>
              {avatar && (
                <button
                  onClick={() => setAvatar(null)}
                  className="text-xs text-white/25 hover:text-white/50 transition-colors mt-1"
                >
                  Remove avatar
                </button>
              )}
            </div>
          </div>

          {/* Avatar selector — wishlist figures */}
          {wishlistFigures.length > 0 ? (
            <div>
              <p className="text-sm font-medium text-white/40 uppercase tracking-wider mb-3">
                Choose avatar from wishlist
              </p>
              <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-2">
                {wishlistFigures.map((fig) => {
                  const isSelected = avatar === fig.imageUrl
                  return (
                    <button
                      key={fig.id}
                      onClick={() => setAvatar(fig.imageUrl)}
                      title={fig.name}
                      className="relative aspect-square rounded-lg overflow-hidden border-2 transition-all duration-150"
                      style={{
                        borderColor: isSelected ? "#ff2d78" : "rgba(255,255,255,0.06)",
                        background: "#0a0a0a",
                        boxShadow: isSelected ? "0 0 12px rgba(255,45,120,0.4)" : "none",
                      }}
                    >
                      {fig.imageUrl ? (
                        <Image
                          src={fig.imageUrl}
                          alt={fig.name}
                          fill
                          className="object-cover object-top"
                          sizes="80px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center text-white/20 text-lg">🦇</div>
                      )}
                      {isSelected && (
                        <div className="absolute inset-0 flex items-center justify-center" style={{ background: "rgba(255,45,120,0.2)" }}>
                          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-white/[0.06] p-5 text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
              <p className="text-white/30 text-sm">Add figures to your wishlist to use them as an avatar.</p>
              <Link href="/archive" className="text-sm font-medium mt-2 inline-block" style={{ color: "#ff2d78" }}>
                Browse archive →
              </Link>
            </div>
          )}

          {/* Bio */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-white/40 uppercase tracking-wider">Bio</label>
              <span className={`text-xs ${bio.length >= 120 ? "text-[#ff2d78]" : "text-white/20"}`}>
                {bio.length}/120
              </span>
            </div>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 120))}
              placeholder="Tell collectors about yourself..."
              rows={3}
              className="input resize-none"
              style={{ lineHeight: "1.6" }}
            />
          </div>

          {error && (
            <div className="bg-red-900/20 border border-red-900/50 rounded-lg px-4 py-3">
              <p className="text-red-400 text-sm">{error}</p>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving || saved}
              className="flex-1 py-3 font-bold rounded-lg text-white transition-opacity disabled:opacity-50"
              style={{ backgroundColor: "#ff2d78" }}
            >
              {saved ? "Saved ✓" : saving ? "Saving..." : "Save Changes"}
            </button>
            <Link
              href={`/profile/${username}`}
              className="px-6 py-3 rounded-lg font-bold text-white/50 hover:text-white transition-colors border border-white/[0.08] hover:border-white/20"
            >
              Cancel
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

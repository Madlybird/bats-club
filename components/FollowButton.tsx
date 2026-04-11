"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

interface Props {
  /** The user being followed. */
  targetUserId: string
  /** Initial state fetched server-side. */
  initiallyFollowing: boolean
  /** Whether the viewer is authenticated. Unauthenticated viewers are
   *  redirected to the sign-in page on click. */
  isAuthenticated: boolean
  /** Locale-specific labels. */
  labels: { follow: string; unfollow: string }
  /** Sign-in href for the current locale. */
  loginHref: string
}

export default function FollowButton({
  targetUserId,
  initiallyFollowing,
  isAuthenticated,
  labels,
  loginHref,
}: Props) {
  const router = useRouter()
  const [isFollowing, setIsFollowing] = useState(initiallyFollowing)
  const [pending, startTransition] = useTransition()
  const [loading, setLoading] = useState(false)

  const handleClick = async () => {
    if (!isAuthenticated) {
      router.push(loginHref)
      return
    }
    if (loading) return
    setLoading(true)
    const nextState = !isFollowing
    // Optimistic update; revert on failure.
    setIsFollowing(nextState)
    try {
      const res = await fetch("/api/follow", {
        method: nextState ? "POST" : "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: targetUserId }),
      })
      if (!res.ok) {
        setIsFollowing(!nextState)
      } else {
        // Re-fetch the server component so the counts and the two
        // tab lists reflect the new state on the next render.
        startTransition(() => router.refresh())
      }
    } catch {
      setIsFollowing(!nextState)
    } finally {
      setLoading(false)
    }
  }

  const disabled = loading || pending
  const base =
    "text-xs font-bold px-5 py-2 rounded-full transition-all disabled:opacity-60 disabled:cursor-not-allowed"
  const style = isFollowing
    ? `${base} border border-white/20 text-white/80 hover:border-red-500/50 hover:text-red-400`
    : `${base} text-white`

  return (
    <button
      onClick={handleClick}
      disabled={disabled}
      className={style}
      style={isFollowing ? undefined : { background: "#ff2d78", boxShadow: "0 0 20px rgba(255,45,120,0.25)" }}
    >
      {isFollowing ? labels.unfollow : labels.follow}
    </button>
  )
}

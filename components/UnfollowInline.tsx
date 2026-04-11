"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"

/**
 * Inline unfollow button used next to each entry in the "Following"
 * tab on the viewer's own profile. On success, refreshes the server
 * component so the list and counts update.
 */
export default function UnfollowInline({
  targetUserId,
  label,
}: {
  targetUserId: string
  label: string
}) {
  const router = useRouter()
  const [gone, setGone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [, startTransition] = useTransition()

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (loading || gone) return
    setLoading(true)
    try {
      const res = await fetch("/api/follow", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followingId: targetUserId }),
      })
      if (res.ok) {
        setGone(true)
        startTransition(() => router.refresh())
      }
    } finally {
      setLoading(false)
    }
  }

  if (gone) return null

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="text-[11px] font-medium px-3 py-1.5 rounded-full border border-white/[0.12] text-white/50 hover:text-red-400 hover:border-red-500/40 transition-colors disabled:opacity-50"
    >
      {label}
    </button>
  )
}

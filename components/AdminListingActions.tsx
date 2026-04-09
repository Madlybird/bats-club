"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface AdminListingActionsProps {
  listingId: string
  isActive: boolean
}

export default function AdminListingActions({ listingId, isActive }: AdminListingActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const toggleActive = async () => {
    setLoading(true)
    try {
      await fetch(`/api/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ active: !isActive }),
      })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  const deleteListing = async () => {
    if (!confirm("Delete this listing? This cannot be undone.")) return
    setLoading(true)
    try {
      await fetch(`/api/listings/${listingId}`, { method: "DELETE" })
      router.refresh()
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={toggleActive}
        disabled={loading}
        className={`text-xs px-2 py-1 rounded-md border transition-all ${
          isActive
            ? "text-yellow-400 border-yellow-900/50 hover:bg-yellow-900/20"
            : "text-emerald-400 border-emerald-900/50 hover:bg-emerald-900/20"
        }`}
      >
        {isActive ? "Deactivate" : "Activate"}
      </button>
      <Link
        href={`/admin/listings/${listingId}/edit`}
        className="text-xs px-2 py-1 rounded-md border border-[#1a1a3a] text-slate-400 hover:text-violet-400 hover:border-violet-700/50 transition-all"
      >
        Edit
      </Link>
      <button
        onClick={deleteListing}
        disabled={loading}
        className="text-xs px-2 py-1 rounded-md border border-red-900/30 text-red-400 hover:bg-red-900/20 transition-all"
      >
        Delete
      </button>
    </div>
  )
}

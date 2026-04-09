"use client"

import { useSession } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface StatusLabels {
  have: string
  wishlist: string
  buy: string
}

interface StatusButtonProps {
  figureId: string
  initialStatus?: string | null
  labels?: StatusLabels
}

const DEFAULT_LABELS: StatusLabels = {
  have: "Have It",
  wishlist: "Wishlist",
  buy: "Want to Buy",
}

export default function StatusButton({ figureId, initialStatus, labels = DEFAULT_LABELS }: StatusButtonProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [currentStatus, setCurrentStatus] = useState<string | null>(initialStatus || null)
  const [loading, setLoading] = useState(false)

  const statuses = [
    { value: "HAVE",     label: labels.have,     icon: "✓",  activeClass: "bg-emerald-700 border-emerald-600 text-white" },
    { value: "WISHLIST", label: labels.wishlist,  icon: "❤️", activeClass: "bg-pink-700 border-pink-600 text-white" },
    { value: "BUY",      label: labels.buy,       icon: "🛒", activeClass: "bg-violet-700 border-violet-600 text-white" },
  ]

  const handleStatus = async (status: string) => {
    if (!session) {
      router.push("/login")
      return
    }

    setLoading(true)
    try {
      if (currentStatus === status) {
        const res = await fetch("/api/user-figures", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ figureId }),
        })
        if (res.ok) setCurrentStatus(null)
      } else {
        const res = await fetch("/api/user-figures", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ figureId, status }),
        })
        if (res.ok) setCurrentStatus(status)
      }
    } catch (error) {
      console.error("Failed to update status:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex gap-1.5 flex-wrap">
      {statuses.map((s) => {
        const isActive = currentStatus === s.value
        return (
          <button
            key={s.value}
            onClick={() => handleStatus(s.value)}
            disabled={loading}
            className={`
              flex items-center gap-1.5 text-xs px-2.5 py-1.5 rounded-lg border font-medium transition-all duration-200
              ${isActive
                ? s.activeClass
                : "bg-[#0a0a12] border-[#1a1a3a] text-slate-400 hover:border-violet-700/50 hover:text-slate-200"
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            <span>{s.icon}</span>
            <span>{s.label}</span>
          </button>
        )
      })}
    </div>
  )
}

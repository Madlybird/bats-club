"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Row {
  id: string
  slug: string
  nameEn: string
  active: boolean
  position: number
  figureCount: number
}

export default function AdminCollectionsTable({
  collections,
}: {
  collections: Row[]
}) {
  const router = useRouter()
  const [busy, setBusy] = useState<string | null>(null)
  const [error, setError] = useState("")

  const call = async (id: string, body: any, method = "PUT") => {
    setBusy(id)
    setError("")
    try {
      const res = await fetch(`/api/collections/${id}`, {
        method,
        headers: { "Content-Type": "application/json" },
        body: method === "DELETE" ? undefined : JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json().catch(() => ({}))
        setError(d.error || `Request failed (${res.status})`)
      } else {
        router.refresh()
      }
    } finally {
      setBusy(null)
    }
  }

  const toggleActive = (r: Row) => call(r.id, { active: !r.active })

  const remove = (r: Row) => {
    if (!confirm(`Delete collection "${r.nameEn}"? This cannot be undone.`)) return
    call(r.id, null, "DELETE")
  }

  // Swap position with the adjacent collection.
  const move = async (idx: number, dir: -1 | 1) => {
    const a = collections[idx]
    const b = collections[idx + dir]
    if (!a || !b) return
    setBusy(a.id)
    setError("")
    try {
      await fetch(`/api/collections/${a.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: b.position }),
      })
      await fetch(`/api/collections/${b.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position: a.position }),
      })
      router.refresh()
    } finally {
      setBusy(null)
    }
  }

  if (!collections.length) {
    return (
      <div className="card p-10 text-center text-slate-500 text-sm">
        No collections yet. Create one to show a curated slider on the homepage.
      </div>
    )
  }

  return (
    <div className="card overflow-hidden">
      {error && (
        <div className="bg-red-900/30 border-b border-red-700/50 text-red-300 px-5 py-3 text-sm">
          {error}
        </div>
      )}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-[#1a1a3a]">
              <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Order</th>
              <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Name (EN)</th>
              <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Figures</th>
              <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Status</th>
              <th className="text-right px-5 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#1a1a3a]">
            {collections.map((c, idx) => (
              <tr key={c.id} className="hover:bg-[#0a0a12] transition-colors">
                <td className="px-5 py-3">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => move(idx, -1)}
                      disabled={idx === 0 || busy === c.id}
                      className="px-1.5 text-slate-500 hover:text-violet-400 disabled:opacity-20"
                      aria-label="move up"
                    >
                      ▲
                    </button>
                    <button
                      onClick={() => move(idx, 1)}
                      disabled={idx === collections.length - 1 || busy === c.id}
                      className="px-1.5 text-slate-500 hover:text-violet-400 disabled:opacity-20"
                      aria-label="move down"
                    >
                      ▼
                    </button>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <p className="text-slate-200 font-medium truncate max-w-[260px]">{c.nameEn}</p>
                  <p className="text-xs text-slate-500 font-mono">{c.slug}</p>
                </td>
                <td className="px-5 py-3 text-slate-500">{c.figureCount}</td>
                <td className="px-5 py-3">
                  <button
                    onClick={() => toggleActive(c)}
                    disabled={busy === c.id}
                    className={`badge ${c.active ? "badge-green" : "badge-yellow"} disabled:opacity-50`}
                  >
                    {c.active ? "Active" : "Hidden"}
                  </button>
                </td>
                <td className="px-5 py-3 text-right whitespace-nowrap">
                  <Link
                    href={`/admin/collections/${c.id}/edit`}
                    className="text-violet-400 hover:text-violet-300 text-sm mr-4"
                  >
                    Edit
                  </Link>
                  <button
                    onClick={() => remove(c)}
                    disabled={busy === c.id}
                    className="text-red-400 hover:text-red-300 text-sm disabled:opacity-50"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface AdminArticleActionsProps {
  articleId: string
  isPublished: boolean
}

export default function AdminArticleActions({ articleId, isPublished }: AdminArticleActionsProps) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const togglePublish = async () => {
    setLoading(true)
    await fetch(`/api/articles/${articleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ published: !isPublished }),
    })
    router.refresh()
    setLoading(false)
  }

  const handleDelete = async () => {
    if (!confirm("Delete this article? This cannot be undone.")) return
    setLoading(true)
    await fetch(`/api/articles/${articleId}`, { method: "DELETE" })
    router.refresh()
    setLoading(false)
  }

  return (
    <div className="flex items-center justify-end gap-2">
      <button
        onClick={togglePublish}
        disabled={loading}
        className={`text-xs px-2.5 py-1 rounded-lg border transition-colors disabled:opacity-50 ${
          isPublished
            ? "border-yellow-700/50 text-yellow-400 hover:bg-yellow-900/20"
            : "border-green-700/50 text-green-400 hover:bg-green-900/20"
        }`}
      >
        {isPublished ? "Unpublish" : "Publish"}
      </button>
      <Link
        href={`/admin/articles/${articleId}/edit`}
        className="text-xs px-2.5 py-1 rounded-lg border border-[#1a1a3a] text-slate-400 hover:text-slate-200 hover:border-violet-700/50 transition-colors"
      >
        Edit
      </Link>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="text-xs px-2.5 py-1 rounded-lg border border-[#1a1a3a] text-red-400 hover:bg-red-900/20 hover:border-red-700/50 transition-colors disabled:opacity-50"
      >
        Delete
      </button>
    </div>
  )
}

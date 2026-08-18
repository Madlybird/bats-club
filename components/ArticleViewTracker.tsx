"use client"

import { useEffect } from "react"

export default function ArticleViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    fetch("/api/article-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ articleId }),
    }).catch(() => {}) // fire-and-forget, never block page render
  }, [articleId])

  return null
}

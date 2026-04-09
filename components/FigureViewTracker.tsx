"use client"

import { useEffect } from "react"

export default function FigureViewTracker({ series }: { series: string }) {
  useEffect(() => {
    fetch("/api/series-views", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ series }),
    }).catch(() => {}) // fire-and-forget, never block page render
  }, [series])

  return null
}

"use client"

import { useEffect, useRef, useState } from "react"

// Renders a long grid in chunks: the first `step` items up front, the next
// chunk whenever the sentinel under the grid gets near the viewport.
// /shop and /archive render 400-570 cards; mounting them all at once put
// 5-14k nodes in the DOM (Lighthouse TBT 1.8-3.8s on mobile). Search and
// filters still run over the full array — only rendering is chunked.
// Every item stays reachable for crawlers via its own page + sitemap.xml.
export function useIncrementalList<T>(items: T[], step = 48) {
  const [count, setCount] = useState(step)
  const [prevItems, setPrevItems] = useState(items)
  // New filter/search result → start again from the first chunk.
  if (items !== prevItems) {
    setPrevItems(items)
    setCount(step)
  }

  const sentinelRef = useRef<HTMLDivElement>(null)
  const hasMore = count < items.length

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) setCount((c) => c + step)
      },
      { rootMargin: "1200px 0px" },
    )
    io.observe(el)
    return () => io.disconnect()
    // count: re-observe after each chunk so a sentinel that is still in
    // range (tall screens) keeps loading.
  }, [hasMore, step, count])

  return {
    visible: hasMore ? items.slice(0, count) : items,
    hasMore,
    sentinelRef,
  }
}

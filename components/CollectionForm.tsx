"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Figure {
  id: string
  name: string
  series: string
  imageUrl?: string | null
}

export default function CollectionForm({
  collectionId,
}: {
  collectionId?: string
}) {
  const router = useRouter()
  const editing = !!collectionId

  const [allFigures, setAllFigures] = useState<Figure[]>([])
  const [nameEn, setNameEn] = useState("")
  const [nameRu, setNameRu] = useState("")
  const [nameJp, setNameJp] = useState("")
  const [slug, setSlug] = useState("")
  const [coverUrl, setCoverUrl] = useState("")
  const [active, setActive] = useState(true)
  const [selected, setSelected] = useState<string[]>([]) // ordered figure ids
  const [search, setSearch] = useState("")

  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState("")
  const [ready, setReady] = useState(!editing)

  useEffect(() => {
    fetch("/api/figures")
      .then((r) => r.json())
      .then((d) => setAllFigures(Array.isArray(d) ? d : []))
      .catch(console.error)
  }, [])

  useEffect(() => {
    if (!collectionId) return
    fetch(`/api/collections/${collectionId}`)
      .then((r) => r.json())
      .then((d) => {
        if (d?.error) {
          setError(d.error)
          return
        }
        setNameEn(d.nameEn || "")
        setNameRu(d.nameRu || "")
        setNameJp(d.nameJp || "")
        setSlug(d.slug || "")
        setCoverUrl(d.coverUrl || "")
        setActive(!!d.active)
        setSelected((d.figures || []).map((f: Figure) => f.id))
      })
      .catch((e) => setError(String(e)))
      .finally(() => setReady(true))
  }, [collectionId])

  const figureById = useMemo(() => {
    const m = new Map<string, Figure>()
    allFigures.forEach((f) => m.set(f.id, f))
    return m
  }, [allFigures])

  const searchResults = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return [] as Figure[]
    return allFigures
      .filter(
        (f) =>
          !selected.includes(f.id) &&
          (f.name.toLowerCase().includes(q) ||
            f.series?.toLowerCase().includes(q))
      )
      .slice(0, 30)
  }, [search, allFigures, selected])

  const add = (id: string) => setSelected((p) => [...p, id])
  const remove = (id: string) =>
    setSelected((p) => p.filter((x) => x !== id))
  const move = (idx: number, dir: -1 | 1) =>
    setSelected((p) => {
      const next = [...p]
      const j = idx + dir
      if (j < 0 || j >= next.length) return p
      ;[next[idx], next[j]] = [next[j], next[idx]]
      return next
    })

  const handleCoverUpload = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) setError(`Upload failed: ${data.error || res.statusText}`)
      else if (data.url) setCoverUrl(data.url)
    } finally {
      setUploading(false)
    }
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!nameEn.trim()) {
      setError("English name is required")
      return
    }
    setLoading(true)
    setError("")
    const payload = {
      nameEn: nameEn.trim(),
      nameRu: nameRu.trim(),
      nameJp: nameJp.trim(),
      slug: slug.trim(),
      coverUrl,
      active,
      figureIds: selected,
    }
    const res = await fetch(
      editing ? `/api/collections/${collectionId}` : "/api/collections",
      {
        method: editing ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      }
    )
    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      setError(
        [data.error || "Failed", data.stage && `stage: ${data.stage}`]
          .filter(Boolean)
          .join(" · ")
      )
      setLoading(false)
      return
    }
    router.push("/admin/collections")
    router.refresh()
  }

  const inputCls =
    "w-full bg-[#0a0a12] border border-[#1a1a3a] text-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-violet-600 transition-colors placeholder-slate-600"
  const labelCls = "block text-sm font-medium text-slate-400 mb-1.5"

  if (!ready) {
    return <p className="text-slate-500 text-sm">Loading collection…</p>
  }

  return (
    <form onSubmit={submit} className="space-y-6 max-w-3xl">
      {error && (
        <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <label className={labelCls}>Name · English *</label>
          <input
            value={nameEn}
            onChange={(e) => setNameEn(e.target.value)}
            className={inputCls}
            placeholder="Di Gi Charat"
            required
          />
        </div>
        <div>
          <label className={labelCls}>Name · Русский</label>
          <input
            value={nameRu}
            onChange={(e) => setNameRu(e.target.value)}
            className={inputCls}
            placeholder="Ди Ги Чарат"
          />
        </div>
        <div>
          <label className={labelCls}>Name · 日本語</label>
          <input
            value={nameJp}
            onChange={(e) => setNameJp(e.target.value)}
            className={inputCls}
            placeholder="デ・ジ・キャラット"
          />
        </div>
      </div>

      <div>
        <label className={labelCls}>Slug</label>
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          className={inputCls}
          placeholder="auto-generated from English name"
        />
      </div>

      <div>
        <label className={labelCls}>Cover image (optional)</label>
        <div className="flex items-center gap-4">
          <label className="cursor-pointer bg-[#0a0a12] border border-[#1a1a3a] hover:border-violet-600 text-slate-400 hover:text-slate-200 px-4 py-2.5 rounded-lg transition-colors text-sm">
            {uploading ? "Uploading..." : "Upload"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCoverUpload}
              disabled={uploading}
            />
          </label>
          {coverUrl && (
            <div className="flex items-center gap-2">
              <img
                src={coverUrl}
                alt="cover"
                className="h-10 w-16 object-cover rounded"
              />
              <button
                type="button"
                onClick={() => setCoverUrl("")}
                className="text-red-400 hover:text-red-300 text-sm"
              >
                Remove
              </button>
            </div>
          )}
        </div>
      </div>

      <div>
        <label className={labelCls}>
          Figures in this collection ({selected.length})
        </label>
        <div className="space-y-2 mb-3">
          {selected.map((id, idx) => {
            const f = figureById.get(id)
            return (
              <div
                key={id}
                className="flex items-center gap-3 bg-[#0a0a12] border border-[#1a1a3a] rounded-lg px-3 py-2"
              >
                <span className="text-xs text-slate-600 w-6">{idx + 1}</span>
                {f?.imageUrl && (
                  <img
                    src={f.imageUrl}
                    alt=""
                    className="h-9 w-9 object-cover rounded"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200 truncate">
                    {f?.name || id}
                  </p>
                  <p className="text-xs text-slate-500 truncate">
                    {f?.series}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => move(idx, -1)}
                  disabled={idx === 0}
                  className="text-slate-500 hover:text-violet-400 disabled:opacity-20 px-1"
                >
                  ▲
                </button>
                <button
                  type="button"
                  onClick={() => move(idx, 1)}
                  disabled={idx === selected.length - 1}
                  className="text-slate-500 hover:text-violet-400 disabled:opacity-20 px-1"
                >
                  ▼
                </button>
                <button
                  type="button"
                  onClick={() => remove(id)}
                  className="text-red-400 hover:text-red-300 text-sm px-1"
                >
                  ✕
                </button>
              </div>
            )
          })}
          {selected.length === 0 && (
            <p className="text-slate-600 text-sm">
              No figures yet — search below to add.
            </p>
          )}
        </div>

        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className={inputCls}
          placeholder="Search archive by name or series…"
        />
        {searchResults.length > 0 && (
          <div className="mt-2 bg-[#0a0a12] border border-[#1a1a3a] rounded-lg max-h-60 overflow-y-auto divide-y divide-[#1a1a3a]">
            {searchResults.map((f) => (
              <button
                type="button"
                key={f.id}
                onClick={() => add(f.id)}
                className="w-full flex items-center gap-3 px-3 py-2 hover:bg-white/5 text-left"
              >
                {f.imageUrl && (
                  <img
                    src={f.imageUrl}
                    alt=""
                    className="h-9 w-9 object-cover rounded"
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm text-slate-200 truncate">{f.name}</p>
                  <p className="text-xs text-slate-500 truncate">{f.series}</p>
                </div>
                <span className="text-violet-400 text-sm">+ add</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-3 p-4 bg-[#0a0a12] border border-[#1a1a3a] rounded-lg">
        <input
          type="checkbox"
          id="active"
          checked={active}
          onChange={(e) => setActive(e.target.checked)}
          className="accent-violet-600 w-4 h-4"
        />
        <label htmlFor="active" className="text-slate-300 cursor-pointer">
          <span className="font-medium">Active</span>
          <span className="text-slate-500 text-sm ml-2">
            — show this collection slider on the homepage
          </span>
        </label>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={loading}
          className="bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          {loading
            ? "Saving..."
            : editing
            ? "Save changes"
            : "Create collection"}
        </button>
        <Link
          href="/admin/collections"
          className="bg-[#0a0a12] hover:bg-white/5 border border-[#1a1a3a] text-slate-300 px-6 py-2.5 rounded-lg transition-colors"
        >
          Cancel
        </Link>
      </div>
    </form>
  )
}

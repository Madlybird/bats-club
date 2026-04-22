"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"

interface Figure {
  id: string
  name: string
  series: string
}

export default function NewArticlePage() {
  const router = useRouter()
  const [figures, setFigures] = useState<Figure[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [title, setTitle] = useState("")
  const [slug, setSlug] = useState("")
  const [body, setBody] = useState("")
  const [excerpt, setExcerpt] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [selectedFigures, setSelectedFigures] = useState<string[]>([])
  const [published, setPublished] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [lastResponse, setLastResponse] = useState<{ status: number; data: any } | null>(null)

  useEffect(() => {
    fetch("/api/figures")
      .then((r) => r.json())
      .then(setFigures)
      .catch(console.error)
  }, [])

  // Auto-generate slug from title
  useEffect(() => {
    if (title && !slug) {
      setSlug(title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""))
    }
  }, [title])

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    setError("")
    try {
      const fd = new FormData()
      fd.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: fd })
      const data = await res.json()
      if (!res.ok) {
        setError(`Upload failed: ${data.error || res.statusText}${data.stage ? ` (stage: ${data.stage})` : ""}`)
      } else if (data.url) {
        setCoverImage(data.url)
      }
    } finally {
      setUploading(false)
    }
  }

  const toggleFigure = (id: string) => {
    setSelectedFigures((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    )
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!title || !body) { setError("Title and body are required"); return }

    setLoading(true)
    setError("")
    setLastResponse(null)

    const res = await fetch("/api/articles", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, slug, body, excerpt, coverImage, figureIds: selectedFigures, published }),
    })

    const data = await res.json()
    setLastResponse({ status: res.status, data })
    if (!res.ok) {
      const bits = [data.error || "Failed to create article"]
      if (data.stage) bits.push(`stage: ${data.stage}`)
      if (data.code) bits.push(`code: ${data.code}`)
      if (data.details) bits.push(`details: ${data.details}`)
      if (data.hint) bits.push(`hint: ${data.hint}`)
      setError(bits.join(" · "))
      setLoading(false)
    } else {
      setLoading(false)
      router.push("/admin/articles")
    }
  }

  const inputCls = "w-full bg-[#0a0a12] border border-[#1a1a3a] text-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-violet-600 transition-colors placeholder-slate-600"
  const labelCls = "block text-sm font-medium text-slate-400 mb-1.5"

  return (
    <div className="max-w-4xl mx-auto">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/articles" className="text-slate-400 hover:text-slate-200 transition-colors">
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-white">New Article</h1>
      </div>

      <div className="mb-4 rounded-lg border border-violet-700/30 bg-violet-900/10 p-3 text-xs text-slate-400">
        Having trouble? Visit{" "}
        <a href="/admin/diag" className="text-violet-400 underline">/admin/diag</a>{" "}
        to run a test insert against the live DB and see the exact failure.
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/30 border border-red-700/50 text-red-300 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {lastResponse && !lastResponse.data?.id && (
          <div className="rounded-lg border border-[#1a1a3a] bg-[#0a0a12] p-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">
              Last API response · HTTP {lastResponse.status}
            </p>
            <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(lastResponse.data, null, 2)}
            </pre>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className={labelCls}>Title *</label>
            <input value={title} onChange={(e) => setTitle(e.target.value)} className={inputCls} placeholder="Collector Spotlight: ..." required />
          </div>

          <div>
            <label className={labelCls}>Slug</label>
            <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} placeholder="auto-generated-from-title" />
            <p className="text-xs text-slate-500 mt-1">Leave blank to auto-generate from title</p>
          </div>

          <div>
            <label className={labelCls}>Excerpt</label>
            <input value={excerpt} onChange={(e) => setExcerpt(e.target.value)} className={inputCls} placeholder="Short description for listings..." />
          </div>
        </div>

        <div>
          <label className={labelCls}>Body *</label>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            className={`${inputCls} min-h-[300px] resize-y font-mono text-sm`}
            placeholder="Write your article content here..."
            required
          />
        </div>

        <div>
          <label className={labelCls}>Cover Image</label>
          <div className="flex items-center gap-4">
            <label className="cursor-pointer bg-[#0a0a12] border border-[#1a1a3a] hover:border-violet-600 text-slate-400 hover:text-slate-200 px-4 py-2.5 rounded-lg transition-colors text-sm">
              {uploading ? "Uploading..." : "Upload Image"}
              <input type="file" accept="image/*" className="hidden" onChange={handleCoverUpload} disabled={uploading} />
            </label>
            {coverImage && (
              <div className="flex items-center gap-2">
                <img src={coverImage} alt="Cover" className="h-10 w-16 object-cover rounded" />
                <button type="button" onClick={() => setCoverImage("")} className="text-red-400 hover:text-red-300 text-sm">Remove</button>
              </div>
            )}
            {!coverImage && (
              <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)} className={`${inputCls} flex-1`} placeholder="Or enter image URL..." />
            )}
          </div>
        </div>

        <div>
          <label className={labelCls}>Linked Figures</label>
          <div className="bg-[#0a0a12] border border-[#1a1a3a] rounded-lg p-3 max-h-48 overflow-y-auto">
            {figures.length === 0 ? (
              <p className="text-slate-500 text-sm">Loading figures...</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {figures.map((f) => (
                  <label key={f.id} className="flex items-center gap-2 cursor-pointer hover:bg-white/5 px-2 py-1.5 rounded-lg">
                    <input
                      type="checkbox"
                      checked={selectedFigures.includes(f.id)}
                      onChange={() => toggleFigure(f.id)}
                      className="accent-violet-600"
                    />
                    <span className="text-sm text-slate-300">{f.name}</span>
                    <span className="text-xs text-slate-500 truncate">{f.series}</span>
                  </label>
                ))}
              </div>
            )}
          </div>
          {selectedFigures.length > 0 && (
            <p className="text-xs text-violet-400 mt-1">{selectedFigures.length} figure(s) linked</p>
          )}
        </div>

        <div className="flex items-center gap-3 p-4 bg-[#0a0a12] border border-[#1a1a3a] rounded-lg">
          <input
            type="checkbox"
            id="published"
            checked={published}
            onChange={(e) => setPublished(e.target.checked)}
            className="accent-violet-600 w-4 h-4"
          />
          <label htmlFor="published" className="text-slate-300 cursor-pointer">
            <span className="font-medium">Publish immediately</span>
            <span className="text-slate-500 text-sm ml-2">— uncheck to save as draft</span>
          </label>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors">
            {loading ? "Creating..." : "Create Article"}
          </button>
          <Link href="/admin/articles" className="bg-[#0a0a12] hover:bg-white/5 border border-[#1a1a3a] text-slate-300 px-6 py-2.5 rounded-lg transition-colors">
            Cancel
          </Link>
        </div>
      </form>
    </div>
  )
}

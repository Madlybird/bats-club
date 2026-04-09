"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"

interface Figure {
  id: string
  name: string
  series: string
  scale: string
}

const CONDITIONS = ["Mint", "Near Mint", "Good", "Fair", "Poor"]

export default function EditListingPage() {
  const router = useRouter()
  const params = useParams()
  const listingId = params.id as string

  const [figures, setFigures] = useState<Figure[]>([])
  const [loading, setLoading] = useState(false)
  const [initialLoading, setInitialLoading] = useState(true)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    figureId: "",
    price: "",
    condition: "Mint",
    stock: "1",
    description: "",
    active: true,
  })
  const [photos, setPhotos] = useState<File[]>([])
  const [existingPhotos, setExistingPhotos] = useState<string[]>([])

  useEffect(() => {
    Promise.all([
      fetch("/api/figures").then((r) => r.json()),
      fetch(`/api/listings/${listingId}`).then((r) => r.json()),
    ])
      .then(([figureData, listingData]) => {
        setFigures(figureData)
        if (listingData) {
          setFormData({
            figureId: listingData.figureId,
            price: (listingData.price / 100).toFixed(2),
            condition: listingData.condition,
            stock: listingData.stock.toString(),
            description: listingData.description || "",
            active: listingData.active,
          })
          try {
            setExistingPhotos(JSON.parse(listingData.photos || "[]"))
          } catch {
            setExistingPhotos([])
          }
        }
      })
      .catch(() => setError("Failed to load data"))
      .finally(() => setInitialLoading(false))
  }, [listingId])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const value = e.target.type === "checkbox"
      ? (e.target as HTMLInputElement).checked
      : e.target.value
    setFormData((prev) => ({ ...prev, [e.target.name]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const photoUrls = [...existingPhotos]
      for (const photo of photos) {
        const fd = new FormData()
        fd.append("file", photo)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        if (res.ok) {
          const { url } = await res.json()
          photoUrls.push(url)
        }
      }

      const res = await fetch(`/api/listings/${listingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          price: Math.round(parseFloat(formData.price) * 100),
          stock: parseInt(formData.stock),
          photos: JSON.stringify(photoUrls),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error || "Update failed")
        return
      }

      router.push("/admin/listings")
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  if (initialLoading) {
    return (
      <div className="p-8 flex items-center justify-center text-slate-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <button onClick={() => router.back()} className="text-slate-500 hover:text-violet-400 transition-colors">
          ← Back
        </button>
        <h1 className="text-2xl font-black text-slate-100">Edit Listing</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Figure selector */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5 font-medium">Figure</label>
          <select name="figureId" value={formData.figureId} onChange={handleChange} className="input">
            <option value="">Select a figure...</option>
            {figures.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {f.series} ({f.scale})
              </option>
            ))}
          </select>
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5 font-medium">Price (USD)</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              step="0.01"
              min="0.01"
              className="input pl-7"
            />
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5 font-medium">Condition</label>
          <select name="condition" value={formData.condition} onChange={handleChange} className="input">
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5 font-medium">Stock</label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="0"
            className="input w-32"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5 font-medium">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="input resize-none text-sm"
          />
        </div>

        {/* Active toggle */}
        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            name="active"
            id="active"
            checked={formData.active}
            onChange={handleChange}
            className="w-4 h-4 accent-violet-600"
          />
          <label htmlFor="active" className="text-sm text-slate-400 font-medium">Active (visible in shop)</label>
        </div>

        {/* Existing photos */}
        {existingPhotos.length > 0 && (
          <div>
            <p className="text-sm text-slate-400 mb-2 font-medium">Current Photos ({existingPhotos.length})</p>
            <div className="flex gap-2 flex-wrap">
              {existingPhotos.map((url, i) => (
                <div key={i} className="flex items-center gap-1">
                  <span className="text-xs text-slate-500 truncate max-w-[200px]">{url.split("/").pop()}</span>
                  <button
                    type="button"
                    onClick={() => setExistingPhotos((p) => p.filter((_, idx) => idx !== i))}
                    className="text-red-400 hover:text-red-300 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* New photos */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5 font-medium">Add Photos</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => setPhotos(e.target.files ? Array.from(e.target.files) : [])}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-violet-900/30 file:text-violet-300 hover:file:bg-violet-900/50"
          />
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-900/50 rounded-lg px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Saving..." : "Save Changes"}
          </button>
          <button type="button" onClick={() => router.back()} className="btn-ghost">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

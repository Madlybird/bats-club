"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

interface Figure {
  id: string
  name: string
  series: string
  character: string
  manufacturer: string
  scale: string
}

const CONDITIONS = ["Mint", "Near Mint", "Good", "Fair", "Poor"]

export default function NewListingPage() {
  const router = useRouter()
  const [figures, setFigures] = useState<Figure[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const [formData, setFormData] = useState({
    figureId: "",
    price: "",
    condition: "Mint",
    stock: "1",
    description: "",
  })
  const [photos, setPhotos] = useState<File[]>([])

  useEffect(() => {
    fetch("/api/figures")
      .then((r) => r.json())
      .then((data) => setFigures(data))
      .catch(() => setError("Failed to load figures"))
  }, [])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setPhotos(Array.from(e.target.files))
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      // Upload photos first
      const photoUrls: string[] = []
      for (const photo of photos) {
        const fd = new FormData()
        fd.append("file", photo)
        const res = await fetch("/api/upload", { method: "POST", body: fd })
        if (res.ok) {
          const { url } = await res.json()
          photoUrls.push(url)
        }
      }

      const res = await fetch("/api/listings", {
        method: "POST",
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
        setError(data.error || "Failed to create listing")
        return
      }

      router.push("/admin/listings")
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  const selectedFigure = figures.find((f) => f.id === formData.figureId)

  return (
    <div className="p-8 max-w-2xl">
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => router.back()}
          className="text-slate-500 hover:text-violet-400 transition-colors"
        >
          ← Back
        </button>
        <h1 className="text-2xl font-black text-slate-100">New Listing</h1>
      </div>

      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        {/* Figure selector */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5 font-medium">
            Figure <span className="text-red-400">*</span>
          </label>
          <select
            name="figureId"
            value={formData.figureId}
            onChange={handleChange}
            required
            className="input"
          >
            <option value="">Select a figure...</option>
            {figures.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name} — {f.series} ({f.scale})
              </option>
            ))}
          </select>
          {selectedFigure && (
            <div className="mt-2 text-xs text-slate-500 bg-[#0a0a12] border border-[#1a1a3a] rounded-lg p-2">
              <span className="text-slate-400">{selectedFigure.character}</span> · {selectedFigure.manufacturer}
            </div>
          )}
        </div>

        {/* Price */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5 font-medium">
            Price (USD) <span className="text-red-400">*</span>
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500">$</span>
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="0.00"
              step="0.01"
              min="0.01"
              required
              className="input pl-7"
            />
          </div>
        </div>

        {/* Condition */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5 font-medium">
            Condition <span className="text-red-400">*</span>
          </label>
          <select
            name="condition"
            value={formData.condition}
            onChange={handleChange}
            className="input"
          >
            {CONDITIONS.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Stock */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5 font-medium">
            Stock <span className="text-red-400">*</span>
          </label>
          <input
            type="number"
            name="stock"
            value={formData.stock}
            onChange={handleChange}
            min="1"
            required
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
            placeholder="Describe the condition, box status, accessories included..."
            className="input resize-none text-sm"
          />
        </div>

        {/* Photos */}
        <div>
          <label className="block text-sm text-slate-400 mb-1.5 font-medium">Photos</label>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handlePhotoChange}
            className="block w-full text-sm text-slate-400 file:mr-4 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-medium file:bg-violet-900/30 file:text-violet-300 hover:file:bg-violet-900/50 transition-colors"
          />
          {photos.length > 0 && (
            <p className="text-xs text-slate-500 mt-1">{photos.length} file(s) selected</p>
          )}
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-900/50 rounded-lg px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={loading} className="btn-primary">
            {loading ? "Creating..." : "Create Listing"}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="btn-ghost"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}

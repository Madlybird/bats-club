"use client"

import { useState } from "react"

interface ImportResult {
  imported: number
  failed: number
  errors: string[]
}

const EXPECTED_COLUMNS = [
  { name: "name", desc: "Figure name", example: "Rem 1/7 Scale Figure" },
  { name: "series", desc: "Anime/game series", example: "Re:Zero" },
  { name: "character", desc: "Character name", example: "Rem" },
  { name: "manufacturer", desc: "Manufacturer", example: "Good Smile Company" },
  { name: "scale", desc: "Scale", example: "1/7" },
  { name: "year", desc: "Release year", example: "2019" },
  { name: "sculptor", desc: "Sculptor (optional)", example: "YOSHIDA Shin" },
  { name: "material", desc: "Material (optional)", example: "PVC/ABS" },
]

export default function ImportPage() {
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file) {
      setError("Please select a CSV file")
      return
    }

    setLoading(true)
    setError("")
    setResult(null)

    try {
      const fd = new FormData()
      fd.append("file", file)

      const res = await fetch("/api/import", { method: "POST", body: fd })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Import failed")
        return
      }

      setResult(data)
    } catch {
      setError("Something went wrong")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-100">Import Figures</h1>
        <p className="text-slate-500 mt-1 text-sm">Bulk import figures from a CSV file</p>
      </div>

      {/* Expected format */}
      <div className="card overflow-hidden mb-8">
        <div className="px-5 py-3 border-b border-[#1a1a3a] flex items-center gap-2">
          <span>📋</span>
          <h2 className="font-bold text-slate-100 text-sm">Expected CSV Format</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a3a]">
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">Column</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">Description</th>
                <th className="text-left px-4 py-2 text-xs text-slate-500 font-medium">Example</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a3a]">
              {EXPECTED_COLUMNS.map((col) => (
                <tr key={col.name}>
                  <td className="px-4 py-2 font-mono text-xs text-violet-400">{col.name}</td>
                  <td className="px-4 py-2 text-slate-400 text-xs">{col.desc}</td>
                  <td className="px-4 py-2 text-slate-500 text-xs italic">{col.example}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="px-5 py-3 bg-[#0a0a12] border-t border-[#1a1a3a]">
          <p className="text-xs text-slate-500">
            First row should be headers. All columns required except{" "}
            <span className="text-violet-400">sculptor</span> and{" "}
            <span className="text-violet-400">material</span>.
          </p>
          <p className="text-xs text-slate-600 mt-1 font-mono">
            name,series,character,manufacturer,scale,year,sculptor,material
          </p>
        </div>
      </div>

      {/* Upload form */}
      <form onSubmit={handleSubmit} className="card p-6 space-y-5">
        <div>
          <label className="block text-sm text-slate-400 mb-2 font-medium">
            CSV File <span className="text-red-400">*</span>
          </label>
          <div
            className="border-2 border-dashed border-[#1a1a3a] rounded-xl p-8 text-center hover:border-violet-700/50 transition-colors cursor-pointer"
            onClick={() => document.getElementById("csv-input")?.click()}
          >
            <input
              id="csv-input"
              type="file"
              accept=".csv,text/csv"
              onChange={(e) => setFile(e.target.files?.[0] || null)}
              className="hidden"
            />
            {file ? (
              <div>
                <p className="text-emerald-400 font-medium">✓ {file.name}</p>
                <p className="text-xs text-slate-500 mt-1">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            ) : (
              <div>
                <p className="text-4xl mb-3">📥</p>
                <p className="text-slate-400 text-sm">Click to select CSV file</p>
                <p className="text-xs text-slate-600 mt-1">or drag and drop</p>
              </div>
            )}
          </div>
        </div>

        {error && (
          <div className="bg-red-900/20 border border-red-900/50 rounded-lg px-4 py-3">
            <p className="text-red-400 text-sm">{error}</p>
          </div>
        )}

        <button type="submit" disabled={loading || !file} className="btn-primary">
          {loading ? (
            <span className="flex items-center gap-2">
              <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Importing...
            </span>
          ) : (
            "Import Figures"
          )}
        </button>
      </form>

      {/* Results */}
      {result && (
        <div className="mt-6 card p-6 space-y-4">
          <h3 className="font-bold text-slate-100">Import Results</h3>
          <div className="flex gap-6">
            <div>
              <p className="text-3xl font-black text-emerald-400">{result.imported}</p>
              <p className="text-xs text-slate-500">Imported</p>
            </div>
            {result.failed > 0 && (
              <div>
                <p className="text-3xl font-black text-red-400">{result.failed}</p>
                <p className="text-xs text-slate-500">Failed</p>
              </div>
            )}
          </div>
          {result.errors.length > 0 && (
            <div className="bg-red-900/10 border border-red-900/30 rounded-lg p-4">
              <p className="text-xs font-medium text-red-400 mb-2">Errors:</p>
              <ul className="space-y-1">
                {result.errors.map((err, i) => (
                  <li key={i} className="text-xs text-red-300">• {err}</li>
                ))}
              </ul>
            </div>
          )}
          {result.imported > 0 && (
            <p className="text-sm text-emerald-400">
              ✓ {result.imported} figure{result.imported !== 1 ? "s" : ""} added to archive
            </p>
          )}
        </div>
      )}
    </div>
  )
}

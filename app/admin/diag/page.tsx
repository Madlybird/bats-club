"use client"

import { useState } from "react"

export default function AdminDiagPage() {
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const run = async () => {
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch("/api/admin/diag", { cache: "no-store" })
      const data = await res.json()
      setResult({ status: res.status, data })
    } catch (e: any) {
      setResult({ status: 0, data: { error: e?.message || String(e) } })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-black text-slate-100 mb-2">Admin Diagnostics</h1>
      <p className="text-slate-500 text-sm mb-6">
        Runs a test article insert (and deletes it) against the live DB so we can see exactly
        why article saves are failing. No DevTools needed — the full response appears below.
      </p>

      <div className="flex gap-3">
        <button
          onClick={run}
          disabled={loading}
          className="bg-violet-700 hover:bg-violet-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          {loading ? "Running…" : "Run diagnostic"}
        </button>
        <button
          onClick={async () => {
            setLoading(true)
            setResult(null)
            try {
              const res = await fetch("/api/admin/seed-welcome", { method: "POST", cache: "no-store" })
              const data = await res.json()
              setResult({ status: res.status, data })
            } catch (e: any) {
              setResult({ status: 0, data: { error: e?.message || String(e) } })
            } finally {
              setLoading(false)
            }
          }}
          disabled={loading}
          className="bg-pink-700 hover:bg-pink-600 disabled:opacity-50 text-white px-6 py-2.5 rounded-lg font-medium transition-colors"
        >
          {loading ? "Working…" : "Seed Welcome article"}
        </button>
      </div>

      {result && (
        <div className="mt-6 space-y-4">
          <div className="rounded-lg border border-[#1a1a3a] bg-[#0a0a12] p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">HTTP status</p>
            <p className="text-slate-200 font-mono text-sm">{result.status}</p>
          </div>

          {result.data?.nextSteps && (
            <div className="rounded-lg border border-violet-700/50 bg-violet-900/20 p-4">
              <p className="text-xs text-violet-400 uppercase tracking-wider mb-2">
                What to do
              </p>
              <ul className="list-disc list-inside space-y-1 text-slate-200 text-sm">
                {result.data.nextSteps.map((step: string, i: number) => (
                  <li key={i}>{step}</li>
                ))}
              </ul>
            </div>
          )}

          <div className="rounded-lg border border-[#1a1a3a] bg-[#0a0a12] p-4">
            <p className="text-xs text-slate-500 uppercase tracking-wider mb-2">Full response</p>
            <pre className="text-xs text-slate-300 overflow-x-auto whitespace-pre-wrap break-words">
              {JSON.stringify(result.data, null, 2)}
            </pre>
          </div>
        </div>
      )}
    </div>
  )
}

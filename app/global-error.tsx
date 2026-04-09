"use client"

import { useEffect } from "react"

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <html lang="en" className="dark">
      <body className="min-h-screen text-slate-200 antialiased">
        <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
          <div className="max-w-md w-full text-center">
            <h1 className="text-3xl font-semibold mb-3">Something went wrong</h1>
            <p className="text-sm text-slate-400 mb-8">
              An unexpected error occurred. Please try again.
            </p>
            <button
              onClick={() => reset()}
              className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-md bg-[#ff2d78] hover:bg-[#e6246a] text-white transition-colors"
            >
              Try again
            </button>
          </div>
        </div>
      </body>
    </html>
  )
}

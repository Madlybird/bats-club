import Link from "next/link"

export default function NotFound() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <h1 className="text-5xl font-semibold mb-3">404</h1>
        <p className="text-sm text-slate-400 mb-8">
          The page you’re looking for doesn’t exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center justify-center px-5 py-2.5 text-sm font-medium rounded-md bg-[#ff2d78] hover:bg-[#e6246a] text-white transition-colors"
        >
          Back home
        </Link>
      </div>
    </div>
  )
}

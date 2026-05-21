"use client"

import Link from "next/link"
import { useSession } from "next-auth/react"

// Tiny client island that lets the home page stay fully static.
// Reads the session client-side and hides the CTA for logged-in
// users — same UX as before, just hydrated after the page lands.
export default function JoinCta({
  label,
  href = "/register",
}: {
  label: string
  href?: string
}) {
  const { status } = useSession()
  if (status === "authenticated") return null
  return (
    <Link
      href={href}
      className="px-8 py-3.5 border border-white/10 hover:border-white/25 text-white/50 hover:text-white text-sm font-bold lowercase tracking-wide rounded-full transition-all"
    >
      {label}
    </Link>
  )
}

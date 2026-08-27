"use client"

import { usePathname } from "next/navigation"
import { useEffect } from "react"

// The root layout renders a single <html lang="en"> for every route,
// including the /ru and /jp locale trees (they're plain sibling folders
// under app/, not an i18n routing setup, so there's no per-locale root
// layout to override lang). A stale lang="en" on localized pages both
// hurts accessibility and feeds Google's "Incorrect language" signal in
// Merchant Center. Making the root layout read the pathname server-side
// would force every page off static/ISR rendering, so instead we correct
// document.documentElement.lang on the client after navigation — Google
// renders JS and picks up the corrected value.
const LOCALE_LANG: Record<string, string> = { "/ru": "ru", "/jp": "ja" }

export default function HtmlLangSync() {
  const pathname = usePathname()

  useEffect(() => {
    const prefix = pathname.match(/^\/(ru|jp)(?=\/|$)/)?.[0]
    document.documentElement.lang = prefix ? LOCALE_LANG[prefix] : "en"
  }, [pathname])

  return null
}

"use client"

import { useSession, signOut } from "next-auth/react"
import { usePathname } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { useState } from "react"
import { useCart } from "@/lib/cart-context"
import { en, ru, jp } from "@/lib/dict"

const DICTS = { en, ru, jp }

function getLocale(pathname: string): "en" | "ru" | "jp" {
  if (pathname.startsWith("/ru")) return "ru"
  if (pathname.startsWith("/jp")) return "jp"
  return "en"
}

function stripLocale(pathname: string): string {
  return pathname.replace(/^\/(ru|jp)(\/|$)/, "/") || "/"
}

function withLocale(locale: "en" | "ru" | "jp", bare: string): string {
  if (locale === "en") return bare
  if (bare === "/") return `/${locale}`
  return `/${locale}${bare}`
}

export default function Navbar() {
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen] = useState(false)
  const pathname = usePathname()
  const locale = getLocale(pathname)
  const bare = stripLocale(pathname)
  const { count: cartCount } = useCart()

  const dict = DICTS[locale]

  const archiveHref = withLocale(locale, "/archive")
  const shopHref = withLocale(locale, "/shop")
  const articlesHref = withLocale(locale, "/articles")

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-[#0a0a0a]/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link href={withLocale(locale, "/")} className="flex items-center">
            <Image src="/logo.png" alt="Bats Club" width={120} height={36} className="h-8 w-auto" priority />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-1">
            <NavLink href={archiveHref}>{dict.nav_archive}</NavLink>
            <NavLink href={shopHref}>{dict.nav_shop}</NavLink>
            <NavLink href={articlesHref}>{dict.nav_articles}</NavLink>
          </nav>

          {/* Desktop Right */}
          <div className="hidden md:flex items-center gap-4">
            {/* Language switcher */}
            <div className="flex items-center gap-1 text-xs font-bold">
              <Link
                href={withLocale("en", bare)}
                className={`px-2 py-1 rounded transition-colors ${
                  locale === "en" ? "text-white" : "text-white/25 hover:text-white/60"
                }`}
              >
                EN
              </Link>
              <span className="text-white/10">|</span>
              <Link
                href={withLocale("ru", bare)}
                className={`px-2 py-1 rounded transition-colors ${
                  locale === "ru" ? "text-white" : "text-white/25 hover:text-white/60"
                }`}
              >
                RU
              </Link>
              <span className="text-white/10">|</span>
              <Link
                href={withLocale("jp", bare)}
                className={`px-2 py-1 rounded transition-colors ${
                  locale === "jp" ? "text-white" : "text-white/25 hover:text-white/60"
                }`}
              >
                JP
              </Link>
            </div>

            {/* Cart icon */}
            <Link href={withLocale(locale, "/cart")} className="relative text-white/40 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: "#ff2d78" }}>
                  {cartCount}
                </span>
              )}
            </Link>

            {session ? (
              <>
                {session.user.isAdmin && (
                  <Link
                    href="/admin"
                    className="text-xs px-3 py-1 rounded-full border border-[#ff2d78]/40 text-[#ff2d78] hover:bg-[#ff2d78]/10 transition-colors"
                  >
                    Admin
                  </Link>
                )}
                <Link
                  href={`/profile/${session.user.username}`}
                  className="flex items-center gap-2 text-sm text-white/60 hover:text-white transition-colors"
                >
                  <div className="w-7 h-7 rounded-full bg-[#ff2d78]/20 border border-[#ff2d78]/30 flex items-center justify-center text-[#ff2d78] text-xs font-bold">
                    {session.user.name?.charAt(0).toUpperCase()}
                  </div>
                  <span>{session.user.username}</span>
                </Link>
                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="text-sm text-white/40 hover:text-white transition-colors"
                >
                  Sign Out
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">
                  {dict.nav_signin}
                </Link>
                <Link
                  href="/register"
                  className="text-sm px-4 py-1.5 text-white rounded-full font-medium transition-colors"
                  style={{ backgroundColor: "#ff2d78" }}
                >
                  {dict.nav_join}
                </Link>
              </>
            )}
          </div>

          {/* Mobile: cart + hamburger */}
          <div className="md:hidden flex items-center gap-3">
            <Link href={withLocale(locale, "/cart")} className="relative text-white/40 hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-0.5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ backgroundColor: "#ff2d78" }}>
                  {cartCount}
                </span>
              )}
            </Link>
            <button
              className="text-white/40 hover:text-white p-1 transition-colors"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                {mobileOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-white/5 space-y-1">
            <MobileNavLink href={archiveHref} onClick={() => setMobileOpen(false)}>{dict.nav_archive}</MobileNavLink>
            <MobileNavLink href={shopHref} onClick={() => setMobileOpen(false)}>{dict.nav_shop}</MobileNavLink>
            <MobileNavLink href={articlesHref} onClick={() => setMobileOpen(false)}>{dict.nav_articles}</MobileNavLink>
            {/* Language switcher mobile */}
            <div className="flex gap-3 px-3 py-2">
              {(["en", "ru", "jp"] as const).map((l, idx) => (
                <span key={l} className="flex items-center gap-3">
                  {idx > 0 && <span className="text-white/10 text-xs">|</span>}
                  <Link
                    href={withLocale(l, bare)}
                    onClick={() => setMobileOpen(false)}
                    className={`text-xs font-bold transition-colors ${locale === l ? "text-white" : "text-white/25"}`}
                  >
                    {l.toUpperCase()}
                  </Link>
                </span>
              ))}
            </div>
            <div className="pt-2 border-t border-white/5">
              {session ? (
                <>
                  {session.user.isAdmin && (
                    <MobileNavLink href="/admin" onClick={() => setMobileOpen(false)}>
                      Admin Panel
                    </MobileNavLink>
                  )}
                  <MobileNavLink href={`/profile/${session.user.username}`} onClick={() => setMobileOpen(false)}>
                    My Profile
                  </MobileNavLink>
                  <button
                    onClick={() => { signOut({ callbackUrl: "/" }); setMobileOpen(false) }}
                    className="w-full text-left px-3 py-2 text-sm text-white/40 hover:text-white transition-colors"
                  >
                    Sign Out
                  </button>
                </>
              ) : (
                <>
                  <MobileNavLink href="/login" onClick={() => setMobileOpen(false)}>{dict.nav_signin}</MobileNavLink>
                  <MobileNavLink href="/register" onClick={() => setMobileOpen(false)}>{dict.nav_join}</MobileNavLink>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors font-medium lowercase tracking-wide"
    >
      {children}
    </Link>
  )
}

function MobileNavLink({
  href,
  children,
  onClick,
}: {
  href: string
  children: React.ReactNode
  onClick?: () => void
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="block px-3 py-2 text-sm text-white/50 hover:text-white transition-colors lowercase"
    >
      {children}
    </Link>
  )
}

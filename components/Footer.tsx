"use client"

import { usePathname } from "next/navigation"

function getLocale(pathname: string): "en" | "ru" | "jp" {
  if (pathname.startsWith("/ru")) return "ru"
  if (pathname.startsWith("/jp")) return "jp"
  return "en"
}

function withLocale(locale: "en" | "ru" | "jp", bare: string): string {
  if (locale === "en") return bare
  if (bare === "/") return `/${locale}`
  return `/${locale}${bare}`
}

const footerDict = {
  en: {
    tagline: "Private anime figure archive & marketplace.",
    archive: "Archive",
    shop: "Shop",
    articles: "Articles",
    faq: "FAQ",
    privacy: "Privacy Policy",
    terms: "Terms",
    rights: "All rights reserved.",
  },
  ru: {
    tagline: "Частный архив и маркетплейс аниме фигурок.",
    archive: "Архив",
    shop: "Магазин",
    articles: "Статьи",
    faq: "FAQ",
    privacy: "Политика конфиденциальности",
    terms: "Условия использования",
    rights: "Все права защищены.",
  },
  jp: {
    tagline: "プライベートアニメフィギュアアーカイブ＆マーケットプレイス",
    archive: "アーカイブ",
    shop: "ショップ",
    articles: "記事",
    faq: "FAQ",
    privacy: "プライバシーポリシー",
    terms: "利用規約",
    rights: "全著作権所有",
  },
}

export default function Footer() {
  const pathname = usePathname()
  const locale = getLocale(pathname)
  const t = footerDict[locale]

  return (
    <footer className="border-t border-black/10 py-14">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 items-start">

          {/* Brand */}
          <div>
            <img src="/logo.png" alt="Bats Club" className="h-8 w-auto mb-3" />
            <p className="text-xs leading-relaxed max-w-[200px]" style={{ color: "#1a1a1a" }}>
              {t.tagline}
            </p>
          </div>

          {/* Nav */}
          <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm" style={{ color: "#1a1a1a" }}>
            <a href={withLocale(locale, "/archive")} className="hover:text-[#ff2d78] transition-colors">{t.archive}</a>
            <a href={withLocale(locale, "/shop")} className="hover:text-[#ff2d78] transition-colors">{t.shop}</a>
            <a href={withLocale(locale, "/articles")} className="hover:text-[#ff2d78] transition-colors">{t.articles}</a>
            <a href={withLocale(locale, "/faq")} className="hover:text-[#ff2d78] transition-colors">{t.faq}</a>
          </div>

          {/* Social + copyright */}
          <div className="flex flex-col items-start md:items-end gap-4">
            <div className="flex items-center gap-4">
              {/* Reddit */}
              <a href="https://www.reddit.com/r/RareAnimeFigures/" target="_blank" rel="noopener noreferrer" aria-label="Reddit" className="hover:text-[#ff2d78] transition-colors" style={{ color: "#1a1a1a" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z"/>
                </svg>
              </a>
              {/* Pinterest */}
              <a href="https://www.pinterest.com/bats_club/" target="_blank" rel="noopener noreferrer" aria-label="Pinterest" className="hover:text-[#ff2d78] transition-colors" style={{ color: "#1a1a1a" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738a.36.36 0 0 1 .083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.931 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.632-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/>
                </svg>
              </a>
              {/* YouTube */}
              <a href="https://www.youtube.com/@bats4club" target="_blank" rel="noopener noreferrer" aria-label="YouTube" className="hover:text-[#ff2d78] transition-colors" style={{ color: "#1a1a1a" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                </svg>
              </a>
              {/* TikTok */}
              <a href="https://www.tiktok.com/@batsclub" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="hover:text-[#ff2d78] transition-colors" style={{ color: "#1a1a1a" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12.525.02c1.31-.02 2.61-.01 3.91-.02.08 1.53.63 3.09 1.75 4.17 1.12 1.11 2.7 1.62 4.24 1.79v4.03c-1.44-.05-2.89-.35-4.2-.97-.57-.26-1.1-.59-1.62-.93-.01 2.92.01 5.84-.02 8.75-.08 1.4-.54 2.79-1.35 3.94-1.31 1.92-3.58 3.17-5.91 3.21-1.43.08-2.86-.31-4.08-1.03-2.02-1.19-3.44-3.37-3.65-5.71-.02-.5-.03-1-.01-1.49.18-1.9 1.12-3.72 2.58-4.96 1.66-1.44 3.98-2.13 6.15-1.72.02 1.48-.04 2.96-.04 4.44-.99-.32-2.15-.23-3.02.37-.63.41-1.11 1.04-1.36 1.75-.21.51-.15 1.07-.14 1.61.24 1.64 1.82 3.02 3.5 2.87 1.12-.01 2.19-.66 2.77-1.61.19-.33.4-.67.41-1.06.1-1.79.06-3.57.07-5.36.01-4.03-.01-8.05.02-12.07z"/>
                </svg>
              </a>
              {/* Email Support */}
              <a href="mailto:support@batsclub.com" aria-label="Email support" className="hover:text-[#ff2d78] transition-colors" style={{ color: "#1a1a1a" }}>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </a>
            </div>
            <div className="flex flex-col items-start md:items-end gap-1.5">
              <p className="text-xs" style={{ color: "#1a1a1a" }}>
                &copy; 2026 Bats Club by Sinbiox Limited. {t.rights}
              </p>
              <div className="flex gap-3 text-xs" style={{ color: "#1a1a1a" }}>
                <a href={withLocale(locale, "/privacy")} className="hover:text-[#ff2d78] transition-colors">{t.privacy}</a>
                <a href={withLocale(locale, "/terms")} className="hover:text-[#ff2d78] transition-colors">{t.terms}</a>
              </div>
            </div>
          </div>

        </div>
      </div>
    </footer>
  )
}

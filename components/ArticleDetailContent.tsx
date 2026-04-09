import Image from "next/image"
import Link from "next/link"
import BatsOverlay from "@/components/BatsOverlay"
import ScrollReveal from "@/components/ScrollReveal"
import type { Dict } from "@/lib/dict"

interface ArticleFigure {
  figure: {
    id: string
    name: string
    series: string
    imageUrl: string | null
  }
}

interface Author {
  name: string
  username: string
  avatar: string | null
}

interface Article {
  title: string
  excerpt: string | null
  coverImage: string | null
  body: string
  createdAt: Date | string
  author: Author
  articleFigures: ArticleFigure[]
}

interface Props {
  article: Article
  dict: Dict
  articlesHref: string
}

export default function ArticleDetailContent({ article, dict, articlesHref }: Props) {
  const date = new Date(article.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  const paragraphs = article.body.split("\n").filter(Boolean)

  return (
    <div className="relative min-h-screen">
      <BatsOverlay />
      <div className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      {/* Cover Image */}
      {article.coverImage && (
        <div className="relative h-64 sm:h-80 md:h-96 w-full overflow-hidden">
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover object-top"
            priority
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/50 to-transparent" />
        </div>
      )}

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 py-10">
        {/* Breadcrumb */}
        <ScrollReveal>
          <nav className="flex items-center gap-2 text-sm text-white/30 mb-8">
            <Link href={articlesHref} className="hover:text-[#ff2d78] transition-colors">
              {dict.nav_articles}
            </Link>
            <span>/</span>
            <span className="text-white/50 truncate">{article.title}</span>
          </nav>
        </ScrollReveal>

        {/* Title */}
        <ScrollReveal>
          <header className="mb-8">
            <span className="inline-block w-8 h-px bg-[#ff2d78] mb-4" />
            <h1 className="text-4xl font-black text-white leading-tight mb-4">
              {article.title}
            </h1>
            {article.excerpt && (
              <p className="text-lg text-white/50 leading-relaxed">
                {article.excerpt}
              </p>
            )}
          </header>
        </ScrollReveal>

        {/* Author */}
        <ScrollReveal>
          <div className="flex items-center gap-3 mb-8 pb-8 border-b border-white/[0.06]">
            {article.author.avatar ? (
              <Image
                src={article.author.avatar}
                alt={article.author.name}
                width={44}
                height={44}
                className="rounded-full border-2 border-[#ff2d78]/60"
              />
            ) : (
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold border-2 border-[#ff2d78]/60"
                style={{ background: "#0a0a0a", boxShadow: "0 0 12px rgba(255,45,120,0.2)" }}
              >
                {article.author.name.charAt(0)}
              </div>
            )}
            <div>
              <Link
                href={`/profile/${article.author.username}`}
                className="font-medium text-white hover:text-[#ff2d78] transition-colors"
              >
                {article.author.name}
              </Link>
              <p className="text-xs text-white/30">
                @{article.author.username} · {dict.article_published} {date}
              </p>
            </div>
          </div>
        </ScrollReveal>

        {/* Body */}
        <ScrollReveal>
          <div className="space-y-5">
            {paragraphs.map((para, i) => (
              <p key={i} className="text-white/70 leading-8 text-base">
                {para}
              </p>
            ))}
          </div>
        </ScrollReveal>

        {/* Linked Figures */}
        {article.articleFigures.length > 0 && (
          <ScrollReveal>
            <section className="mt-12 pt-8 border-t border-white/[0.06]">
              <div className="mb-5">
                <span className="inline-block w-8 h-px bg-[#ff2d78] mb-3" />
                <h2 className="text-xl font-black text-white lowercase tracking-tight">
                  {dict.article_figures_mentioned}
                </h2>
                <p className="text-sm text-white/25 mt-0.5">{article.articleFigures.length}</p>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                {article.articleFigures.map(({ figure }) => (
                  <Link
                    key={figure.id}
                    href={`/figures/${figure.id}`}
                    className="group overflow-hidden rounded-xl border border-white/[0.06] hover:border-[#ff2d78]/30 transition-all duration-200"
                    style={{ background: "#0a0a0a" }}
                  >
                    <div className="relative aspect-square">
                      {figure.imageUrl ? (
                        <Image
                          src={figure.imageUrl}
                          alt={figure.name}
                          fill
                          className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                          sizes="200px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-3xl opacity-20">🦇</span>
                        </div>
                      )}
                    </div>
                    <div className="p-2">
                      <p className="text-xs font-medium text-white/70 line-clamp-2 group-hover:text-[#ff2d78] transition-colors">
                        {figure.name}
                      </p>
                      <p className="text-[10px] text-white/25 mt-0.5">{figure.series}</p>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          </ScrollReveal>
        )}

        {/* Back link */}
        <ScrollReveal>
          <div className="mt-12 pt-8 border-t border-white/[0.06]">
            <Link
              href={articlesHref}
              className="inline-flex items-center gap-2 text-sm text-white/40 hover:text-[#ff2d78] transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {dict.article_back}
            </Link>
          </div>
        </ScrollReveal>
      </div>
    </div>
  )
}

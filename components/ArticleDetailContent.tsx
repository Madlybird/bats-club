import Image from "next/image"
import Link from "next/link"
import BatsOverlay from "@/components/BatsOverlay"
import ScrollReveal from "@/components/ScrollReveal"
import MarkdownRenderer from "@/components/MarkdownRenderer"
import type { Dict } from "@/lib/dict"

interface ArticleFigure {
  figure: {
    id: string
    slug?: string | null
    name: string
    series: string
    imageUrl: string | null
  }
}

interface Article {
  title: string
  coverImage: string | null
  body: string
  articleFigures: ArticleFigure[]
}

interface Props {
  article: Article
  dict: Dict
  articlesHref: string
}

export default function ArticleDetailContent({ article, dict, articlesHref }: Props) {
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

      {/* Cover Image — full-width, at top, no background/overlay */}
      {article.coverImage && (
        <div className="relative w-full">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={article.coverImage}
            alt={article.title}
            style={{
              width: "100%",
              maxHeight: 500,
              objectFit: "cover",
              display: "block",
            }}
          />
        </div>
      )}

      <div className="relative mx-auto px-4 sm:px-6 py-10" style={{ maxWidth: 720 }}>
        {/* Title */}
        <ScrollReveal>
          <header className="mb-8">
            <h1 className="text-4xl font-black text-white leading-tight">
              {article.title}
            </h1>
          </header>
        </ScrollReveal>

        {/* Body */}
        <ScrollReveal>
          <MarkdownRenderer source={article.body} />
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
                    href={`/figures/${figure.slug || figure.id}`}
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

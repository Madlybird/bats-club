import Link from "next/link"
import Image from "next/image"

interface ArticleCardProps {
  article: {
    id: string
    title: string
    slug: string
    excerpt?: string | null
    coverImage?: string | null
    createdAt: Date | string
    author: {
      name: string
      username: string
      avatar?: string | null
    }
  }
  readMoreLabel?: string
}

export default function ArticleCard({ article, readMoreLabel = "Read More" }: ArticleCardProps) {
  const date = new Date(article.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })

  return (
    <article
      className="group overflow-hidden flex flex-col rounded-xl border border-white/[0.06] hover:border-[#ff2d78]/30 transition-all duration-200"
      style={{ background: "#0a0a0a" }}
    >
      {/* Cover Image */}
      <Link href={`/articles/${article.slug}`} className="block relative aspect-video overflow-hidden" style={{ background: "#0a0a0a" }}>
        {article.coverImage ? (
          <Image
            src={article.coverImage}
            alt={article.title}
            fill
            className="object-cover group-hover:scale-105 transition-transform duration-500"
            sizes="(max-width: 768px) 100vw, 50vw"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-5xl opacity-20">🦇</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      </Link>

      {/* Content */}
      <div className="p-4 flex flex-col gap-3 flex-1">
        <Link href={`/articles/${article.slug}`} className="block">
          <h3 className="font-bold text-white text-base leading-tight group-hover:text-[#ff2d78] transition-colors line-clamp-2">
            {article.title}
          </h3>
        </Link>

        {article.excerpt && (
          <p className="text-sm text-white/40 line-clamp-3 leading-relaxed">
            {article.excerpt}
          </p>
        )}

        {/* Author + Date */}
        <div className="flex items-center justify-between mt-auto pt-3 border-t border-white/[0.05]">
          <div className="flex items-center gap-2">
            {article.author.avatar ? (
              <Image
                src={article.author.avatar}
                alt={article.author.name}
                width={28}
                height={28}
                className="rounded-full"
              />
            ) : (
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                style={{ background: "#ff2d78" }}
              >
                {article.author.name.charAt(0)}
              </div>
            )}
            <span className="text-xs text-white/40">{article.author.name}</span>
          </div>
          <span className="text-xs text-white/20">{date}</span>
        </div>

        <Link
          href={`/articles/${article.slug}`}
          className="text-sm font-medium transition-colors flex items-center gap-1"
          style={{ color: "#ff2d78" }}
        >
          {readMoreLabel}
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  )
}

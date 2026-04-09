import ArticleCard from "@/components/ArticleCard"
import BatsOverlay from "@/components/BatsOverlay"
import ScrollReveal from "@/components/ScrollReveal"
import type { Dict } from "@/lib/dict"

interface Article {
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

interface Props {
  articles: Article[]
  dict: Dict
}

export default function ArticlesPageContent({ articles, dict }: Props) {
  return (
    <div className="relative min-h-screen">
      <BatsOverlay />

      <div className="absolute top-1/4 left-1/3 w-[600px] h-[600px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative">
        <ScrollReveal>
          <div className="border-b border-white/[0.05]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14">
              <span className="inline-block w-8 h-px bg-[#ff2d78] mb-6" />
              <h1
                className="font-black lowercase leading-tight tracking-tighter text-white"
                style={{ fontSize: "clamp(2rem, 5vw, 3.5rem)" }}
              >
                {dict.articles_heading}
              </h1>
              <p className="text-white/35 mt-3 text-base font-medium">
                {dict.articles_sub}
              </p>
            </div>
          </div>
        </ScrollReveal>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {articles.length > 0 ? (
            <ScrollReveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {articles.map((article, i) => (
                  <ScrollReveal key={article.id} delay={i * 60}>
                    <ArticleCard article={article} readMoreLabel={dict.articles_read_more} />
                  </ScrollReveal>
                ))}
              </div>
            </ScrollReveal>
          ) : (
            <ScrollReveal>
              <div className="flex flex-col items-center justify-center py-24 text-center">
                <span className="text-5xl mb-4 opacity-30">📝</span>
                <p className="text-white/40 text-lg font-medium">{dict.articles_empty_title}</p>
                <p className="text-white/20 text-sm mt-1">{dict.articles_empty_sub}</p>
              </div>
            </ScrollReveal>
          )}
        </div>
      </div>
    </div>
  )
}

import { supabaseAdmin } from "@/lib/supabase"
import Link from "next/link"
import AdminArticleActions from "@/components/AdminArticleActions"

export default async function AdminArticlesPage() {
  const { data: articles } = await supabaseAdmin
    .from("articles")
    .select(`
      id, title, slug, published, createdAt:created_at,
      author:users(name, username),
      article_figures(id)
    `)
    .order("created_at", { ascending: false })

  const result = (articles || []).map((a) => ({
    ...a,
    _count: { articleFigures: (a.article_figures || []).length },
  }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-100">Articles</h1>
          <p className="text-slate-500 mt-1 text-sm">{result.length} total articles</p>
        </div>
        <Link href="/admin/articles/new" className="btn-primary">+ New Article</Link>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a3a]">
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Title</th>
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Author</th>
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Figures</th>
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Status</th>
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Date</th>
                <th className="text-right px-5 py-3 text-xs text-slate-500 font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a3a]">
              {result.map((article) => (
                <tr key={article.id} className="hover:bg-[#0a0a12] transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-slate-200 font-medium truncate max-w-[250px]">{article.title}</p>
                    <p className="text-xs text-slate-500 font-mono">/articles/{article.slug}</p>
                  </td>
                  <td className="px-5 py-3">
                    <p className="text-slate-300 text-sm">{(article.author as any)?.name}</p>
                    <p className="text-xs text-slate-500">@{(article.author as any)?.username}</p>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-sm">{article._count.articleFigures}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${article.published ? "badge-green" : "badge-yellow"}`}>
                      {article.published ? "Published" : "Draft"}
                    </span>
                  </td>
                  <td className="px-5 py-3 text-slate-500 text-xs">{new Date(article.createdAt).toLocaleDateString()}</td>
                  <td className="px-5 py-3 text-right">
                    <AdminArticleActions articleId={article.id} isPublished={article.published} />
                  </td>
                </tr>
              ))}
              {result.length === 0 && (
                <tr><td colSpan={6} className="px-5 py-10 text-center text-slate-500">No articles yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

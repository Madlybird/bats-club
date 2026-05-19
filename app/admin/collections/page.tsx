import Link from "next/link"
import { supabaseAdmin } from "@/lib/supabase"
import AdminCollectionsTable from "@/components/AdminCollectionsTable"

export const dynamic = "force-dynamic"

export default async function AdminCollectionsPage() {
  const { data, error } = await supabaseAdmin
    .from("collections")
    .select(
      `id, slug, nameEn:name_en, active, position,
       collection_figures(figure_id)`
    )
    .order("position", { ascending: true })

  const missingTable =
    !!error &&
    /relation .* does not exist|Could not find the table|schema cache/i.test(
      error.message ?? ""
    )

  const collections = (data || []).map((c: any) => ({
    id: c.id,
    slug: c.slug,
    nameEn: c.nameEn,
    active: c.active,
    position: c.position,
    figureCount: (c.collection_figures || []).length,
  }))

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-100">Collections</h1>
          <p className="text-slate-500 mt-1 text-sm">
            {collections.length} collection(s) · shown as homepage sliders
          </p>
        </div>
        <Link href="/admin/collections/new" className="btn-primary">
          + New Collection
        </Link>
      </div>

      {missingTable && (
        <div className="mb-6 rounded-lg border border-yellow-700/40 bg-yellow-900/10 p-4 text-sm text-yellow-300">
          The <code>collections</code> tables don&apos;t exist yet. Run{" "}
          <code className="font-mono">supabase/migrations/007_collections.sql</code>{" "}
          in the Supabase SQL Editor, then reload this page.
        </div>
      )}

      {!missingTable && error && (
        <div className="mb-6 rounded-lg border border-red-700/50 bg-red-900/20 p-4 text-sm text-red-300">
          Failed to load collections: {error.message}
        </div>
      )}

      <AdminCollectionsTable collections={collections} />
    </div>
  )
}

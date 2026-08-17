import Link from "next/link"
import CollectionForm from "@/components/CollectionForm"

export default async function EditCollectionPage(
  props: {
    params: Promise<{ id: string }>
  }
) {
  const params = await props.params;
  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/collections"
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-white">Edit Collection</h1>
      </div>
      <CollectionForm collectionId={params.id} />
    </div>
  )
}

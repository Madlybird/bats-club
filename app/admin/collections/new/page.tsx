import Link from "next/link"
import CollectionForm from "@/components/CollectionForm"

export default function NewCollectionPage() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/collections"
          className="text-slate-400 hover:text-slate-200 transition-colors"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-bold text-white">New Collection</h1>
      </div>
      <CollectionForm />
    </div>
  )
}

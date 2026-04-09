import { supabaseAdmin } from "@/lib/supabase"
import Link from "next/link"
import AdminListingActions from "@/components/AdminListingActions"

export default async function AdminListingsPage() {
  const { data: listings } = await supabaseAdmin
    .from("listings")
    .select(`
      id, price, condition, stock, active, createdAt:created_at,
      figure:figures(name, series),
      seller:users(name, username),
      orders(id)
    `)
    .order("created_at", { ascending: false })

  const result = (listings || []).map((l) => ({
    ...l,
    _count: { orders: (l.orders || []).length },
  }))

  const conditionColor: Record<string, string> = {
    Mint: "badge-green", "Near Mint": "badge-blue",
    Good: "badge-violet", Fair: "badge-yellow", Poor: "badge-red",
  }

  return (
    <div className="p-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-slate-100">Listings</h1>
          <p className="text-slate-500 mt-1 text-sm">{result.length} total listings</p>
        </div>
        <Link href="/admin/listings/new" className="btn-primary">+ New Listing</Link>
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a3a]">
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase">Figure</th>
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase">Price</th>
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase">Condition</th>
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase">Stock</th>
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase">Orders</th>
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase">Status</th>
                <th className="text-right px-5 py-3 text-xs text-slate-500 font-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a3a]">
              {result.map((listing) => (
                <tr key={listing.id} className="hover:bg-[#0a0a12] transition-colors">
                  <td className="px-5 py-3">
                    <p className="text-slate-200 font-medium truncate max-w-[200px]">{(listing.figure as any)?.name}</p>
                    <p className="text-xs text-slate-500">{(listing.figure as any)?.series}</p>
                  </td>
                  <td className="px-5 py-3 text-violet-400 font-medium">${(listing.price / 100).toFixed(2)}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${conditionColor[listing.condition] || "badge-violet"}`}>{listing.condition}</span>
                  </td>
                  <td className="px-5 py-3 text-slate-300">{listing.stock}</td>
                  <td className="px-5 py-3 text-slate-500">{listing._count.orders}</td>
                  <td className="px-5 py-3">
                    <span className={`badge ${listing.active ? "badge-green" : "badge-red"}`}>{listing.active ? "Active" : "Inactive"}</span>
                  </td>
                  <td className="px-5 py-3 text-right">
                    <AdminListingActions listingId={listing.id} isActive={listing.active} />
                  </td>
                </tr>
              ))}
              {result.length === 0 && (
                <tr><td colSpan={7} className="px-5 py-10 text-center text-slate-500">No listings yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

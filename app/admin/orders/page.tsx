import { supabaseAdmin } from "@/lib/supabase"
import AdminOrderRow from "@/components/AdminOrderRow"

export default async function AdminOrdersPage() {
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select(`
      id, status, quantity,
      unitPrice:unit_price, shippingPrice:shipping_price,
      shippingAddress:shipping_address, trackingNumber:tracking_number,
      createdAt:created_at,
      buyer:users(id, name, username, email),
      listing:listings(id, price, condition, figure:figures(id, name, series, imageUrl:image_url))
    `)
    .order("created_at", { ascending: false })

  // Normalize to match AdminOrderRow's expected interface
  const normalized = (orders || []).map((o) => {
    const buyer = (Array.isArray(o.buyer) ? o.buyer[0] : o.buyer) as any
    const listing = (Array.isArray(o.listing) ? o.listing[0] : o.listing) as any
    const figure = Array.isArray(listing?.figure) ? listing.figure[0] : listing?.figure
    const addr = o.shippingAddress
    return {
      id: o.id,
      status: o.status,
      quantity: o.quantity,
      unitPrice: o.unitPrice as number,
      shippingPrice: o.shippingPrice as number,
      trackingNumber: (o.trackingNumber as string | null) ?? null,
      shippingAddress: typeof addr === "object" && addr !== null
        ? JSON.stringify(addr)
        : String(addr ?? ""),
      createdAt: new Date(o.createdAt as string),
      buyer: { name: buyer?.name ?? "", username: buyer?.username ?? "" },
      listing: { figure: { name: figure?.name ?? "", series: figure?.series ?? "" } },
    }
  })

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-100">Orders</h1>
        <p className="text-slate-500 mt-1 text-sm">{normalized.length} total orders</p>
      </div>
      <div className="flex gap-4 mb-6">
        {[
          { status: "PENDING", color: "text-yellow-400" },
          { status: "PAID", color: "text-blue-400" },
          { status: "SHIPPED", color: "text-violet-400" },
          { status: "DELIVERED", color: "text-emerald-400" },
          { status: "CANCELLED", color: "text-red-400" },
        ].map((s) => (
          <div key={s.status} className="card px-4 py-3 flex items-center gap-2">
            <span className={`text-lg font-black ${s.color}`}>
              {normalized.filter((o) => o.status === s.status).length}
            </span>
            <span className="text-xs text-slate-500">{s.status}</span>
          </div>
        ))}
      </div>
      <div className="card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a3a]">
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase">Order ID</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase">Buyer</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase">Item</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase">Total</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase">Address</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase">Status</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase">Tracking</th>
                <th className="text-left px-4 py-3 text-xs text-slate-500 font-medium uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a3a]">
              {normalized.map((order) => (
                <AdminOrderRow key={order.id} order={order} />
              ))}
              {normalized.length === 0 && (
                <tr><td colSpan={8} className="px-4 py-10 text-center text-slate-500 text-sm">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

import { supabaseAdmin } from "@/lib/supabase"
import Link from "next/link"

export default async function AdminDashboard() {
  const [
    { count: figureCount },
    { count: listingCount },
    { count: pendingOrders },
    { data: paidOrders },
    { data: recentOrders },
  ] = await Promise.all([
    supabaseAdmin.from("figures").select("*", { count: "exact", head: true }),
    supabaseAdmin.from("listings").select("*", { count: "exact", head: true }).eq("active", true),
    supabaseAdmin.from("orders").select("*", { count: "exact", head: true }).eq("status", "PENDING"),
    supabaseAdmin.from("orders").select("unit_price, quantity, shipping_price").eq("status", "PAID"),
    supabaseAdmin.from("orders").select(`
      id, status, quantity, unitPrice:unit_price, shippingPrice:shipping_price, createdAt:created_at,
      buyer:users(username),
      listing:listings(figure:figures(name))
    `).order("created_at", { ascending: false }).limit(10),
  ])

  const totalRevenue = (paidOrders || []).reduce(
    (acc, o) => acc + o.unit_price * o.quantity + o.shipping_price, 0
  )

  const stats = [
    { label: "Total Figures", value: figureCount ?? 0, icon: "🦇", color: "text-violet-400", bg: "bg-violet-900/20 border-violet-800/30" },
    { label: "Active Listings", value: listingCount ?? 0, icon: "📦", color: "text-blue-400", bg: "bg-blue-900/20 border-blue-800/30" },
    { label: "Pending Orders", value: pendingOrders ?? 0, icon: "⏳", color: "text-yellow-400", bg: "bg-yellow-900/20 border-yellow-800/30" },
    { label: "Total Revenue", value: `$${(totalRevenue / 100).toFixed(2)}`, icon: "💰", color: "text-emerald-400", bg: "bg-emerald-900/20 border-emerald-800/30" },
  ]

  const statusBadge: Record<string, string> = {
    PENDING: "badge-yellow", PAID: "badge-blue", SHIPPED: "badge-violet",
    DELIVERED: "badge-green", CANCELLED: "badge-red",
  }

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-100">Dashboard</h1>
        <p className="text-slate-500 mt-1 text-sm">Welcome back to Bats Club admin</p>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat) => (
          <div key={stat.label} className={`card border p-5 ${stat.bg}`}>
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{stat.icon}</span>
            </div>
            <p className={`text-3xl font-black ${stat.color}`}>{stat.value}</p>
            <p className="text-xs text-slate-500 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-10">
        <Link href="/admin/listings/new" className="card p-4 text-center hover:border-violet-700/50 transition-colors group">
          <span className="text-2xl block mb-2">➕</span>
          <p className="text-sm font-medium text-slate-300 group-hover:text-violet-400 transition-colors">New Listing</p>
        </Link>
        <Link href="/admin/import" className="card p-4 text-center hover:border-violet-700/50 transition-colors group">
          <span className="text-2xl block mb-2">📥</span>
          <p className="text-sm font-medium text-slate-300 group-hover:text-violet-400 transition-colors">Import CSV</p>
        </Link>
        <Link href="/admin/articles/new" className="card p-4 text-center hover:border-violet-700/50 transition-colors group">
          <span className="text-2xl block mb-2">✍️</span>
          <p className="text-sm font-medium text-slate-300 group-hover:text-violet-400 transition-colors">New Article</p>
        </Link>
        <Link href="/admin/orders" className="card p-4 text-center hover:border-violet-700/50 transition-colors group">
          <span className="text-2xl block mb-2">📋</span>
          <p className="text-sm font-medium text-slate-300 group-hover:text-violet-400 transition-colors">View Orders</p>
        </Link>
      </div>
      <div className="card overflow-hidden">
        <div className="px-5 py-4 border-b border-[#1a1a3a] flex items-center justify-between">
          <h2 className="font-bold text-slate-100">Recent Orders</h2>
          <Link href="/admin/orders" className="text-xs text-violet-400 hover:text-violet-300 transition-colors">View all →</Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[#1a1a3a]">
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase">Order</th>
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase">Buyer</th>
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase">Item</th>
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase">Total</th>
                <th className="text-left px-5 py-3 text-xs text-slate-500 font-medium uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1a1a3a]">
              {(recentOrders || []).map((order) => (
                <tr key={order.id} className="hover:bg-[#0a0a12] transition-colors">
                  <td className="px-5 py-3 font-mono text-xs text-slate-500">{order.id.slice(0, 8)}...</td>
                  <td className="px-5 py-3 text-slate-300">@{(order.buyer as any)?.username}</td>
                  <td className="px-5 py-3 text-slate-300 truncate max-w-[180px]">{(order.listing as any)?.figure?.name}</td>
                  <td className="px-5 py-3 text-violet-400 font-medium">
                    ${((order.unitPrice * order.quantity + order.shippingPrice) / 100).toFixed(2)}
                  </td>
                  <td className="px-5 py-3">
                    <span className={`badge ${statusBadge[order.status] || "badge-violet"}`}>{order.status}</span>
                  </td>
                </tr>
              ))}
              {(recentOrders || []).length === 0 && (
                <tr><td colSpan={5} className="px-5 py-8 text-center text-slate-500 text-sm">No orders yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

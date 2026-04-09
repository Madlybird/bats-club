"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

const STATUSES = ["PENDING", "PAID", "SHIPPED", "DELIVERED", "CANCELLED"]

const statusBadge: Record<string, string> = {
  PENDING: "badge-yellow",
  PAID: "badge-blue",
  SHIPPED: "badge-violet",
  DELIVERED: "badge-green",
  CANCELLED: "badge-red",
}

interface AdminOrderRowProps {
  order: {
    id: string
    status: string
    trackingNumber: string | null
    shippingAddress: string
    quantity: number
    unitPrice: number
    shippingPrice: number
    createdAt: Date
    buyer: { username: string; name: string }
    listing: { figure: { name: string; series: string } }
  }
}

export default function AdminOrderRow({ order }: AdminOrderRowProps) {
  const router = useRouter()
  const [status, setStatus] = useState(order.status)
  const [tracking, setTracking] = useState(order.trackingNumber || "")
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const total = (order.unitPrice * order.quantity + order.shippingPrice) / 100

  const handleSave = async () => {
    setSaving(true)
    try {
      await fetch(`/api/orders/${order.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, trackingNumber: tracking || null }),
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
      router.refresh()
    } finally {
      setSaving(false)
    }
  }

  return (
    <tr className="hover:bg-[#0a0a12] transition-colors">
      <td className="px-4 py-3 font-mono text-xs text-slate-500">
        {order.id.slice(0, 8)}...
      </td>
      <td className="px-4 py-3">
        <p className="text-slate-200 text-sm">{order.buyer.name}</p>
        <p className="text-xs text-slate-500">@{order.buyer.username}</p>
      </td>
      <td className="px-4 py-3">
        <p className="text-slate-200 text-sm truncate max-w-[150px]">{order.listing.figure.name}</p>
        <p className="text-xs text-slate-500">Qty: {order.quantity}</p>
      </td>
      <td className="px-4 py-3 text-violet-400 font-medium text-sm">
        ${total.toFixed(2)}
      </td>
      <td className="px-4 py-3">
        <p className="text-xs text-slate-400 max-w-[150px] truncate" title={order.shippingAddress}>
          {order.shippingAddress}
        </p>
      </td>
      <td className="px-4 py-3">
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="bg-[#0a0a12] border border-[#1a1a3a] text-slate-200 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-violet-700"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>{s}</option>
          ))}
        </select>
        <div className="mt-1">
          <span className={`badge ${statusBadge[order.status] || "badge-violet"} text-[10px]`}>
            Current: {order.status}
          </span>
        </div>
      </td>
      <td className="px-4 py-3">
        <input
          type="text"
          placeholder="Tracking #"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          className="bg-[#0a0a12] border border-[#1a1a3a] text-slate-200 text-xs rounded-md px-2 py-1.5 focus:outline-none focus:border-violet-700 w-32"
        />
      </td>
      <td className="px-4 py-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className={`text-xs px-3 py-1.5 rounded-md font-medium transition-all ${
            saved
              ? "bg-emerald-900/30 text-emerald-400 border border-emerald-800/50"
              : "bg-violet-900/30 text-violet-300 border border-violet-800/50 hover:bg-violet-900/50"
          }`}
        >
          {saving ? "..." : saved ? "Saved ✓" : "Update"}
        </button>
      </td>
    </tr>
  )
}

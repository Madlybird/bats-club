import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { redirect } from "next/navigation"
import Link from "next/link"

const NAV_ITEMS = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/listings", label: "Listings", icon: "📦" },
  { href: "/admin/orders", label: "Orders", icon: "🛒" },
  { href: "/admin/import", label: "Import CSV", icon: "📥" },
  { href: "/admin/articles", label: "Articles", icon: "📝" },
]

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)

  if (!session || !session.user.isAdmin) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-[#080810] flex">
      {/* Sidebar */}
      <aside className="w-56 flex-shrink-0 bg-[#0a0a12] border-r border-[#1a1a3a] flex flex-col">
        <div className="p-5 border-b border-[#1a1a3a]">
          <Link href="/admin" className="flex items-center gap-2">
            <span className="text-lg">🦇</span>
            <div>
              <p className="text-xs font-bold text-violet-400 tracking-wider">BATS CLUB</p>
              <p className="text-[10px] text-slate-600 uppercase tracking-wider">Admin Panel</p>
            </div>
          </Link>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-[#1a1a3a] transition-all group"
            >
              <span className="text-base">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-[#1a1a3a]">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-violet-700 to-pink-700 flex items-center justify-center text-white text-xs font-bold">
              {session.user.name?.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-medium text-slate-300 truncate">{session.user.name}</p>
              <p className="text-[10px] text-slate-600 truncate">@{session.user.username}</p>
            </div>
          </div>
          <Link
            href="/"
            className="mt-3 block text-xs text-slate-500 hover:text-violet-400 transition-colors"
          >
            ← Back to site
          </Link>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  )
}

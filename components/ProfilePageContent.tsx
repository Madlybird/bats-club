import Image from "next/image"
import Link from "next/link"
import BatsOverlay from "@/components/BatsOverlay"
import ScrollReveal from "@/components/ScrollReveal"
import ShareButtons from "@/components/ShareButtons"
import type { Dict } from "@/lib/dict"

interface UserFigure {
  id: string
  figure: {
    id: string
    name: string
    series: string
    character: string
    imageUrl: string | null
    scale: string
    manufacturer: string
  }
}

interface Props {
  user: {
    name: string
    username: string
    avatar?: string | null
    bio?: string | null
    isAdmin: boolean
    createdAt: Date | string
  }
  have: UserFigure[]
  wishlist: UserFigure[]
  buying: UserFigure[]
  dict: Dict
  archiveHref: string
  isOwner?: boolean
}

export default function ProfilePageContent({
  user,
  have,
  wishlist,
  buying,
  dict,
  archiveHref,
  isOwner = false,
}: Props) {
  const memberSince = new Date(user.createdAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
  })

  return (
    <div className="relative min-h-screen">
      <BatsOverlay />

      <div className="absolute top-1/4 right-1/3 w-[600px] h-[600px] rounded-full bg-[#ff2d78]/5 blur-[180px] pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-purple-900/6 blur-[120px] pointer-events-none" />
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.6) 1px, transparent 1px)",
          backgroundSize: "40px 40px",
        }}
      />

      <div className="relative">
        {/* Profile Header */}
        <ScrollReveal>
          <div className="border-b border-white/[0.05]">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
              <div className="flex flex-col md:flex-row items-start md:items-center gap-6">
                {/* Avatar */}
                <div className="flex-shrink-0 flex flex-col items-center gap-2">
                  <div className="relative">
                    {user.avatar ? (
                      <Image
                        src={user.avatar}
                        alt={user.name}
                        width={96}
                        height={96}
                        className="rounded-full border-2 border-[#ff2d78]/60"
                      />
                    ) : (
                      <div
                        className="w-24 h-24 rounded-full flex items-center justify-center text-4xl font-black text-white border-2 border-[#ff2d78]/60"
                        style={{ background: "#000000" }}
                      >
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    {user.isAdmin && (
                      <span className="absolute -bottom-1 -right-1 badge badge-pink text-[9px]">Admin</span>
                    )}
                  </div>
                  {!user.avatar && (
                    <Link
                      href={archiveHref}
                      className="text-xs font-bold px-3 py-1.5 rounded-full text-white transition-opacity hover:opacity-80"
                      style={{ backgroundColor: "#ff2d78" }}
                    >
                      {dict.profile_explore_archive}
                    </Link>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <h1 className="text-3xl font-black text-white">{user.name}</h1>
                  <p className="text-white/30 mt-0.5">@{user.username}</p>
                  {user.bio && (
                    <p className="text-white/50 mt-2 max-w-lg text-sm leading-relaxed">{user.bio}</p>
                  )}
                  <p className="text-xs text-white/20 mt-2">
                    {dict.profile_member_since} {memberSince}
                  </p>
                  <div className="flex items-center gap-3 mt-3 flex-wrap">
                    <ShareButtons
                      name={`${user.username}'s anime figure collection`}
                      label={dict.share_label}
                    />
                    {isOwner && (
                      <Link
                        href={`/profile/${user.username}/edit`}
                        className="text-xs font-medium px-3 py-1.5 rounded-lg border border-white/[0.08] text-white/40 hover:text-white hover:border-white/20 transition-all"
                      >
                        Edit profile
                      </Link>
                    )}
                  </div>
                </div>

                {/* Stats */}
                <div className="flex gap-6 flex-wrap w-full md:w-auto">
                  <div className="text-center">
                    <p className="text-2xl font-black" style={{ color: "#ff2d78" }}>{have.length}</p>
                    <p className="text-xs text-white/30">{dict.profile_collection}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black" style={{ color: "#ff2d78" }}>{wishlist.length}</p>
                    <p className="text-xs text-white/30">{dict.profile_wishlist}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-black" style={{ color: "#ff2d78" }}>{buying.length}</p>
                    <p className="text-xs text-white/30">{dict.profile_buying}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </ScrollReveal>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-12">
          <FigureSection title={dict.profile_collection} subtitle={dict.profile_figures_owned} items={have} emptyLabel={dict.profile_section_empty} />
          <FigureSection title={`${dict.profile_wishlist} ❤️`} subtitle={dict.profile_figures_want} items={wishlist} emptyLabel={dict.profile_section_empty} />
          <FigureSection title={dict.profile_buying} subtitle={dict.profile_figures_buy} items={buying} emptyLabel={dict.profile_section_empty} />

          {have.length === 0 && wishlist.length === 0 && buying.length === 0 && (
            <div className="text-center py-20">
              <span className="text-5xl mb-4 block opacity-20">🦇</span>
              <p className="text-white/40 text-lg">{dict.profile_no_figures}</p>
              <Link
                href={archiveHref}
                className="inline-block mt-4 px-6 py-2.5 text-sm font-bold text-white rounded-full transition-all"
                style={{ background: "#ff2d78" }}
              >
                {dict.profile_browse_archive}
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function FigureSection({
  title,
  subtitle,
  items,
  emptyLabel,
}: {
  title: string
  subtitle: string
  items: UserFigure[]
  emptyLabel?: string
}) {
  if (items.length === 0) {
    if (!emptyLabel) return null
    return (
      <ScrollReveal>
        <section>
          <div className="mb-3">
            <span className="inline-block w-8 h-px bg-[#ff2d78] mb-3" />
            <h2 className="text-xl font-black text-white lowercase tracking-tight">{title}</h2>
          </div>
          <p className="text-sm text-white/20 italic">{emptyLabel}</p>
        </section>
      </ScrollReveal>
    )
  }

  return (
    <ScrollReveal>
      <section>
        <div className="mb-5">
          <span className="inline-block w-8 h-px bg-[#ff2d78] mb-3" />
          <h2 className="text-xl font-black text-white lowercase tracking-tight">{title}</h2>
          <p className="text-sm text-white/25 mt-0.5">
            {subtitle} · {items.length} figure{items.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 xl:grid-cols-8 gap-3">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/figures/${item.figure.id}`}
              className="group overflow-hidden rounded-xl border border-white/[0.06] hover:border-[#ff2d78]/30 transition-all duration-200"
              style={{ background: "#0a0a0a" }}
            >
              <div className="relative aspect-square">
                {item.figure.imageUrl ? (
                  <Image
                    src={item.figure.imageUrl}
                    alt={item.figure.name}
                    fill
                    // Bypass Vercel image optimizer; load JPG
                    // straight from Supabase. Same fix as
                    // FigureCard / ListingCard.
                    unoptimized
                    className="object-cover object-top group-hover:scale-105 transition-transform duration-300"
                    sizes="120px"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl opacity-20">🦇</span>
                  </div>
                )}
              </div>
              <div className="p-2">
                <p className="text-xs font-medium text-white/70 line-clamp-2 leading-tight group-hover:text-[#ff2d78] transition-colors">
                  {item.figure.name}
                </p>
                <p className="text-[10px] text-white/25 mt-0.5">{item.figure.scale}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </ScrollReveal>
  )
}

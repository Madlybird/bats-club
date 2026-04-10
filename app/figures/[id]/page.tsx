import { supabaseAdmin } from "@/lib/supabase"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { notFound } from "next/navigation"
import FigureDetailContent from "@/components/FigureDetailContent"
import { en } from "@/lib/dict"
import { Metadata } from "next"

export const dynamicParams = true
export const dynamic = "force-dynamic"

interface Props { params: { id: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { data: figure } = await supabaseAdmin
    .from("figures")
    .select("name, character, series, manufacturer, scale")
    .eq("id", params.id)
    .single()
  if (!figure) return { title: "Figure Not Found" }
  return {
    title: `${figure.name} | Bats Club`,
    description: `${figure.character} from ${figure.series} — ${figure.manufacturer} ${figure.scale}`,
  }
}

export default async function FigureDetailPage({ params }: Props) {
  const session = await getServerSession(authOptions)

  const { data: figure } = await supabaseAdmin
    .from("figures")
    .select(`
      id, name, series, character, manufacturer, scale, year, sculptor, material,
      imageUrl:image_url, images, description, createdAt:created_at,
      user_figures(userId:user_id, status),
      listings(
        id, price, condition, stock, photos, description, active, createdAt:created_at,
        seller:users(id, name, username, avatar),
        figure:figures(id, name, series, scale, imageUrl:image_url)
      ),
      article_figures(
        article:articles(id, title, slug, excerpt, published, author:users(id, name, username, avatar))
      )
    `)
    .eq("id", params.id)
    .eq("listings.active", true)
    .order("price", { ascending: true, referencedTable: "listings" })
    .single()

  if (!figure) notFound()

  const userFigures = figure.user_figures || []
  const listings = (figure.listings || []) as any[]
  const articleFigures = figure.article_figures || []

  const userStatus = session
    ? (userFigures.find((uf: any) => uf.userId === session.user.id)?.status ?? null)
    : null

  const wishlistCount = userFigures.filter((uf: any) => uf.status === "WISHLIST").length
  const haveCount = userFigures.filter((uf: any) => uf.status === "HAVE").length
  const lowestPrice = listings.length > 0 ? Math.min(...listings.map((l: any) => l.price)) : null

  const publishedArticles = articleFigures
    .map((af: any) => af.article)
    .filter((a: any) => a && a.published)

  // Related figures: same series first, fill with same manufacturer
  const { data: seriesFigures } = await supabaseAdmin
    .from("figures")
    .select("id, name, series, imageUrl:image_url, images")
    .eq("series", figure.series)
    .neq("id", params.id)
    .limit(4)

  let relatedFigures = (seriesFigures || []) as any[]
  if (relatedFigures.length < 4) {
    const needed = 4 - relatedFigures.length
    const existingIds = [params.id, ...relatedFigures.map((f: any) => f.id)]
    const { data: mfgFigures } = await supabaseAdmin
      .from("figures")
      .select("id, name, series, imageUrl:image_url, images")
      .eq("manufacturer", figure.manufacturer)
      .neq("series", figure.series)
      .not("id", "in", `(${existingIds.join(",")})`)
      .limit(needed)
    relatedFigures = [...relatedFigures, ...(mfgFigures || [])]
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: figure.name,
    description: `Character: ${figure.character}, Series: ${figure.series}`,
    brand: { "@type": "Brand", name: figure.manufacturer },
    image: figure.imageUrl,
    additionalProperty: [
      { "@type": "PropertyValue", name: "Scale", value: figure.scale },
      { "@type": "PropertyValue", name: "Year", value: figure.year },
      { "@type": "PropertyValue", name: "Sculptor", value: figure.sculptor },
      { "@type": "PropertyValue", name: "Material", value: figure.material },
    ].filter((p) => p.value),
    offers: listings.map((l: any) => ({
      "@type": "Offer",
      price: l.price / 100,
      priceCurrency: "USD",
      availability: l.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      seller: { "@type": "Person", name: (l.seller as any)?.name },
    })),
  }

  return (
    <FigureDetailContent
      figure={{ ...(figure as any), userFigures, articleFigures } as any}
      publishedArticles={publishedArticles}
      relatedFigures={relatedFigures}
      userStatus={userStatus}
      wishlistCount={wishlistCount}
      haveCount={haveCount}
      lowestPrice={lowestPrice}
      convertedLowestPrice={null}
      jsonLd={jsonLd}
      dict={en}
      archiveHref="/archive"
    />
  )
}

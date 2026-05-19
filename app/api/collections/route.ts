import { NextResponse } from "next/server"
import { revalidatePath } from "next/cache"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"

function errorResponse(stage: string, error: any, status = 500) {
  const payload = {
    error: error?.message || "Request failed",
    stage,
    code: error?.code,
    details: error?.details,
    hint: error?.hint,
  }
  console.error(`[collections] ${stage} failed`, payload)
  return NextResponse.json(payload, { status })
}

// Missing-table guard: until migration 007 is applied the tables don't
// exist. Treat that as "no collections" instead of a hard error so the
// homepage and admin keep working.
function isMissingTable(error: any) {
  return /relation .* does not exist|Could not find the table|schema cache/i.test(
    error?.message ?? ""
  )
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

export async function GET() {
  const { data: collections, error } = await supabaseAdmin
    .from("collections")
    .select(
      `id, slug, nameEn:name_en, nameRu:name_ru, nameJp:name_jp,
       coverUrl:cover_url, position, active, createdAt:created_at,
       collection_figures(
         position,
         figure:figures(id, name, series, imageUrl:image_url)
       )`
    )
    .order("position", { ascending: true })

  if (error) {
    if (isMissingTable(error)) return NextResponse.json([])
    return errorResponse("list", error)
  }

  const result = (collections || []).map((c: any) => ({
    id: c.id,
    slug: c.slug,
    nameEn: c.nameEn,
    nameRu: c.nameRu,
    nameJp: c.nameJp,
    coverUrl: c.coverUrl,
    position: c.position,
    active: c.active,
    figures: (c.collection_figures || [])
      .slice()
      .sort((a: any, b: any) => a.position - b.position)
      .map((cf: any) => cf.figure)
      .filter(Boolean),
  }))

  return NextResponse.json(result)
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let stage = "parse-body"
  try {
    const { nameEn, nameRu, nameJp, slug, coverUrl, figureIds, active } =
      await req.json()

    if (!nameEn) {
      return NextResponse.json(
        { error: "English name is required" },
        { status: 400 }
      )
    }

    const finalSlug = (slug && slugify(String(slug))) || slugify(nameEn)
    if (!finalSlug) {
      return NextResponse.json({ error: "Could not derive slug" }, { status: 400 })
    }

    stage = "check-slug"
    const { data: existing, error: slugError } = await supabaseAdmin
      .from("collections")
      .select("id")
      .eq("slug", finalSlug)
      .maybeSingle()
    if (slugError && !isMissingTable(slugError)) return errorResponse(stage, slugError)
    if (existing) {
      return NextResponse.json({ error: "Slug already exists", stage }, { status: 409 })
    }

    stage = "max-position"
    const { data: last } = await supabaseAdmin
      .from("collections")
      .select("position")
      .order("position", { ascending: false })
      .limit(1)
      .maybeSingle()
    const nextPosition = (last?.position ?? -1) + 1

    stage = "insert"
    const { data: created, error: insertError } = await supabaseAdmin
      .from("collections")
      .insert({
        slug: finalSlug,
        name_en: nameEn,
        name_ru: nameRu || null,
        name_jp: nameJp || null,
        cover_url: coverUrl || null,
        position: nextPosition,
        active: active ?? true,
      })
      .select("id")
      .single()
    if (insertError || !created)
      return errorResponse(stage, insertError || new Error("insert returned no row"))

    if (Array.isArray(figureIds) && figureIds.length) {
      stage = "link-figures"
      const { error: linkError } = await supabaseAdmin
        .from("collection_figures")
        .insert(
          figureIds.map((fid: string, i: number) => ({
            collection_id: created.id,
            figure_id: fid,
            position: i,
          }))
        )
      if (linkError) return errorResponse(stage, linkError)
    }

    revalidatePath("/")
    revalidatePath("/ru")
    revalidatePath("/jp")

    return NextResponse.json({ id: created.id }, { status: 201 })
  } catch (error: any) {
    return errorResponse(stage, error)
  }
}

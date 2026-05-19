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
  console.error(`[collections/:id] ${stage} failed`, payload)
  return NextResponse.json(payload, { status })
}

function slugify(s: string) {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
}

function revalidateHome() {
  revalidatePath("/")
  revalidatePath("/ru")
  revalidatePath("/jp")
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const { data: c, error } = await supabaseAdmin
    .from("collections")
    .select(
      `id, slug, nameEn:name_en, nameRu:name_ru, nameJp:name_jp,
       coverUrl:cover_url, position, active,
       collection_figures(
         position,
         figure:figures(id, name, series, imageUrl:image_url)
       )`
    )
    .eq("id", params.id)
    .single()

  if (error) return errorResponse("fetch", error, 404)

  return NextResponse.json({
    id: c.id,
    slug: c.slug,
    nameEn: c.nameEn,
    nameRu: c.nameRu,
    nameJp: c.nameJp,
    coverUrl: c.coverUrl,
    position: c.position,
    active: c.active,
    figures: ((c as any).collection_figures || [])
      .slice()
      .sort((a: any, b: any) => a.position - b.position)
      .map((cf: any) => cf.figure)
      .filter(Boolean),
  })
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let stage = "parse-body"
  try {
    const body = await req.json()
    const { nameEn, nameRu, nameJp, slug, coverUrl, figureIds, active, position } =
      body

    const patch: Record<string, any> = {}
    if (nameEn !== undefined) {
      if (!nameEn)
        return NextResponse.json({ error: "English name is required" }, { status: 400 })
      patch.name_en = nameEn
    }
    if (nameRu !== undefined) patch.name_ru = nameRu || null
    if (nameJp !== undefined) patch.name_jp = nameJp || null
    if (coverUrl !== undefined) patch.cover_url = coverUrl || null
    if (active !== undefined) patch.active = !!active
    if (position !== undefined) patch.position = position
    if (slug !== undefined && slug) {
      const s = slugify(String(slug))
      stage = "check-slug"
      const { data: clash } = await supabaseAdmin
        .from("collections")
        .select("id")
        .eq("slug", s)
        .neq("id", params.id)
        .maybeSingle()
      if (clash)
        return NextResponse.json({ error: "Slug already exists" }, { status: 409 })
      patch.slug = s
    }

    if (Object.keys(patch).length) {
      stage = "update"
      const { error: updErr } = await supabaseAdmin
        .from("collections")
        .update(patch)
        .eq("id", params.id)
      if (updErr) return errorResponse(stage, updErr)
    }

    // Replace figure links when an explicit list is provided.
    if (Array.isArray(figureIds)) {
      stage = "clear-figures"
      const { error: delErr } = await supabaseAdmin
        .from("collection_figures")
        .delete()
        .eq("collection_id", params.id)
      if (delErr) return errorResponse(stage, delErr)

      if (figureIds.length) {
        stage = "link-figures"
        const { error: linkErr } = await supabaseAdmin
          .from("collection_figures")
          .insert(
            figureIds.map((fid: string, i: number) => ({
              collection_id: params.id,
              figure_id: fid,
              position: i,
            }))
          )
        if (linkErr) return errorResponse(stage, linkErr)
      }
    }

    revalidateHome()
    return NextResponse.json({ ok: true })
  } catch (error: any) {
    return errorResponse(stage, error)
  }
}

export async function DELETE(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  const { error } = await supabaseAdmin
    .from("collections")
    .delete()
    .eq("id", params.id)
  if (error) return errorResponse("delete", error)

  revalidateHome()
  return NextResponse.json({ ok: true })
}

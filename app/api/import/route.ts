import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { supabaseAdmin } from "@/lib/supabase"
import { parse } from "csv-parse/sync"
import { slugify } from "@/lib/slug"

interface CsvRow {
  name: string
  series: string
  character: string
  manufacturer: string
  scale: string
  year: string
  sculptor?: string
  material?: string
  imageUrl?: string
  description?: string
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  try {
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    const text = await file.text()

    const rows: CsvRow[] = parse(text, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    })

    const required = ["name", "series", "character", "manufacturer", "scale", "year"]
    let imported = 0
    const errors: string[] = []

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i]
      const rowNum = i + 2 // +2 for header row + 1-indexed

      const missing = required.filter((f) => !row[f as keyof CsvRow])
      if (missing.length > 0) {
        errors.push(`Row ${rowNum}: Missing required fields: ${missing.join(", ")}`)
        continue
      }

      const year = parseInt(row.year)
      if (isNaN(year) || year < 1990 || year > new Date().getFullYear() + 2) {
        errors.push(`Row ${rowNum}: Invalid year "${row.year}"`)
        continue
      }

      const base = slugify(row.name) || "figure"
      let slug = base
      let attempt = 1
      let inserted = false
      let lastErrorMsg = ""
      while (!inserted && attempt < 10000) {
        const { error } = await supabaseAdmin.from("figures").insert({
          name: row.name,
          slug,
          series: row.series,
          character: row.character,
          manufacturer: row.manufacturer,
          scale: row.scale,
          year,
          sculptor: row.sculptor || null,
          material: row.material || null,
          image_url: row.imageUrl || null,
          description: row.description || null,
        })
        if (!error) { inserted = true; break }
        lastErrorMsg = error.message
        // Unique-violation on slug → append suffix and retry.
        if (error.code === "23505" && /slug/i.test(error.message)) {
          slug = `${base}-${attempt}`
          attempt++
          continue
        }
        break
      }

      if (!inserted) {
        errors.push(`Row ${rowNum}: Database error — ${lastErrorMsg}`)
      } else {
        imported++
      }
    }

    return NextResponse.json({
      total: rows.length,
      imported,
      failed: rows.length - imported,
      errors,
    })
  } catch (error) {
    console.error("CSV import error:", error)
    return NextResponse.json({ error: "Failed to parse CSV file" }, { status: 500 })
  }
}

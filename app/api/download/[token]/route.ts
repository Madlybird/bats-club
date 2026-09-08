import { NextResponse } from "next/server"
import { supabaseAdmin } from "@/lib/supabase"
import { checkRateLimit } from "@/lib/rate-limit"

// Tokened download for a purchased digital art PDF. The token (minted by the
// Stripe webhook, 7-day expiry) is the only credential — it gates a short-lived
// signed URL to the private `art-files` bucket, which actually serves the file.
const MAX_DOWNLOADS = 25 // soft cap so a leaked link can't serve unlimited traffic

export async function GET(req: Request, ctx: { params: Promise<{ token: string }> }) {
  const limited = checkRateLimit(req, "download", 30, 5 * 60 * 1000)
  if (limited) return limited

  const { token } = await ctx.params
  if (!token || token.length < 20) {
    return NextResponse.json({ error: "Invalid link." }, { status: 400 })
  }

  const { data: row, error } = await supabaseAdmin
    .from("digital_downloads")
    .select("token, file_path, file_name, download_count, expires_at")
    .eq("token", token)
    .maybeSingle()

  if (error) {
    console.error("[download] lookup failed:", error)
    return NextResponse.json({ error: "Something went wrong." }, { status: 500 })
  }
  if (!row) {
    return NextResponse.json({ error: "This download link is not valid." }, { status: 404 })
  }
  if (new Date(row.expires_at).getTime() < Date.now()) {
    return NextResponse.json(
      { error: "This download link has expired. Contact support@batsclub.com." },
      { status: 410 },
    )
  }
  if (row.download_count >= MAX_DOWNLOADS) {
    return NextResponse.json(
      { error: "Download limit reached. Contact support@batsclub.com." },
      { status: 429 },
    )
  }

  const { data: signed, error: signErr } = await supabaseAdmin.storage
    .from("art-files")
    .createSignedUrl(row.file_path, 60, { download: row.file_name || true })

  if (signErr || !signed?.signedUrl) {
    console.error("[download] sign failed:", signErr)
    return NextResponse.json({ error: "File unavailable. Contact support@batsclub.com." }, { status: 500 })
  }

  await supabaseAdmin
    .from("digital_downloads")
    .update({ download_count: row.download_count + 1 })
    .eq("token", token)

  return NextResponse.redirect(signed.signedUrl, 302)
}

import "dotenv/config"
import TelegramBot from "node-telegram-bot-api"
import { createClient } from "@supabase/supabase-js"
import https from "https"
import { Buffer } from "buffer"

// ── Clients ──────────────────────────────────────────────────────────────────

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Config ────────────────────────────────────────────────────────────────────

const ADMIN_IDS = process.env.ADMIN_TELEGRAM_IDS
  ? process.env.ADMIN_TELEGRAM_IDS.split(",").map((id) => parseInt(id.trim(), 10))
  : []

const CONDITIONS = ["Mint", "Near Mint", "Good", "Fair", "Poor"]

const FIGURE_FIELDS = ["name", "series", "character", "manufacturer", "scale", "year", "material", "description"]
const REQUIRED_FIGURE_FIELDS = ["name", "series", "character", "manufacturer", "scale"]

const DATA_TEMPLATE =
  "📝 *Fill in the figure data and send it back in this format* (required: Name, Series, Character, Manufacturer, Scale):\n\n" +
  "```\n" +
  "Name: \n" +
  "Series: \n" +
  "Character: \n" +
  "Manufacturer: \n" +
  "Scale: \n" +
  "Year: \n" +
  "Material: \n" +
  "Description: \n" +
  "```"

const ADMIN_SELLER_ID = "28cc57d7-86c7-4d63-ac20-e9b1b9718773"

// ── Art section ───────────────────────────────────────────────────────────────
// Original art by SINBIOX. Separate `art` table; the sellable row is a
// `listings` row with art_id set (figure_id null). Never touches `figures`.
const ART_TYPES = ["Poster", "Digital Print", "Postcard", "Sticker", "Canvas", "Zine"]
const ART_FIELDS = ["title", "size", "series", "year", "material", "edition", "description"]
const ART_REQUIRED_FIELDS = ["title", "size", "description"]
const ART_DATA_TEMPLATE =
  "📝 *Fill in the art data and send it back* (required: Title, Size, Description):\n\n" +
  "```\n" +
  "Title: \n" +
  "Size: \n" +
  "Series: \n" +
  "Year: \n" +
  "Material: \n" +
  "Edition: \n" +
  "Description: \n" +
  "```"

// Steps during which the photo handler should buffer incoming photos
// (as opposed to rejecting them because another flow is in progress).
const PHOTO_COLLECT_STEPS = [
  "collecting_photos",
  "editing_photos",
  "choosing_category",
  "art_collecting_photos",
  "art_editing_photos",
]

const UUID_RE = /[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}/

// Pulls a listing id out of a pasted batsclub.com/shop/<id> link (any
// locale prefix) or a bare UUID.
function extractListingId(text) {
  const match = text.match(UUID_RE)
  return match ? match[0] : null
}

// Pulls the slug out of a pasted batsclub.com/figures/<slug> archive link
// (any locale prefix). Figure detail pages use slugs, not UUIDs, so this is
// the fallback when extractListingId() finds nothing.
function extractFigureSlug(text) {
  const match = text.match(/figures\/([a-z0-9-]+)/i)
  return match ? match[1] : null
}

// Pulls the listing id out of a pasted batsclub.com/art/<id> link (any locale
// prefix). Returns null if the text isn't an /art/ link — a bare UUID is
// deliberately NOT treated as an art id (that path stays the figure/listing
// flow); only an explicit /art/ link routes here.
function extractArtListingId(text) {
  const match = text.match(/\/art\/([0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12})/)
  return match ? match[1] : null
}

function slugify(input) {
  return String(input)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
}

async function uniqueSlugForName(name) {
  const base = slugify(name) || "figure"
  const { data: collisions } = await supabase
    .from("figures")
    .select("slug")
    .or(`slug.eq.${base},slug.like.${base}-%`)
  const taken = new Set(((collisions || [])).map((r) => r.slug))
  if (!taken.has(base)) return base
  for (let i = 1; i < 10000; i++) {
    const candidate = `${base}-${i}`
    if (!taken.has(candidate)) return candidate
  }
  return `${base}-${Date.now()}`
}

// ── State machine ─────────────────────────────────────────────────────────────
// Per-user state:
// {
//   step: "idle"
//       | "collecting_photos"       — photo(s) received, collecting up to 10, waiting DONE
//       | "awaiting_data"           — photos done, waiting for filled-in template
//       | "awaiting_confirmation"   — data filled in, waiting YES/corrections
//       | "awaiting_shop"           — data confirmed, asking about listing
//       | "awaiting_condition",     — price set, asking for condition
//   figureData: { name, series, character, manufacturer, scale, year, material, description },
//   photoBuffers: Buffer[],         — all collected photo buffers (index 0 = cover)
//   price: number,                  — price in cents (set in awaiting_shop step)
// }

const userState = new Map()

function getState(userId) {
  return userState.get(userId) || { step: "idle" }
}

function setState(userId, state) {
  userState.set(userId, state)
}

function resetState(userId) {
  userState.delete(userId)
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function isAdmin(userId) {
  return ADMIN_IDS.length > 0 && ADMIN_IDS.includes(userId)
}

async function downloadFile(fileId) {
  const fileInfo = await bot.getFile(fileId)
  const fileUrl = `https://api.telegram.org/file/bot${process.env.TELEGRAM_BOT_TOKEN}/${fileInfo.file_path}`

  return new Promise((resolve, reject) => {
    https.get(fileUrl, (res) => {
      const chunks = []
      res.on("data", (chunk) => chunks.push(chunk))
      res.on("end", () => resolve(Buffer.concat(chunks)))
      res.on("error", reject)
    })
  })
}

// Parses a "Label: value" per-line template into a figureData object.
// Unknown labels are ignored; recognized fields overwrite `base` (if given, for corrections).
function parseFigureTemplate(text, base = {}) {
  const data = { ...base }
  const lines = text.split(/\r?\n/)

  for (const line of lines) {
    const match = line.match(/^\s*([A-Za-z]+)\s*:\s*(.*)$/)
    if (!match) continue
    const label = match[1].toLowerCase()
    const value = match[2].trim()
    if (!FIGURE_FIELDS.includes(label)) continue
    if (!value) continue
    data[label] = label === "year" ? parseYear(value) : value
  }

  const missing = REQUIRED_FIGURE_FIELDS.filter((f) => !data[f])
  return { data, missing }
}

// Same "Label: value" parser as parseFigureTemplate but for the art template.
function parseArtTemplate(text, base = {}) {
  const data = { ...base }
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Za-z]+)\s*:\s*(.*)$/)
    if (!match) continue
    const label = match[1].toLowerCase()
    const value = match[2].trim()
    if (!ART_FIELDS.includes(label)) continue
    if (!value) continue
    data[label] = label === "year" ? parseYear(value) : value
  }
  const missing = ART_REQUIRED_FIELDS.filter((f) => !data[f])
  return { data, missing }
}

function parseYear(raw) {
  if (raw === null || raw === undefined) return null
  const n = typeof raw === "number" ? raw : parseInt(raw)
  if (!isNaN(n) && n >= 1900 && n <= new Date().getFullYear() + 2) return n

  const s = String(raw).toLowerCase().trim()
  const decadeMatch = s.match(/(early|mid|late)\s+(\d{4})s?/)
  if (decadeMatch) {
    const decade = parseInt(decadeMatch[2])
    if (decadeMatch[1] === "early") return decade
    if (decadeMatch[1] === "mid")   return decade + 5
    if (decadeMatch[1] === "late")  return decade + 7
  }
  return null
}

async function uploadToSupabase(imageBuffer, figureName, index, bucket = "figures") {
  const slug = slugify(figureName)
  const timestamp = Date.now()
  const suffix = index > 0 ? `-${index}` : ""
  const fileName = `${slug}-${timestamp}${suffix}.jpg`

  const { error } = await supabase.storage
    .from(bucket)
    .upload(fileName, imageBuffer, { contentType: "image/jpeg", upsert: false })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabase.storage.from(bucket).getPublicUrl(fileName)
  return data.publicUrl
}

async function uploadAllPhotos(photoBuffers, figureName, bucket = "figures") {
  const urls = []
  for (let i = 0; i < photoBuffers.length; i++) {
    const url = await uploadToSupabase(photoBuffers[i], figureName, i, bucket)
    urls.push(url)
  }
  return urls // index 0 = cover photo
}

async function saveFigure(figureData, imageUrls) {
  const coverUrl = imageUrls[0]
  const base = {
    name: figureData.name,
    series: figureData.series,
    character: figureData.character,
    manufacturer: figureData.manufacturer,
    scale: figureData.scale,
    year: figureData.year,
    material: figureData.material || null,
    description: figureData.description || null,
    image_url: coverUrl,
    images: imageUrls,
  }

  // Probe whether the slug column exists before including it.
  const probe = await supabase.from("figures").select("slug").limit(1)
  if (!probe.error) {
    const slug = await uniqueSlugForName(figureData.name)
    const { data, error } = await supabase
      .from("figures")
      .insert({ ...base, slug })
      .select("id, slug, name")
      .single()
    if (error) throw new Error(`DB insert failed: ${error.message}`)
    return data
  }

  const { data, error } = await supabase
    .from("figures")
    .insert(base)
    .select("id, name")
    .single()
  if (error) throw new Error(`DB insert failed: ${error.message}`)
  return data
}

// Reactivates a prior soft-deleted listing for this figure if one exists
// (keeps its id/photos stable instead of piling up duplicate rows every
// time a figure gets delisted and relisted), otherwise inserts fresh.
//
// Never reactivates a listing that has real orders attached — the Stripe
// webhook only ever sets stock=0/active=false on a sold-out listing, it
// never deletes the row, so "most recent listing for this figure" can be
// a completed sale. Overwriting its price/condition/stock in place would
// silently rewrite that listing id's identity out from under any order,
// receipt, or indexed page still pointing at it. Same protection
// deleteFigureAndListings already applies before deleting.
async function createListing(figureId, priceCents, condition) {
  const { data: existing, error: findErr } = await supabase
    .from("listings")
    .select("id")
    .eq("figure_id", figureId)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle()
  if (findErr) throw new Error(`Listing lookup failed: ${findErr.message}`)

  if (existing) {
    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("id")
      .eq("listing_id", existing.id)
      .limit(1)
    if (ordersErr) throw new Error(`Order lookup failed: ${ordersErr.message}`)

    if (!orders || orders.length === 0) {
      const { error } = await supabase
        .from("listings")
        .update({ price: priceCents, condition, stock: 1, active: true })
        .eq("id", existing.id)
      if (error) throw new Error(`Listing reactivate failed: ${error.message}`)
      return
    }
    // existing listing has order history — fall through to insert a fresh row.
  }

  const { error } = await supabase.from("listings").insert({
    figure_id: figureId,
    seller_id: ADMIN_SELLER_ID,
    price: priceCents,
    condition,
    stock: 1,
    active: true,
  })
  if (error) throw new Error(`Listing insert failed: ${error.message}`)
}

// Hard-deletes a figure and all of its listings (archive + shop). Refuses if
// any listing has real orders attached — those are financial/shipping
// records tied to the live Stripe store and must never be silently dropped.
async function deleteFigureAndListings(figureId) {
  const { data: listings, error: listingsErr } = await supabase
    .from("listings")
    .select("id")
    .eq("figure_id", figureId)
  if (listingsErr) throw new Error(`Lookup failed: ${listingsErr.message}`)

  const listingIds = (listings || []).map((l) => l.id)

  if (listingIds.length > 0) {
    const { data: orders, error: ordersErr } = await supabase
      .from("orders")
      .select("id")
      .in("listing_id", listingIds)
    if (ordersErr) throw new Error(`Order lookup failed: ${ordersErr.message}`)
    if (orders && orders.length > 0) {
      throw new Error(
        `Cannot delete — ${orders.length} order(s) exist for this listing. Refusing to delete order history.`
      )
    }

    const { error: delListingsErr } = await supabase.from("listings").delete().in("id", listingIds)
    if (delListingsErr) throw new Error(`Failed to delete listing(s): ${delListingsErr.message}`)
  }

  const { error: delFigureErr } = await supabase.from("figures").delete().eq("id", figureId)
  if (delFigureErr) throw new Error(`Failed to delete figure: ${delFigureErr.message}`)

  return revalidateSite({ figureId })
}

// ── Art writes ────────────────────────────────────────────────────────────────

async function saveArt(artData) {
  const row = {
    title: artData.title,
    artist: "SINBIOX",
    type: artData.type,
    series: artData.series || null,
    year: artData.year ?? null,
    size: artData.size,
    material: artData.material || null,
    edition: artData.edition || null,
    description: artData.description || null,
    is_mature: !!artData.isMature,
    is_digital: !!artData.isDigital,
    file_path: artData.filePath || null,
    file_name: artData.fileName || null,
  }
  const { data, error } = await supabase.from("art").insert(row).select("id, title").single()
  if (error) throw new Error(`Art insert failed: ${error.message}`)
  return data
}

// 1 art piece = 1 listing. condition is always "New" for art.
async function createArtListing(artId, priceCents, stock, photos) {
  const { data, error } = await supabase
    .from("listings")
    .insert({
      art_id: artId,
      seller_id: ADMIN_SELLER_ID,
      price: priceCents,
      condition: "New",
      stock,
      photos,
      active: true,
    })
    .select("id")
    .single()
  if (error) throw new Error(`Art listing insert failed: ${error.message}`)
  return data.id
}

// Hard-deletes an art piece and its listing. Refuses if the listing has real
// orders attached (same protection as deleteFigureAndListings).
async function deleteArtAndListing(listingId) {
  const { data: listing, error: findErr } = await supabase
    .from("listings")
    .select("id, art_id")
    .eq("id", listingId)
    .maybeSingle()
  if (findErr) throw new Error(`Lookup failed: ${findErr.message}`)
  if (!listing || !listing.art_id) throw new Error("Not an art listing.")

  const { data: orders, error: ordersErr } = await supabase
    .from("orders")
    .select("id")
    .eq("listing_id", listingId)
    .limit(1)
  if (ordersErr) throw new Error(`Order lookup failed: ${ordersErr.message}`)
  if (orders && orders.length > 0) {
    throw new Error(
      `Cannot delete — order(s) exist for this listing. Refusing to delete order history.`
    )
  }

  const { error: delListingErr } = await supabase.from("listings").delete().eq("id", listingId)
  if (delListingErr) throw new Error(`Failed to delete listing: ${delListingErr.message}`)

  const { error: delArtErr } = await supabase.from("art").delete().eq("id", listing.art_id)
  if (delArtErr) throw new Error(`Failed to delete art: ${delArtErr.message}`)

  return revalidateSite({ artId: listing.art_id })
}

// Bypasses the site's ISR cache on /figures/[slug] (and the archive/shop
// listing pages) right after a direct-Supabase write, since the bot has no
// admin session to trigger Next.js's normal revalidatePath() call.
//
// Retries on failure (this machine has seen transient DNS/network blips —
// see old ENOTFOUND entries in bot.log) since a swallowed failure here used
// to mean the live site silently sat on stale data for up to 24h with no
// indication anything was wrong. Returns true/false so callers can warn the
// admin in the chat reply instead of failing silently.
async function revalidateSite(body, attempts = 3) {
  if (!process.env.REVALIDATE_SECRET || !process.env.SITE_URL) {
    console.error("Revalidate skipped: REVALIDATE_SECRET or SITE_URL not set")
    return false
  }
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(`${process.env.SITE_URL}/api/admin/revalidate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-revalidate-secret": process.env.REVALIDATE_SECRET,
        },
        body: JSON.stringify(body),
      })
      if (res.ok) return true
      console.error("Revalidate call failed:", res.status, await res.text())
    } catch (err) {
      console.error("Revalidate call error:", err)
    }
    if (i < attempts - 1) await new Promise((r) => setTimeout(r, 1000 * (i + 1)))
  }
  return false
}

const REVALIDATE_WARNING =
  "\n\n⚠️ Live site cache refresh failed after 3 tries — the page may show stale data for a while. Try again shortly, or ping me to retry."

function formatFigureData(d) {
  return (
    `📦 *Figure data extracted:*\n\n` +
    `*Name:* ${d.name}\n` +
    `*Series:* ${d.series}\n` +
    `*Character:* ${d.character}\n` +
    `*Manufacturer:* ${d.manufacturer}\n` +
    `*Scale:* ${d.scale}\n` +
    `*Year:* ${d.year ?? "Unknown"}\n` +
    `*Material:* ${d.material || "Unknown"}\n` +
    `*Description:* ${d.description || "—"}\n\n` +
    `Is this correct? Reply *YES* to confirm, or send corrected lines in \`Label: value\` format (e.g. \`Year: 2019\`).`
  )
}

async function finalize(chatId, userId, state) {
  await bot.sendMessage(chatId, "⏳ Uploading and saving figure...")
  const imageUrls = await uploadAllPhotos(state.photoBuffers, state.figureData.name)
  const figure = await saveFigure(state.figureData, imageUrls)
  return figure
}

function formatArtData(d) {
  return (
    `🖼️ *Art data extracted:*\n\n` +
    `*Title:* ${d.title}\n` +
    `*Type:* ${d.type}${d.isDigital ? " · 💾 digital (PDF)" : ""}\n` +
    (d.isDigital ? `*File:* ${d.fileName || "—"}\n` : "") +
    `*Size:* ${d.size}\n` +
    `*Series:* ${d.series || "—"}\n` +
    `*Year:* ${d.year ?? "—"}\n` +
    `*Material:* ${d.material || "—"}\n` +
    `*Edition:* ${d.edition || "—"}\n` +
    `*Description:* ${d.description || "—"}\n\n` +
    `Is this correct? Reply *YES* to confirm, or send corrected lines in \`Label: value\` format.`
  )
}

async function finalizeArt(chatId, state) {
  await bot.sendMessage(chatId, "⏳ Uploading and saving art...")
  const photos = await uploadAllPhotos(state.photoBuffers, state.artData.title, "art")
  const art = await saveArt(state.artData)
  // Digital pieces have unlimited copies → stock null.
  const stock = state.artData.isDigital ? null : state.stock
  const listingId = await createArtListing(art.id, state.price, stock, photos)
  return { art, listingId }
}

const DIGITAL_KEYBOARD = {
  reply_markup: {
    inline_keyboard: [[
      { text: "💾 Digital (PDF)", callback_data: "artdigital:yes" },
      { text: "📦 Physical", callback_data: "artdigital:no" },
    ]],
  },
}

// Downloads a Telegram document and puts it in the private art-files bucket.
async function uploadArtFile(fileId, fileName) {
  const buf = await downloadFile(fileId)
  const safe = String(fileName || "file.pdf").replace(/[^a-zA-Z0-9._-]/g, "_")
  const key = `${Date.now()}-${safe}`
  const { error } = await supabase.storage
    .from("art-files")
    .upload(key, buf, { contentType: "application/pdf", upsert: false })
  if (error) throw new Error(`File upload failed: ${error.message}`)
  return { path: key, name: safe }
}

const ART_TYPE_KEYBOARD = {
  reply_markup: {
    inline_keyboard: [
      [ { text: "Poster", callback_data: "arttype:Poster" }, { text: "Digital Print", callback_data: "arttype:Digital Print" } ],
      [ { text: "Postcard", callback_data: "arttype:Postcard" }, { text: "Sticker", callback_data: "arttype:Sticker" } ],
      [ { text: "Canvas", callback_data: "arttype:Canvas" }, { text: "Zine", callback_data: "arttype:Zine" } ],
    ],
  },
}

const CATEGORY_KEYBOARD = {
  reply_markup: {
    inline_keyboard: [[
      { text: "📦 Figure", callback_data: "cat:figure" },
      { text: "🖼️ Art", callback_data: "cat:art" },
    ]],
  },
}

const MATURE_KEYBOARD = {
  reply_markup: {
    inline_keyboard: [[
      { text: "🔞 Yes, 18+", callback_data: "artmature:yes" },
      { text: "No", callback_data: "artmature:no" },
    ]],
  },
}

// ── Photo handler ─────────────────────────────────────────────────────────────

bot.on("photo", async (msg) => {
  const userId = msg.from.id
  const chatId = msg.chat.id

  if (!isAdmin(userId)) {
    return bot.sendMessage(chatId, "⛔ Access denied.")
  }

  const state = getState(userId)
  const bestPhoto = msg.photo[msg.photo.length - 1]

  if (state.step !== "idle" && !PHOTO_COLLECT_STEPS.includes(state.step)) {
    return bot.sendMessage(chatId, "⚠️ Please finish the current flow first, or send /cancel to restart.")
  }

  if (PHOTO_COLLECT_STEPS.includes(state.step) && state.photoBuffers.length >= 10) {
    return bot.sendMessage(chatId, "⚠️ Maximum 10 photos reached. Type *DONE* to continue.", { parse_mode: "Markdown" })
  }

  // First photo of a fresh flow: buffer it and ask which catalog it's for.
  // Claim "choosing_category" synchronously (before the async download) so an
  // album of photos doesn't race into starting several flows.
  const firstPhoto = state.step === "idle"
  if (firstPhoto) {
    setState(userId, { step: "choosing_category", photoBuffers: [] })
  }

  try {
    const buf = await downloadFile(bestPhoto.file_id)
    // Re-read state AFTER the async download to avoid a race condition when
    // multiple photos arrive quickly and interleave at the await point.
    const freshState = getState(userId)
    if (!PHOTO_COLLECT_STEPS.includes(freshState.step)) return
    const newBuffers = [...freshState.photoBuffers, buf]
    setState(userId, { ...freshState, photoBuffers: newBuffers })

    if (freshState.step === "choosing_category") {
      // Only prompt on the very first photo; extra album photos just buffer.
      if (newBuffers.length === 1) {
        return bot.sendMessage(
          chatId,
          "📸 Photo received. What are you adding?",
          CATEGORY_KEYBOARD
        )
      }
      return
    }

    const doneHint =
      freshState.step === "editing_photos"
        ? "Send more photos, or type *DONE* to save (replaces the listing's current photos)."
        : freshState.step === "art_editing_photos"
        ? "Send more photos, or type *DONE* to save (replaces the art's current photos)."
        : freshState.step === "art_collecting_photos"
        ? "Send more photos of this piece, or type *DONE* when finished."
        : "Send more photos of this figure, or type *DONE* when finished."
    return bot.sendMessage(
      chatId,
      `📸 Photo ${newBuffers.length} added *(up to ${10 - newBuffers.length} more)*. ${doneHint}`,
      { parse_mode: "Markdown" }
    )
  } catch (err) {
    console.error("Photo download error:", err)
    return bot.sendMessage(chatId, `❌ Error saving photo: ${err.message}`)
  }
})

// ── Document handler (digital art PDF) ────────────────────────────────────────

bot.on("document", async (msg) => {
  const userId = msg.from.id
  const chatId = msg.chat.id
  if (!isAdmin(userId)) return

  const state = getState(userId)
  if (state.step !== "art_awaiting_file" && state.step !== "art_awaiting_filename") {
    return bot.sendMessage(chatId, "⚠️ Not expecting a file right now. Send /cancel to restart.")
  }

  const doc = msg.document
  const size = doc.file_size || 0
  if (size > 20 * 1024 * 1024) {
    setState(userId, { ...state, step: "art_awaiting_filename" })
    return bot.sendMessage(
      chatId,
      "⚠️ That file is over 20 MB — Telegram won't let the bot download it.\n\nUpload it to the `art-files` bucket in the Supabase dashboard, then reply here with the *exact filename*.",
      { parse_mode: "Markdown" }
    )
  }

  try {
    await bot.sendMessage(chatId, "⏳ Saving file…")
    const { path, name } = await uploadArtFile(doc.file_id, doc.file_name || "art.pdf")
    setState(userId, {
      ...state,
      step: "art_awaiting_data",
      artData: { ...state.artData, filePath: path, fileName: name },
    })
    return bot.sendMessage(chatId, `✅ File saved (\`${name}\`).\n\n` + ART_DATA_TEMPLATE, { parse_mode: "Markdown" })
  } catch (err) {
    console.error("Art file upload error:", err)
    return bot.sendMessage(chatId, `❌ Failed to save file: ${err.message}`)
  }
})

// ── Callback queries (inline keyboards) ───────────────────────────────────────

bot.on("callback_query", async (query) => {
  const userId = query.from.id
  const chatId = query.message?.chat?.id
  const data = query.data || ""
  if (!isAdmin(userId) || !chatId) return bot.answerCallbackQuery(query.id)

  const state = getState(userId)

  try {
    // Category pick after the first photo.
    if (data === "cat:figure" && state.step === "choosing_category") {
      setState(userId, { step: "collecting_photos", photoBuffers: state.photoBuffers || [] })
      await bot.answerCallbackQuery(query.id, { text: "Figure" })
      const n = (state.photoBuffers || []).length
      return bot.sendMessage(
        chatId,
        `📦 *Figure.* ${n} photo${n === 1 ? "" : "s"} so far — send more, or type *DONE* when finished.`,
        { parse_mode: "Markdown" }
      )
    }
    if (data === "cat:art" && state.step === "choosing_category") {
      setState(userId, { step: "art_collecting_photos", photoBuffers: state.photoBuffers || [] })
      await bot.answerCallbackQuery(query.id, { text: "Art" })
      const n = (state.photoBuffers || []).length
      return bot.sendMessage(
        chatId,
        `🖼️ *Art.* ${n} photo${n === 1 ? "" : "s"} so far — send more, or type *DONE* when finished.`,
        { parse_mode: "Markdown" }
      )
    }

    // Art type pick → ask digital vs physical.
    if (data.startsWith("arttype:") && state.step === "art_choosing_type") {
      const type = data.slice("arttype:".length)
      if (!ART_TYPES.includes(type)) return bot.answerCallbackQuery(query.id)
      setState(userId, { ...state, step: "art_awaiting_digital", artData: { type } })
      await bot.answerCallbackQuery(query.id, { text: type })
      return bot.sendMessage(chatId, "💾 *Digital download* or *physical* item?", { parse_mode: "Markdown", ...DIGITAL_KEYBOARD })
    }

    // Digital vs physical pick.
    if (data.startsWith("artdigital:") && state.step === "art_awaiting_digital") {
      const isDigital = data === "artdigital:yes"
      if (isDigital) {
        setState(userId, { ...state, step: "art_awaiting_file", artData: { ...state.artData, isDigital: true } })
        await bot.answerCallbackQuery(query.id, { text: "Digital" })
        return bot.sendMessage(
          chatId,
          "📎 Send the *PDF* now as a *file / document* (not a photo).\n\nOver 20 MB? Upload it to the `art-files` bucket in Supabase and reply with the exact filename instead.",
          { parse_mode: "Markdown" }
        )
      }
      setState(userId, { ...state, step: "art_awaiting_data", artData: { ...state.artData, isDigital: false } })
      await bot.answerCallbackQuery(query.id, { text: "Physical" })
      return bot.sendMessage(chatId, ART_DATA_TEMPLATE, { parse_mode: "Markdown" })
    }

    // Mature pick → stock (physical) or straight to price (digital = unlimited).
    if (data.startsWith("artmature:") && state.step === "art_awaiting_mature") {
      const isMature = data === "artmature:yes"
      const nextData = { ...state.artData, isMature }
      await bot.answerCallbackQuery(query.id, { text: isMature ? "18+" : "No" })
      if (state.artData.isDigital) {
        setState(userId, { ...state, step: "art_awaiting_price", artData: nextData })
        return bot.sendMessage(chatId, "💰 *Price* in USD? Reply with a number (e.g. `12`).", { parse_mode: "Markdown" })
      }
      setState(userId, { ...state, step: "art_awaiting_stock", artData: nextData })
      return bot.sendMessage(chatId, "🔢 How many are *in stock*? Reply with a number.", { parse_mode: "Markdown" })
    }

    return bot.answerCallbackQuery(query.id)
  } catch (err) {
    console.error("callback_query error:", err)
    return bot.answerCallbackQuery(query.id, { text: "Error" })
  }
})

// ── Text handler ──────────────────────────────────────────────────────────────

bot.on("message", async (msg) => {
  const userId = msg.from.id
  const chatId = msg.chat.id
  const text = (msg.text || "").trim()

  if (!isAdmin(userId)) return

  // Commands
  if (text === "/start" || text === "/help") {
    return bot.sendMessage(
      chatId,
      "👋 *Bats Club Bot*\n\nSend up to 10 photos, then pick *📦 Figure* or *🖼️ Art*.\n\n" +
        "*Figure:* photos → *DONE* → data template → optional shop listing.\n" +
        "*Art:* photos → *DONE* → pick type → data template → 18+? → stock → price.\n\n" +
        "✏️ Paste a link to manage an existing item:\n" +
        "• `batsclub.com/shop/<id>` — figure listing: photos / `PRICE` / *DELETE*\n" +
        "• `batsclub.com/art/<id>` — art listing: photos / `PRICE` / `STOCK` / *DELETE*\n\n" +
        "/cancel — cancel current operation",
      { parse_mode: "Markdown" }
    )
  }

  if (text === "/cancel") {
    resetState(userId)
    return bot.sendMessage(chatId, "❌ Cancelled. Send a new photo to start over.")
  }

  if (!text || msg.photo) return

  const state = getState(userId)

  // Waiting on the category buttons — nudge if they type instead.
  if (state.step === "choosing_category") {
    return bot.sendMessage(chatId, "👆 Tap *📦 Figure* or *🖼️ Art* above, or /cancel.", { parse_mode: "Markdown" })
  }

  // ── Idle: pasted a shop/archive link or ID → start management flow ───────
  if (state.step === "idle") {
    // A batsclub.com/art/<id> link → manage that art listing.
    const artListingId = extractArtListingId(text)
    if (artListingId) {
      const { data, error } = await supabase
        .from("listings")
        .select("id, price, stock, photos, art_id, art:art(title)")
        .eq("id", artListingId)
        .maybeSingle()
      if (error || !data || !data.art_id) {
        return bot.sendMessage(chatId, "❌ Art listing not found. Check the link and try again.")
      }
      const art = Array.isArray(data.art) ? data.art[0] : data.art
      const artTitle = art?.title || "art"
      setState(userId, {
        step: "art_editing_photos",
        listingId: data.id,
        artId: data.art_id,
        artTitle,
        photoBuffers: [],
      })
      const photoCount = Array.isArray(data.photos) ? data.photos.length : 0
      return bot.sendMessage(
        chatId,
        `🖼️ *Managing "${artTitle}"*\n\n` +
          `Current: ${photoCount} photo${photoCount === 1 ? "" : "s"} · $${(data.price / 100).toFixed(2)} · stock ${data.stock}\n\n` +
          `• Send new photos (up to 10), then *DONE* — replace photos\n` +
          `• \`PRICE <amount>\` — change price\n` +
          `• \`STOCK <number>\` — change stock\n` +
          `• *DELETE* — permanently remove from /art\n\n` +
          `Or /cancel.`,
        { parse_mode: "Markdown" }
      )
    }

    const listingId = extractListingId(text)
    const figureSlug = extractFigureSlug(text)
    if (!listingId && !figureSlug) return // not a link/ID at all — ignore

    let listing = null
    let figureId = null
    let figureName = null

    if (listingId) {
      const { data, error } = await supabase
        .from("listings")
        .select("id, price, photos, figure_id, figure:figures(name)")
        .eq("id", listingId)
        .single()
      if (!error && data) {
        listing = data
        figureId = data.figure_id
        const figure = Array.isArray(data.figure) ? data.figure[0] : data.figure
        figureName = figure?.name || "listing"
      }
    }

    // Not a listing id (or not found as one) — try it as a figure archive
    // link/slug instead. Falls back to treating a bare UUID as a figure id
    // too, since figures and listings share the same id format.
    if (!listing) {
      const slugOrId = figureSlug || listingId
      const { data: figure, error: figErr } = await supabase
        .from("figures")
        .select("id, name")
        .or(`slug.eq.${slugOrId},id.eq.${slugOrId}`)
        .maybeSingle()

      if (!figErr && figure) {
        figureId = figure.id
        figureName = figure.name
        // active-only: a figure can have an old soft-deleted listing
        // (admin panel DELETE just flips active:false, never removes the
        // row — see app/api/listings/[id]/route.ts). Surfacing that row
        // here used to make the bot treat a re-list as "editing an
        // existing listing" — skipping the condition prompt and updating
        // price on a row that stayed invisible on the site. Ignoring
        // inactive rows sends it through the PRICE → condition →
        // createListing path below instead, which is what "list this
        // archive figure for sale" actually needs.
        const { data: listings } = await supabase
          .from("listings")
          .select("id, price, photos")
          .eq("figure_id", figureId)
          .eq("active", true)
          .order("created_at", { ascending: false })
          .limit(1)
        listing = (listings && listings[0]) || null
      }
    }

    if (!figureId) {
      return bot.sendMessage(chatId, "❌ Not found. Check the link/ID and try again.")
    }

    setState(userId, {
      step: "editing_photos",
      listingId: listing ? listing.id : null,
      figureId,
      figureName,
      photoBuffers: [],
    })

    if (listing) {
      const currentCount = Array.isArray(listing.photos) ? listing.photos.length : 0
      const priceDisplay = `$${(listing.price / 100).toFixed(2)}`
      return bot.sendMessage(
        chatId,
        `✏️ *Managing listing for ${figureName}*\n\n` +
          `Current: ${currentCount} photo${currentCount === 1 ? "" : "s"} · ${priceDisplay}\n\n` +
          `• Send new photos (up to 10), then *DONE* — replace photos\n` +
          `• \`PRICE <amount>\` (e.g. \`PRICE 150\`) — change price\n` +
          `• *DELETE* — permanently remove from archive and shop\n\n` +
          `Or /cancel.`,
        { parse_mode: "Markdown" }
      )
    }

    return bot.sendMessage(
      chatId,
      `✏️ *Managing ${figureName}* (not currently listed in the shop)\n\n` +
        `• Send new photos (up to 10), then *DONE* — replace the archive photos\n` +
        `• \`PRICE <amount>\` (e.g. \`PRICE 150\`) — list it for sale\n` +
        `• *DELETE* — permanently remove from the archive\n\n` +
        `Or /cancel.`,
      { parse_mode: "Markdown" }
    )
  }

  // ── Step: editing_photos ──────────────────────────────────────────────────
  if (state.step === "editing_photos") {
    const upper = text.toUpperCase()

    // PRICE/DELETE only apply before any photos have been sent in this flow —
    // once photos start arriving we're committed to the photo-replace path.
    if (state.photoBuffers.length === 0 && upper === "DELETE") {
      setState(userId, { step: "confirming_delete", listingId: state.listingId, figureId: state.figureId, figureName: state.figureName })
      return bot.sendMessage(
        chatId,
        `⚠️ This will *permanently delete* "${state.figureName}" from both the archive and the shop. This cannot be undone.\n\n` +
          `Reply *DELETE CONFIRM* to proceed, or /cancel.`,
        { parse_mode: "Markdown" }
      )
    }

    if (state.photoBuffers.length === 0 && upper.startsWith("PRICE")) {
      const parts = text.split(/\s+/)
      const price = parseFloat(parts[1])

      if (!parts[1] || isNaN(price) || price <= 0) {
        return bot.sendMessage(chatId, "⚠️ Please include a valid price. Example: `PRICE 150`", { parse_mode: "Markdown" })
      }

      // Archive-only figure (no listing yet) — PRICE starts the
      // move-to-shop flow: price now, condition next, then create.
      if (!state.listingId) {
        setState(userId, {
          step: "awaiting_condition_new_listing",
          figureId: state.figureId,
          figureName: state.figureName,
          price: Math.round(price * 100),
        })
        return bot.sendMessage(
          chatId,
          `💬 Condition? Reply with one of:\n\n• Mint\n• Near Mint\n• Good\n• Fair\n• Poor`
        )
      }

      try {
        const { error } = await supabase
          .from("listings")
          .update({ price: Math.round(price * 100) })
          .eq("id", state.listingId)
        if (error) throw new Error(`DB update failed: ${error.message}`)
        const revalidated = await revalidateSite({ listingId: state.listingId, figureId: state.figureId })

        resetState(userId)
        return bot.sendMessage(
          chatId,
          `✅ *Price updated!*\n\n🏷️ ${state.figureName}\n💰 $${price.toFixed(2)}\n\n` +
            `📎 batsclub.com/shop/${state.listingId}` +
            (revalidated ? "" : REVALIDATE_WARNING),
          { parse_mode: "Markdown" }
        )
      } catch (err) {
        console.error("Price update error:", err)
        resetState(userId)
        return bot.sendMessage(chatId, `❌ Failed to update price: ${err.message}`)
      }
    }

    if (text.toUpperCase() === "DONE") {
      if (state.photoBuffers.length === 0) {
        return bot.sendMessage(chatId, "📸 Send at least one photo first, or /cancel.")
      }
      try {
        await bot.sendMessage(chatId, "⏳ Uploading photos...")
        const imageUrls = await uploadAllPhotos(state.photoBuffers, state.figureName)

        // Shop listing (if any) — /shop/<id> is the only surface that reads
        // listings.photos. Archive-only figures have no listing row; that's
        // fine, the figures.images write below is what their page renders.
        if (state.listingId) {
          const { error } = await supabase
            .from("listings")
            .update({ photos: imageUrls })
            .eq("id", state.listingId)
          if (error) throw new Error(`DB update failed: ${error.message}`)
        }

        // The figure archive page and /archive both read figures.images /
        // figures.image_url (separate columns from listings.photos). This is
        // the write that matters for an archive-only figure, and it keeps a
        // listed figure's own page + the archive in sync with /shop.
        if (state.figureId) {
          const { error: figErr } = await supabase
            .from("figures")
            .update({ images: imageUrls, image_url: imageUrls[0] })
            .eq("id", state.figureId)
          if (figErr) console.error("Figure images sync error:", figErr)
        }

        const revalidated = await revalidateSite({ listingId: state.listingId, figureId: state.figureId })

        // Point at whichever page the change is actually visible on.
        let link
        if (state.listingId) {
          link = `batsclub.com/shop/${state.listingId}`
        } else {
          const { data: slugRow } = await supabase
            .from("figures")
            .select("slug")
            .eq("id", state.figureId)
            .maybeSingle()
          link = `batsclub.com/figures/${slugRow?.slug || state.figureId}`
        }

        resetState(userId)
        return bot.sendMessage(
          chatId,
          `✅ *Photos updated!*\n\n🏷️ ${state.figureName}\n📸 ${imageUrls.length} photo${imageUrls.length === 1 ? "" : "s"}\n\n` +
            `📎 ${link}` +
            (revalidated ? "" : REVALIDATE_WARNING),
          { parse_mode: "Markdown" }
        )
      } catch (err) {
        console.error("Photo update error:", err)
        resetState(userId)
        return bot.sendMessage(chatId, `❌ Failed to update photos: ${err.message}`)
      }
    }
    return bot.sendMessage(
      chatId,
      "📸 Send more photos or type *DONE* to save. Or `PRICE <amount>` / *DELETE* (only before sending photos).",
      { parse_mode: "Markdown" }
    )
  }

  // ── Step: confirming_delete ────────────────────────────────────────────────
  if (state.step === "confirming_delete") {
    if (text.toUpperCase() === "DELETE CONFIRM") {
      try {
        const revalidated = await deleteFigureAndListings(state.figureId)
        resetState(userId)
        return bot.sendMessage(
          chatId,
          `🗑️ *Deleted!*\n\n"${state.figureName}" has been permanently removed from the archive and shop.` +
            (revalidated ? "" : REVALIDATE_WARNING),
          { parse_mode: "Markdown" }
        )
      } catch (err) {
        console.error("Delete error:", err)
        resetState(userId)
        return bot.sendMessage(chatId, `❌ ${err.message}`)
      }
    }
    return bot.sendMessage(chatId, "⚠️ Reply *DELETE CONFIRM* to permanently delete, or /cancel.", { parse_mode: "Markdown" })
  }

  // ── Step: awaiting_condition_new_listing (archive figure → shop) ─────────
  if (state.step === "awaiting_condition_new_listing") {
    const condition = CONDITIONS.find((c) => c.toLowerCase() === text.toLowerCase())

    if (!condition) {
      return bot.sendMessage(chatId, `⚠️ Invalid condition. Choose: ${CONDITIONS.join(", ")}`)
    }

    try {
      await createListing(state.figureId, state.price, condition)
      const revalidated = await revalidateSite({ figureId: state.figureId })
      resetState(userId)

      const priceDisplay = `$${(state.price / 100).toFixed(2)}`
      return bot.sendMessage(
        chatId,
        `✅ *Listed for sale!*\n\n🏷️ ${state.figureName}\n💰 ${priceDisplay} · ${condition}` +
          (revalidated ? "" : REVALIDATE_WARNING),
        { parse_mode: "Markdown" }
      )
    } catch (err) {
      console.error("Create listing error:", err)
      resetState(userId)
      return bot.sendMessage(chatId, `❌ Failed to list: ${err.message}`)
    }
  }

  // ── Step: collecting_photos ───────────────────────────────────────────────
  if (state.step === "collecting_photos") {
    if (text.toUpperCase() === "DONE") {
      if (state.photoBuffers.length === 0) {
        return bot.sendMessage(chatId, "📸 Send at least one photo first.")
      }
      setState(userId, { ...state, step: "awaiting_data" })
      return bot.sendMessage(chatId, DATA_TEMPLATE, { parse_mode: "Markdown" })
    }
    return bot.sendMessage(chatId, "📸 Send more photos or type *DONE* when finished.", { parse_mode: "Markdown" })
  }

  // ── Step: awaiting_data ────────────────────────────────────────────────────
  if (state.step === "awaiting_data") {
    const { data, missing } = parseFigureTemplate(text)

    if (missing.length > 0) {
      return bot.sendMessage(
        chatId,
        `⚠️ Missing required field(s): ${missing.join(", ")}. Send the template again with all required fields filled in.`
      )
    }

    setState(userId, { ...state, step: "awaiting_confirmation", figureData: data })
    return bot.sendMessage(chatId, formatFigureData(data), { parse_mode: "Markdown" })
  }

  // ── Step: awaiting_confirmation ───────────────────────────────────────────
  if (state.step === "awaiting_confirmation") {
    if (text.toUpperCase() === "YES") {
      setState(userId, { ...state, step: "awaiting_shop" })
      const count = state.photoBuffers.length
      return bot.sendMessage(
        chatId,
        `✅ ${count} photo${count > 1 ? "s" : ""} collected.\n\n🛍️ Add to shop for sale?\n\nReply *YES [price in USD]* (e.g. \`YES 150\`) or *NO*.`,
        { parse_mode: "Markdown" }
      )
    } else {
      // Treat message as corrections — same "Label: value" template, only
      // recognized lines are applied, everything else is left as-is.
      const { data } = parseFigureTemplate(text, state.figureData)
      setState(userId, { ...state, figureData: data })
      return bot.sendMessage(chatId, formatFigureData(data), { parse_mode: "Markdown" })
    }
  }

  // ── Step: awaiting_shop ───────────────────────────────────────────────────
  if (state.step === "awaiting_shop") {
    const upper = text.toUpperCase()

    if (upper === "NO") {
      try {
        const figure = await finalize(chatId, userId, state)
        resetState(userId)
        return bot.sendMessage(
          chatId,
          `✅ *Figure added!*\n\n📎 batsclub.com/figures/${figure.slug || figure.id}`,
          { parse_mode: "Markdown" }
        )
      } catch (err) {
        console.error("Save error:", err)
        resetState(userId)
        return bot.sendMessage(chatId, `❌ Failed to save: ${err.message}`)
      }
    }

    if (upper.startsWith("YES")) {
      const parts = text.split(/\s+/)
      const price = parseFloat(parts[1])

      if (!parts[1] || isNaN(price) || price <= 0) {
        return bot.sendMessage(chatId, "⚠️ Please include a valid price. Example: `YES 150`", { parse_mode: "Markdown" })
      }

      setState(userId, { ...state, step: "awaiting_condition", price: Math.round(price * 100) })
      return bot.sendMessage(
        chatId,
        `💬 Condition? Reply with one of:\n\n• Mint\n• Near Mint\n• Good\n• Fair\n• Poor`
      )
    }

    return bot.sendMessage(chatId, "⚠️ Please reply *YES [price]* or *NO*.", { parse_mode: "Markdown" })
  }

  // ── Step: awaiting_condition ──────────────────────────────────────────────
  if (state.step === "awaiting_condition") {
    const condition = CONDITIONS.find((c) => c.toLowerCase() === text.toLowerCase())

    if (!condition) {
      return bot.sendMessage(chatId, `⚠️ Invalid condition. Choose: ${CONDITIONS.join(", ")}`)
    }

    try {
      const figure = await finalize(chatId, userId, state)
      await createListing(figure.id, state.price, condition)
      resetState(userId)

      const priceDisplay = `$${(state.price / 100).toFixed(2)}`
      return bot.sendMessage(
        chatId,
        `✅ *Figure added to shop!*\n\n🏷️ ${figure.name}\n💰 ${priceDisplay} · ${condition}\n\n📎 batsclub.com/figures/${figure.slug || figure.id}`,
        { parse_mode: "Markdown" }
      )
    } catch (err) {
      console.error("Listing save error:", err)
      resetState(userId)
      return bot.sendMessage(chatId, `❌ Failed to save: ${err.message}`)
    }
  }

  // ══ ART FLOW ═════════════════════════════════════════════════════════════════

  // ── Step: art_collecting_photos ──────────────────────────────────────────────
  if (state.step === "art_collecting_photos") {
    if (text.toUpperCase() === "DONE") {
      if (state.photoBuffers.length === 0) {
        return bot.sendMessage(chatId, "📸 Send at least one photo first.")
      }
      setState(userId, { ...state, step: "art_choosing_type" })
      return bot.sendMessage(chatId, "🎨 Pick the *type*:", { parse_mode: "Markdown", ...ART_TYPE_KEYBOARD })
    }
    return bot.sendMessage(chatId, "📸 Send more photos or type *DONE* when finished.", { parse_mode: "Markdown" })
  }

  // ── Step: art_choosing_type (waiting on the inline keyboard) ─────────────────
  if (state.step === "art_choosing_type") {
    return bot.sendMessage(chatId, "🎨 Pick the *type* using the buttons above.", { parse_mode: "Markdown", ...ART_TYPE_KEYBOARD })
  }

  // ── Step: art_awaiting_digital (waiting on the inline keyboard) ─────────────
  if (state.step === "art_awaiting_digital") {
    return bot.sendMessage(chatId, "💾 Use the buttons above — *Digital (PDF)* or *Physical*?", { parse_mode: "Markdown", ...DIGITAL_KEYBOARD })
  }

  // ── Step: art_awaiting_file (waiting on a PDF document) ────────────────────
  if (state.step === "art_awaiting_file") {
    return bot.sendMessage(chatId, "📎 Send the *PDF* as a file / document (paperclip → File), not as text.", { parse_mode: "Markdown" })
  }

  // ── Step: art_awaiting_filename (large file uploaded via dashboard) ────────
  if (state.step === "art_awaiting_filename") {
    const fname = text.trim()
    if (!fname) return bot.sendMessage(chatId, "Send the exact filename you uploaded to the `art-files` bucket.", { parse_mode: "Markdown" })
    try {
      const { data: files, error } = await supabase.storage.from("art-files").list("", { limit: 1000 })
      if (error) throw new Error(error.message)
      const hit = (files || []).find((f) => f.name === fname)
      if (!hit) {
        return bot.sendMessage(chatId, `❌ No file named \`${fname}\` in the \`art-files\` bucket. Check the name and try again.`, { parse_mode: "Markdown" })
      }
      setState(userId, {
        ...state,
        step: "art_awaiting_data",
        artData: { ...state.artData, filePath: fname, fileName: fname },
      })
      return bot.sendMessage(chatId, `✅ Linked \`${fname}\`.\n\n` + ART_DATA_TEMPLATE, { parse_mode: "Markdown" })
    } catch (err) {
      console.error("Art filename verify error:", err)
      return bot.sendMessage(chatId, `❌ Couldn't check the bucket: ${err.message}`)
    }
  }

  // ── Step: art_awaiting_data ────────────────────────────────────────────────
  if (state.step === "art_awaiting_data") {
    const { data, missing } = parseArtTemplate(text, { type: state.artData.type })
    if (missing.length > 0) {
      return bot.sendMessage(
        chatId,
        `⚠️ Missing required field(s): ${missing.join(", ")}. Send the template again with all required fields filled in.`
      )
    }
    setState(userId, { ...state, step: "art_awaiting_confirmation", artData: { ...data, type: state.artData.type } })
    return bot.sendMessage(chatId, formatArtData({ ...data, type: state.artData.type }), { parse_mode: "Markdown" })
  }

  // ── Step: art_awaiting_confirmation ───────────────────────────────────────
  if (state.step === "art_awaiting_confirmation") {
    if (text.toUpperCase() === "YES") {
      setState(userId, { ...state, step: "art_awaiting_mature" })
      return bot.sendMessage(chatId, "🔞 Is this *18+ / mature* content?", { parse_mode: "Markdown", ...MATURE_KEYBOARD })
    }
    const { data } = parseArtTemplate(text, state.artData)
    setState(userId, { ...state, artData: { ...data, type: state.artData.type } })
    return bot.sendMessage(chatId, formatArtData({ ...data, type: state.artData.type }), { parse_mode: "Markdown" })
  }

  // ── Step: art_awaiting_mature (waiting on the inline keyboard) ──────────────
  if (state.step === "art_awaiting_mature") {
    return bot.sendMessage(chatId, "🔞 Use the buttons above — is this 18+?", MATURE_KEYBOARD)
  }

  // ── Step: art_awaiting_stock ──────────────────────────────────────────────
  if (state.step === "art_awaiting_stock") {
    const n = parseInt(text.trim(), 10)
    if (isNaN(n) || n < 0) {
      return bot.sendMessage(chatId, "⚠️ Send a whole number for the stock (e.g. `5`).", { parse_mode: "Markdown" })
    }
    setState(userId, { ...state, step: "art_awaiting_price", stock: n })
    return bot.sendMessage(chatId, "💰 *Price* in USD? Reply with a number (e.g. `45`).", { parse_mode: "Markdown" })
  }

  // ── Step: art_awaiting_price → save ───────────────────────────────────────
  if (state.step === "art_awaiting_price") {
    const price = parseFloat(text.trim())
    if (isNaN(price) || price <= 0) {
      return bot.sendMessage(chatId, "⚠️ Send a valid price (e.g. `45`).", { parse_mode: "Markdown" })
    }
    try {
      const withPrice = { ...state, price: Math.round(price * 100) }
      const { art, listingId } = await finalizeArt(chatId, withPrice)
      const revalidated = await revalidateSite({ artId: art.id })
      resetState(userId)
      const stockBit = state.artData.isDigital ? "digital (PDF)" : `stock ${state.stock}`
      return bot.sendMessage(
        chatId,
        `✅ *Art added!*\n\n🖼️ ${art.title}\n💰 $${price.toFixed(2)} · ${stockBit} · ${state.artData.type}\n\n` +
          `📎 batsclub.com/art/${listingId}` +
          (revalidated ? "" : REVALIDATE_WARNING),
        { parse_mode: "Markdown" }
      )
    } catch (err) {
      console.error("Art save error:", err)
      resetState(userId)
      return bot.sendMessage(chatId, `❌ Failed to save: ${err.message}`)
    }
  }

  // ── Step: art_editing_photos (manage an existing art listing) ──────────────
  if (state.step === "art_editing_photos") {
    const upper = text.toUpperCase()

    if (state.photoBuffers.length === 0 && upper === "DELETE") {
      setState(userId, { step: "art_confirming_delete", listingId: state.listingId, artId: state.artId, artTitle: state.artTitle })
      return bot.sendMessage(
        chatId,
        `⚠️ This will *permanently delete* "${state.artTitle}" from /art. This cannot be undone.\n\nReply *DELETE CONFIRM* to proceed, or /cancel.`,
        { parse_mode: "Markdown" }
      )
    }

    if (state.photoBuffers.length === 0 && upper.startsWith("PRICE")) {
      const price = parseFloat(text.split(/\s+/)[1])
      if (isNaN(price) || price <= 0) {
        return bot.sendMessage(chatId, "⚠️ Include a valid price. Example: `PRICE 45`", { parse_mode: "Markdown" })
      }
      try {
        const { error } = await supabase.from("listings").update({ price: Math.round(price * 100) }).eq("id", state.listingId)
        if (error) throw new Error(error.message)
        const revalidated = await revalidateSite({ artId: state.artId })
        resetState(userId)
        return bot.sendMessage(
          chatId,
          `✅ *Price updated!*\n\n🖼️ ${state.artTitle}\n💰 $${price.toFixed(2)}\n\n📎 batsclub.com/art/${state.listingId}` +
            (revalidated ? "" : REVALIDATE_WARNING),
          { parse_mode: "Markdown" }
        )
      } catch (err) {
        console.error("Art price update error:", err)
        resetState(userId)
        return bot.sendMessage(chatId, `❌ Failed to update price: ${err.message}`)
      }
    }

    if (state.photoBuffers.length === 0 && upper.startsWith("STOCK")) {
      const n = parseInt(text.split(/\s+/)[1], 10)
      if (isNaN(n) || n < 0) {
        return bot.sendMessage(chatId, "⚠️ Include a whole number. Example: `STOCK 5`", { parse_mode: "Markdown" })
      }
      try {
        const { error } = await supabase.from("listings").update({ stock: n }).eq("id", state.listingId)
        if (error) throw new Error(error.message)
        const revalidated = await revalidateSite({ artId: state.artId })
        resetState(userId)
        return bot.sendMessage(
          chatId,
          `✅ *Stock updated!*\n\n🖼️ ${state.artTitle}\n📦 stock ${n}\n\n📎 batsclub.com/art/${state.listingId}` +
            (revalidated ? "" : REVALIDATE_WARNING),
          { parse_mode: "Markdown" }
        )
      } catch (err) {
        console.error("Art stock update error:", err)
        resetState(userId)
        return bot.sendMessage(chatId, `❌ Failed to update stock: ${err.message}`)
      }
    }

    if (upper === "DONE") {
      if (state.photoBuffers.length === 0) {
        return bot.sendMessage(chatId, "📸 Send at least one photo first, or /cancel.")
      }
      try {
        await bot.sendMessage(chatId, "⏳ Uploading photos...")
        const imageUrls = await uploadAllPhotos(state.photoBuffers, state.artTitle, "art")
        const { error } = await supabase.from("listings").update({ photos: imageUrls }).eq("id", state.listingId)
        if (error) throw new Error(error.message)
        const revalidated = await revalidateSite({ artId: state.artId })
        resetState(userId)
        return bot.sendMessage(
          chatId,
          `✅ *Photos updated!*\n\n🖼️ ${state.artTitle}\n📸 ${imageUrls.length} photo${imageUrls.length === 1 ? "" : "s"}\n\n` +
            `📎 batsclub.com/art/${state.listingId}` +
            (revalidated ? "" : REVALIDATE_WARNING),
          { parse_mode: "Markdown" }
        )
      } catch (err) {
        console.error("Art photo update error:", err)
        resetState(userId)
        return bot.sendMessage(chatId, `❌ Failed to update photos: ${err.message}`)
      }
    }

    return bot.sendMessage(
      chatId,
      "📸 Send photos + *DONE* to replace them. Or `PRICE <amount>` / `STOCK <number>` / *DELETE* (before sending photos).",
      { parse_mode: "Markdown" }
    )
  }

  // ── Step: art_confirming_delete ───────────────────────────────────────────
  if (state.step === "art_confirming_delete") {
    if (text.toUpperCase() === "DELETE CONFIRM") {
      try {
        const revalidated = await deleteArtAndListing(state.listingId)
        resetState(userId)
        return bot.sendMessage(
          chatId,
          `🗑️ *Deleted!*\n\n"${state.artTitle}" has been permanently removed from /art.` +
            (revalidated ? "" : REVALIDATE_WARNING),
          { parse_mode: "Markdown" }
        )
      } catch (err) {
        console.error("Art delete error:", err)
        resetState(userId)
        return bot.sendMessage(chatId, `❌ ${err.message}`)
      }
    }
    return bot.sendMessage(chatId, "⚠️ Reply *DELETE CONFIRM* to permanently delete, or /cancel.", { parse_mode: "Markdown" })
  }
})

// ── Start ─────────────────────────────────────────────────────────────────────

console.log("🤖 Bats Club bot started. Waiting for photos...")

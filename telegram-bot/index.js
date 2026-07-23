require("dotenv").config()
const TelegramBot = require("node-telegram-bot-api")
const { createClient } = require("@supabase/supabase-js")
const https = require("https")
const { Buffer } = require("buffer")

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

// Steps during which the photo handler should buffer incoming photos
// (as opposed to rejecting them because another flow is in progress).
const PHOTO_COLLECT_STEPS = ["collecting_photos", "editing_photos"]

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
  console.log("User ID:", userId, "Admin IDs:", ADMIN_IDS)
  return ADMIN_IDS.length > 0 && ADMIN_IDS.includes(userId)
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .trim()
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

async function uploadToSupabase(imageBuffer, figureName, index) {
  const slug = slugify(figureName)
  const timestamp = Date.now()
  const suffix = index > 0 ? `-${index}` : ""
  const fileName = `${slug}-${timestamp}${suffix}.jpg`

  const { error } = await supabase.storage
    .from("figures")
    .upload(fileName, imageBuffer, { contentType: "image/jpeg", upsert: false })

  if (error) throw new Error(`Storage upload failed: ${error.message}`)

  const { data } = supabase.storage.from("figures").getPublicUrl(fileName)
  return data.publicUrl
}

async function uploadAllPhotos(photoBuffers, figureName) {
  const urls = []
  for (let i = 0; i < photoBuffers.length; i++) {
    const url = await uploadToSupabase(photoBuffers[i], figureName, i)
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

async function createListing(figureId, priceCents, condition) {
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

  await revalidateSite({ figureId })
}

// Bypasses the site's 24h ISR cache on /figures/[slug] (and the archive/shop
// listing pages) right after a direct-Supabase write, since the bot has no
// admin session to trigger Next.js's normal revalidatePath() call. Best-effort:
// logs on failure but never blocks the delete itself, which already succeeded.
async function revalidateSite(body) {
  if (!process.env.REVALIDATE_SECRET || !process.env.SITE_URL) return
  try {
    const res = await fetch(`${process.env.SITE_URL}/api/admin/revalidate`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-revalidate-secret": process.env.REVALIDATE_SECRET,
      },
      body: JSON.stringify(body),
    })
    if (!res.ok) console.error("Revalidate call failed:", res.status, await res.text())
  } catch (err) {
    console.error("Revalidate call error:", err)
  }
}

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

  // Claim the "collecting_photos" step synchronously (before the async
  // download) so photos arriving back-to-back — e.g. sent as an album —
  // don't race each other into starting separate listings. (Not needed
  // for "editing_photos" — that step is already claimed by the link
  // handler before any photo arrives.)
  if (state.step === "idle") {
    setState(userId, { step: "collecting_photos", photoBuffers: [] })
  }

  try {
    const buf = await downloadFile(bestPhoto.file_id)
    // Re-read state AFTER the async download to avoid a race condition when
    // multiple photos arrive quickly and interleave at the await point.
    const freshState = getState(userId)
    if (!PHOTO_COLLECT_STEPS.includes(freshState.step)) return
    const newBuffers = [...freshState.photoBuffers, buf]
    setState(userId, { ...freshState, photoBuffers: newBuffers })
    const doneHint = freshState.step === "editing_photos"
      ? "Send more photos, or type *DONE* to save (replaces the listing's current photos)."
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
      "👋 *Bats Club Figure Bot*\n\nSend up to 10 photos of a figure (type *DONE* when finished), then fill in the data template to add it to the catalog.\n\n" +
        "✏️ Paste a batsclub.com/shop/... link (or just the listing ID) to manage an existing listing:\n" +
        "• Send new photos + *DONE* — replace photos\n" +
        "• `PRICE <amount>` — change price\n" +
        "• *DELETE* — permanently remove from archive and shop\n\n" +
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

  // ── Idle: pasted a shop/archive link or ID → start management flow ───────
  if (state.step === "idle") {
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
        const { data: listings } = await supabase
          .from("listings")
          .select("id, price, photos")
          .eq("figure_id", figureId)
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
        await revalidateSite({ listingId: state.listingId, figureId: state.figureId })

        resetState(userId)
        return bot.sendMessage(
          chatId,
          `✅ *Price updated!*\n\n🏷️ ${state.figureName}\n💰 $${price.toFixed(2)}\n\n` +
            `📎 batsclub.com/shop/${state.listingId}`,
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
      if (!state.listingId) {
        return bot.sendMessage(chatId, "⚠️ This figure has no shop listing to attach photos to. /cancel and list it for sale first.")
      }
      try {
        await bot.sendMessage(chatId, "⏳ Uploading photos...")
        const imageUrls = await uploadAllPhotos(state.photoBuffers, state.figureName)
        const { error } = await supabase
          .from("listings")
          .update({ photos: imageUrls })
          .eq("id", state.listingId)
        if (error) throw new Error(`DB update failed: ${error.message}`)
        await revalidateSite({ listingId: state.listingId, figureId: state.figureId })

        resetState(userId)
        return bot.sendMessage(
          chatId,
          `✅ *Photos updated!*\n\n🏷️ ${state.figureName}\n📸 ${imageUrls.length} photo${imageUrls.length === 1 ? "" : "s"}\n\n` +
            `📎 batsclub.com/shop/${state.listingId}`,
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
        await deleteFigureAndListings(state.figureId)
        resetState(userId)
        return bot.sendMessage(
          chatId,
          `🗑️ *Deleted!*\n\n"${state.figureName}" has been permanently removed from the archive and shop.`,
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
      await revalidateSite({ figureId: state.figureId })
      resetState(userId)

      const priceDisplay = `$${(state.price / 100).toFixed(2)}`
      return bot.sendMessage(
        chatId,
        `✅ *Listed for sale!*\n\n🏷️ ${state.figureName}\n💰 ${priceDisplay} · ${condition}`,
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
})

// ── Start ─────────────────────────────────────────────────────────────────────

console.log("🤖 Bats Club bot started. Waiting for photos...")

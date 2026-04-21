require("dotenv").config()
const TelegramBot = require("node-telegram-bot-api")
const Anthropic = require("@anthropic-ai/sdk")
const { createClient } = require("@supabase/supabase-js")
const https = require("https")
const { Buffer } = require("buffer")

// ── Clients ──────────────────────────────────────────────────────────────────

const bot = new TelegramBot(process.env.TELEGRAM_BOT_TOKEN, { polling: true })

const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SECRET_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
)

// ── Config ────────────────────────────────────────────────────────────────────

const ADMIN_IDS = process.env.ADMIN_TELEGRAM_IDS
  ? process.env.ADMIN_TELEGRAM_IDS.split(",").map((id) => parseInt(id.trim()))
  : []

const CLAUDE_MODEL = "claude-sonnet-4-0"

const CONDITIONS = ["Mint", "Near Mint", "Good", "Fair", "Poor"]

const ADMIN_SELLER_ID = "28cc57d7-86c7-4d63-ac20-e9b1b9718773"

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
//       | "awaiting_confirmation"   — data extracted, waiting YES/corrections
//       | "awaiting_more_photos"    — confirmed, collecting extra photos
//       | "awaiting_shop"           — photos done, asking about listing
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

async function analyzeWithClaude(imageBuffer) {
  const base64 = imageBuffer.toString("base64")

  const response = await anthropic.messages.create({
    model: CLAUDE_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: { type: "base64", media_type: "image/jpeg", data: base64 },
          },
          {
            type: "text",
            text: 'Analyze this anime figure photo. Return JSON only: { "name": "...", "series": "...", "character": "...", "manufacturer": "...", "scale": "...", "year": 2024, "material": "...", "description": "..." }. Be specific and accurate. For year use an integer. For scale use format like "1/7" or "1/8". Return only the JSON object, no markdown.',
          },
        ],
      },
    ],
  })

  const text = response.content[0].text.trim()
  const cleaned = text.replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()
  const parsed = JSON.parse(cleaned)
  parsed.year = parseYear(parsed.year)
  return parsed
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
    `Is this correct? Reply *YES* to confirm or send corrections as text.`
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

  // ── Collect extra photos ───────────────────────────────────────────────────
  if (state.step === "awaiting_more_photos") {
    if (state.photoBuffers.length >= 10) {
      return bot.sendMessage(chatId, "⚠️ Maximum 10 photos reached. Type *DONE* to proceed.", { parse_mode: "Markdown" })
    }

    try {
      const buf = await downloadFile(bestPhoto.file_id)
      // Re-read state AFTER async download to avoid race condition when
      // multiple photos arrive quickly and interleave at the await point
      const freshState = getState(userId)
      if (freshState.step !== "awaiting_more_photos") return
      const newBuffers = [...freshState.photoBuffers, buf]
      setState(userId, { ...freshState, photoBuffers: newBuffers })
      return bot.sendMessage(
        chatId,
        `📸 Photo ${newBuffers.length} added. Send more or type *DONE* to finish.`,
        { parse_mode: "Markdown" }
      )
    } catch (err) {
      console.error("Extra photo download error:", err)
      return bot.sendMessage(chatId, `❌ Failed to save photo: ${err.message}`)
    }
  }

  // ── First photo — start new flow ───────────────────────────────────────────
  if (state.step !== "idle") {
    return bot.sendMessage(chatId, "⚠️ Please finish the current flow first, or send /cancel to restart.")
  }

  await bot.sendMessage(chatId, "📸 Photo received. Analyzing with Claude...")

  try {
    const imageBuffer = await downloadFile(bestPhoto.file_id)
    const figureData = await analyzeWithClaude(imageBuffer)

    setState(userId, {
      step: "awaiting_confirmation",
      figureData,
      photoBuffers: [imageBuffer],
    })

    await bot.sendMessage(chatId, formatFigureData(figureData), { parse_mode: "Markdown" })
  } catch (err) {
    console.error("Photo analysis error:", err)
    resetState(userId)
    await bot.sendMessage(chatId, `❌ Error analyzing photo: ${err.message}`)
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
      "👋 *Bats Club Figure Bot*\n\nSend a photo of an anime figure to add it to the catalog.\n\n/cancel — cancel current operation",
      { parse_mode: "Markdown" }
    )
  }

  if (text === "/cancel") {
    resetState(userId)
    return bot.sendMessage(chatId, "❌ Cancelled. Send a new photo to start over.")
  }

  if (!text || msg.photo) return

  const state = getState(userId)

  // ── Step: awaiting_confirmation ───────────────────────────────────────────
  if (state.step === "awaiting_confirmation") {
    if (text.toUpperCase() === "YES") {
      setState(userId, { ...state, step: "awaiting_more_photos" })
      return bot.sendMessage(
        chatId,
        `📷 Send more photos of this figure *(up to ${10 - state.photoBuffers.length} more)*, or type *DONE* to finish.`,
        { parse_mode: "Markdown" }
      )
    } else {
      // Treat message as corrections
      await bot.sendMessage(chatId, "✏️ Got it. Applying corrections...")

      try {
        const correctionPrompt = `The figure data was previously extracted as:\n${JSON.stringify(state.figureData, null, 2)}\n\nThe admin provided these corrections: "${text}"\n\nReturn the corrected JSON only: { "name": "...", "series": "...", "character": "...", "manufacturer": "...", "scale": "...", "year": 2024, "material": "...", "description": "..." }. Return only the JSON object, no markdown.`

        const response = await anthropic.messages.create({
          model: CLAUDE_MODEL,
          max_tokens: 512,
          messages: [{ role: "user", content: correctionPrompt }],
        })

        const raw = response.content[0].text.trim().replace(/^```(?:json)?\n?/, "").replace(/\n?```$/, "").trim()
        const correctedData = JSON.parse(raw)
        correctedData.year = parseYear(correctedData.year)

        setState(userId, { ...state, figureData: correctedData })
        return bot.sendMessage(chatId, formatFigureData(correctedData), { parse_mode: "Markdown" })
      } catch (err) {
        console.error("Correction error:", err)
        return bot.sendMessage(chatId, `❌ Failed to apply corrections: ${err.message}\n\nTry again or send /cancel.`)
      }
    }
  }

  // ── Step: awaiting_more_photos ────────────────────────────────────────────
  if (state.step === "awaiting_more_photos") {
    if (text.toUpperCase() === "DONE") {
      setState(userId, { ...state, step: "awaiting_shop" })
      const count = state.photoBuffers.length
      return bot.sendMessage(
        chatId,
        `✅ ${count} photo${count > 1 ? "s" : ""} collected.\n\n🛍️ Add to shop for sale?\n\nReply *YES [price in USD]* (e.g. \`YES 150\`) or *NO*.`,
        { parse_mode: "Markdown" }
      )
    }
    return bot.sendMessage(chatId, "📸 Send more photos or type *DONE* to finish.", { parse_mode: "Markdown" })
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

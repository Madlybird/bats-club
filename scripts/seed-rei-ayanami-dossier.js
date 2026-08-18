// One-shot seeder for the "Five Rei Ayanami Figures Worth the Hunt" article.
// Run: node scripts/seed-rei-ayanami-dossier.js

const fs = require("fs")
const path = require("path")
const { createClient } = require("@supabase/supabase-js")

const env = fs.readFileSync(path.join(__dirname, "..", ".env.local"), "utf8")
const read = (k) => {
  const m = env.match(new RegExp("^" + k + "=(.*)$", "m"))
  return m ? m[1].trim() : null
}

const url = read("NEXT_PUBLIC_SUPABASE_URL")
const key = read("SUPABASE_SECRET_KEY") || read("SUPABASE_SERVICE_ROLE_KEY")
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY in .env.local")
  process.exit(1)
}

const supabase = createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })

const ADMIN_EMAIL = "kiwisinbioxbird@gmail.com"
const SLUG = "five-rei-ayanami-figures-worth-the-hunt"

const FIGURE_SLUGS = [
  "vintage-1998-xebec-evangelion-rei-ayanami-repaint-version-figure-spear-longinus",
  "rei-ayanami-cat-ear-dress-ver-ayanami-raising-project",
  "wonder-festival-evangelion-rei-d2485754",
  "rei-ayanami-chronicle-limited-plug-suit-figure",
  "rei-ayanami-mummy-version-figure-b4ea4f8b",
]

const BODY = `A '90s-style garage kit of her is being reissued this year, which means it's a good time to ask what happened to the originals, and to the stranger, harder-to-place versions that came after them.

Somewhere between the original TV run and the flood of merchandise that followed *End of Evangelion*, Rei Ayanami became the figure every serious collector eventually goes looking for. Kaiyodo, Sega, Bandai and half a dozen smaller studios kept releasing her for well over a decade, so scarcity isn't really the issue. What makes her hard to collect is that so much of that run was prize-only, convention-only, or magazine-only, and never got a wide release outside Japan.

That's part of why the reissue news landed the way it did earlier this year: a '90s-style garage kit of her, two plugsuits, two hairstyles, an optional bandaged arm, built for a new audience the way collectors used to build her at home out of resin. Good news if you're starting a collection. For anyone who already owns an original, it's more of a reminder of how far the field has moved since 1998, and how many versions of Rei never came anywhere near a reissue at all.

We pulled five out of the archive, chosen less for fame than for what each one reveals. Together they cover roughly the first fifteen years of Rei merchandise, five different manufacturers' idea of who she was, and five completely different ways a figure ends up rare in the first place.

***

## 01. Vintage 1998 Xebec Rei Ayanami: Repaint Version, Spear of Longinus

{Kaiyodo (Xebec)|1998|15 cm, non-scale|Sealed on card (MOC)}

[![VINTAGE 1998 Xebec Evangelion Rei Ayanami Repaint Version Figure Spear Longinus](https://rnlnnunmzikpysstsywx.supabase.co/storage/v1/object/public/figures/vintage-1998-xebec-evangelion-rei-ayanami-repaint-version-figure-spear-longinus-1786976058683.jpg "Bats Club Archive · $95")](https://batsclub.com/figures/vintage-1998-xebec-evangelion-rei-ayanami-repaint-version-figure-spear-longinus)

Start with the oldest date in the archive. 1998 puts this figure right in the aftershock of the original TV run and *End of Evangelion*, the window when Kaiyodo's Xebec division was still working out how much articulation and how much license-accuracy a Rei figure needed, before the industry settled on the prepainted PVC format that took over a few years later.

This repaint variant carries the metallic chrome treatment across the plugsuit that Xebec ran on a handful of limited batches that year. The finish reads as liquid mecha rather than fabric, closer to how Rei looks lit from an Eva cockpit than how the suit actually looks on screen. Kaiyodo wouldn't launch Revoltech, the poseable-joint line that later redefined how the company built anime figures, for another eight years. This is Kaiyodo before that shift: stiffer joints, simpler articulation, the format the whole industry was still using before ball-joints changed what fans expected from a figure like this.

It's fully articulated for its era, ships with a swap head sculpt and interchangeable arms, and it's still factory-sealed on its original English-release blister card, which is the part that actually matters for value. Finding a twenty-eight-year-old figure still unopened is rare on its own.

If you've been reading about the new '90s-style reissue, this is the era it's reaching back toward: the same rough silhouette, the same plugsuit-only Rei, before any of the alternate outfits and event exclusives that came later. The reissue is new plastic built to look like this one, the original.

***

## 02. Rei Ayanami: Cat Ear Dress Ver. (Ayanami Raising Project)

{Sega|2001|~12 cm|Prize figure}

[![Rei Ayanami Cat Ear Dress Ver, Sega prize figure from Ayanami Raising Project](https://rnlnnunmzikpysstsywx.supabase.co/storage/v1/object/public/figures/rei-ayanami-cat-ear-dress-ver-ayanami-raising-project-1777388542810.jpg "Bats Club Archive · $59")](https://batsclub.com/figures/rei-ayanami-cat-ear-dress-ver-ayanami-raising-project)

This one only makes sense once you know the game it's from. In 1998, Gainax spun Rei off into *Ayanami Ikusei Keikaku* (Ayanami Raising Project), a raising-sim in the *Princess Maker* mold that had almost nothing to do with piloting an Eva. You fed her, talked to her, nudged her mood, and depending on how you played, she showed up in outfits the original series never gave her. A cat-girl cosplay, pink dress, puffed sleeves, bell collar, was one of them.

Gainax rarely developed its own Evangelion games in-house; most were outsourced to other studios under license. This was one of the exceptions, and one of the strangest: the studio took its most withdrawn, least emotionally available character and rebuilt her as the protagonist of a raising-sim, years before "healing"-style games about caring for a quiet character became a recognized genre outside Japan. The original Sega Saturn release was 1998, but it got a second life in 2001 with a Windows PC port, the same year this figure showed up. That's not a coincidence collectors usually connect: Sega's prize catcher division tends to run tie-in figures around whatever version of a license is currently back on shelves, and 2001 was the cat ear costume's second wind, not its first.

It's a souvenir of a video game most collectors outside Japan never played. That's why it tends to confuse people who find it with no context, and why the context is worth knowing.

***

## 03. Wonder Festival Evangelion Rei

{Kaiyodo|Wonder Festival 2006|Garage kit}

[![Wonder Festival 2006 Evangelion Rei garage kit exclusive by Kaiyodo](https://rnlnnunmzikpysstsywx.supabase.co/storage/v1/object/public/figures/wonder-festival-evangelion-rei-1775887820123.jpg "Bats Club Archive · $99")](https://batsclub.com/figures/wonder-festival-evangelion-rei-d2485754)

Wonder Festival is Kaiyodo's own event, held twice a year in Makuhari since the mid-'80s, and it runs on a completely different economy than retail figures. Independent sculptors and small circles book a table, sculpt a limited run of resin garage kits, and sell them for the length of the show. No reprint, no restock, no wide release. What doesn't sell at the table generally doesn't exist anywhere else.

This Rei is a WonFes 2006 piece with full Kaiyodo backing rather than an independent circle, but it's still built on the convention-exclusive model, which is why so little paperwork survives around exact production numbers. That particular show, Wonder Festival 2006 Summer, built its Evangelion presence around the series' tenth anniversary that year. Kaiyodo's Eva lineup for the event was framed as an anniversary showcase rather than a standard seasonal wave, which is a large part of why pieces from this specific festival get hunted separately from Kaiyodo's ordinary yearly Eva output.

The pose is more dynamic than any retail-line Rei from the same years, the paintwork is a level above a prize figure, and it never had a second release. If you weren't at the show, or didn't know someone who was, this was never coming to you through a normal store.

***

## 04. Rei Ayanami Chronicle: Limited Plug Suit Figure

{DeAgostini / Yamato|2010|~13 cm}

[![Rei Ayanami Chronicle limited plug suit figure, DeAgostini Evangelion Chronicle magazine completion prize](https://rnlnnunmzikpysstsywx.supabase.co/storage/v1/object/public/figures/rei-ayanami-chronicle-limited-plug-suit-figure-1777392753196.jpg "Bats Club Archive · $108")](https://batsclub.com/figures/rei-ayanami-chronicle-limited-plug-suit-figure)

This is the strangest distribution model on the list, and also one of the most Japanese: DeAgostini's *Evangelion Chronicle* wasn't a toy line, it was a magazine. DeAgostini is the same publisher international readers might know from "build your own Millennium Falcon" or "assemble an Iron Man suit" partwork series sold abroad. The Japanese Evangelion edition launched January 19, 2010, priced at 690 yen an issue, and ran 40 issues. This figure wasn't bundled into any single issue. It was the completion prize, the thing DeAgostini shipped only to readers who bought all 40, which meant staying subscribed to a weekly magazine for most of a year to actually receive it. When *Evangelion: 2.0* hit theaters that August, DeAgostini extended the run with ten more issues nobody had originally signed up for, tying the whole partwork's back half directly to the film's release.

That distribution model is why so few of these survive in good shape outside Japan: it never had an export SKU, never sat on a shelf at a toy shop, and it only ever reached readers who stuck with a subscription through to the end. Anyone who owns one either did that in 2010, or bought it years later from someone who did.

The figure itself is unglamorous by garage-kit standards, and nothing about the sculpt shouts exclusive. The story is entirely in how you got it.

***

## 05. Rei Ayanami: Mummy Version

{Sega|2006|Glow-in-the-dark|Prize figure}

[![Rei Ayanami Mummy Version, glow-in-the-dark Sega Halloween prize figure](https://rnlnnunmzikpysstsywx.supabase.co/storage/v1/object/public/figures/rei-ayanami-mummy-version-figure-1775673213841.jpg "Bats Club Archive · $52")](https://batsclub.com/figures/rei-ayanami-mummy-version-figure-b4ea4f8b)

And then there's the one nobody expects. Sega ran a rotating cast of themed prize figures through 2006 under its EX Figure line, a different costume roughly every couple of months. January's was a "Red Eyez" variant, summer brought a mermaid and a festival-night version, August brought a "Motor Riders" figure. This one was catalogued as the Halloween Mini Display Figure, the season-specific entry in that same rotation, which is the actual reason a Neon Genesis Evangelion prize figure is wrapped in glow-in-the-dark bandages: it wasn't a one-off joke, it was October's slot in a release calendar Sega ran like clockwork that year.

Rei was never bandaged on screen outside of hospital scenes that have nothing to do with mummies. The costume exists because the calendar needed a Halloween figure, not because the story did.

It's stuck around in collections for the same reason most seasonal prize figures do once the rest of the rotation gets forgotten: it's the entry from that year's lineup people still remember by name, long after "Motor Riders" and "Red Eyez" have blurred into every other themed variant Sega put out that decade.

***

## What This Says About Collecting Her

Line these five up and you get less a "best-of" than a map of how one character got made five different ways across fifteen years: by a garage-kit convention, a prize-catcher machine, a raising-sim spinoff, a subscription magazine, and the same studio that started it all in 1998. That's most of what collecting this era actually is: fewer definitive versions than you'd think, and a lot more context you have to go dig up yourself.

If you're chasing the school-uniform version instead, or the metallic-finish sibling to the '98 repaint above, they're both sitting in the archive too. Wishlist them, and they move a little closer to being worth releasing. That's how the rest of this works.`

const EXCERPT =
  "A '90s-style Rei Ayanami garage kit is being reissued this year. Five rarer originals from the archive, and the real story behind each one: a 1998 Xebec repaint, a Sega dating-sim prize figure, a Wonder Festival exclusive, a magazine completion prize, and a glow-in-the-dark Halloween oddity."

async function main() {
  const { data: user, error: userErr } = await supabase
    .from("users")
    .select("id, email, is_admin")
    .eq("email", ADMIN_EMAIL)
    .single()
  if (userErr || !user) {
    console.error("Could not find admin user:", userErr?.message || "no row")
    process.exit(1)
  }
  if (!user.is_admin) {
    console.error(`User ${ADMIN_EMAIL} exists but is_admin=false.`)
    process.exit(1)
  }
  console.log(`Found admin user: ${user.email} (id=${user.id})`)

  const { data: figures, error: figErr } = await supabase
    .from("figures")
    .select("id, slug, name")
    .in("slug", FIGURE_SLUGS)
  if (figErr) {
    console.error("Figure lookup failed:", figErr.message)
    process.exit(1)
  }
  const missing = FIGURE_SLUGS.filter((s) => !figures.some((f) => f.slug === s))
  if (missing.length) {
    console.error("Missing figures for slugs:", missing)
    process.exit(1)
  }
  // preserve intended order
  const orderedFigureIds = FIGURE_SLUGS.map((s) => figures.find((f) => f.slug === s).id)
  console.log(
    "Linked figures:",
    FIGURE_SLUGS.map((s) => figures.find((f) => f.slug === s).name)
  )

  const payload = {
    title: "Five Rei Ayanami Figures Worth the Hunt",
    slug: SLUG,
    body: BODY,
    excerpt: EXCERPT,
    meta_description: EXCERPT,
    cover_image: null,
    author_id: user.id,
    published: true,
    pinned: false,
  }

  const { data: existing } = await supabase.from("articles").select("id").eq("slug", SLUG).maybeSingle()

  let article, error
  if (existing) {
    ;({ data: article, error } = await supabase
      .from("articles")
      .update(payload)
      .eq("id", existing.id)
      .select("id, slug, published")
      .single())
  } else {
    ;({ data: article, error } = await supabase
      .from("articles")
      .insert(payload)
      .select("id, slug, published")
      .single())
  }

  if (error && (error.code === "PGRST204" || error.code === "42703" || /column/i.test(error.message || ""))) {
    console.warn(`Full-shape ${existing ? "update" : "insert"} failed (${error.message}). Retrying without meta_description/pinned.`)
    const basic = { ...payload }
    delete basic.meta_description
    delete basic.pinned
    const retry = existing
      ? await supabase.from("articles").update(basic).eq("id", existing.id).select("id, slug, published").single()
      : await supabase.from("articles").insert(basic).select("id, slug, published").single()
    article = retry.data
    error = retry.error
  }

  if (error || !article) {
    console.error(`${existing ? "UPDATE" : "INSERT"} failed:`, error)
    process.exit(1)
  }
  console.log(`${existing ? "UPDATED" : "INSERTED"} article:`, article)

  // Reset and relink article_figures for idempotency
  const { error: delErr } = await supabase.from("article_figures").delete().eq("article_id", article.id)
  if (delErr) {
    console.error("Could not clear existing article_figures:", delErr.message)
    process.exit(1)
  }
  const { error: linkErr } = await supabase
    .from("article_figures")
    .insert(orderedFigureIds.map((figure_id) => ({ article_id: article.id, figure_id })))
  if (linkErr) {
    console.error("Could not link figures:", linkErr.message)
    process.exit(1)
  }
  console.log(`Linked ${orderedFigureIds.length} figures to the article.`)
  console.log(`Live at: https://batsclub.com/articles/${article.slug}`)
}

main().catch((e) => {
  console.error("Unexpected:", e)
  process.exit(1)
})

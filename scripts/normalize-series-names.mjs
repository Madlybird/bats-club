import { createClient } from "@supabase/supabase-js"
import fs from "fs"

for (const line of fs.readFileSync(".env.local", "utf8").split("\n")) {
  const m = line.match(/^([A-Z_0-9]+)=(.*)$/)
  if (m) process.env[m[1]] = m[2].replace(/^"|"$/g, "")
}

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SECRET_KEY)

// Each entry: canonical series string -> other exact strings in the DB that
// are the same real series, just formatted differently (case, JP-script
// parenthetical, punctuation). Found via scripts/_audit-series.mjs — every
// group here normalizes (lowercase, parens stripped, punctuation stripped)
// to the same key. Deliberately NOT touching "Ghost in the Shell" or
// "K.T Figure"/"Wonder Festival" — those are handled by the shop's themed
// collections instead (see lib/collections.ts), since their variants differ
// by more than formatting (real sub-title differences).
const MERGES = [
  ["To Heart 2", ["ToHeart2"]],
  ["Dragon Quest", ["Dragon Quest (Dragon Quest III: The Seeds of Salvation)", "Dragon Quest (ドラゴンクエスト)"]],
  ["Higurashi When They Cry", ["Higurashi When They Cry (ひぐらしのなく頃に)"]],
  ["Cardcaptor Sakura", ["Cardcaptor Sakura (カードキャプターさくら)"]],
  ["Neon Genesis Evangelion", ["Neon Genesis Evangelion (Rebuild of Evangelion)", "Neon Genesis Evangelion (新世紀エヴァンゲリオン)"]],
  ["Akira", ["AKIRA", "Akira (アキラ)"]],
  ["Martian Successor Nadesico", ["Martian Successor Nadesico (機動戦艦ナデシコ)"]],
  ["Memories Off 2nd", ["Memories Off 2nd (メモリーズオフセカンド)"]],
  ["Macross Frontier", ["Macross Frontier (マクロスF)", "Macross Frontier (劇場版 マクロスF)"]],
  ["Little Busters!", ["Little Busters! (リトルバスターズ！)", "Little Busters! (リトルバスターズ!)"]],
  ["Ai Yori Aoshi (Bluer Than Indigo)", ["Ai yori Aoshi (Bluer Than Indigo)", "Ai Yori Aoshi"]],
  ["Darkstalkers / Vampire Savior", ["Darkstalkers / Vampire Savior (ヴァンパイアセイヴァー)", "Darkstalkers / Vampire Savior (SR Super Real Part 4)"]],
  ["Moetan", ["Moetan (もえたん)"]],
  ["Queen's Blade", ["Queen's Blade (クイーンズブレイド)"]],
  ["Ichigo Mashimaro (Strawberry Marshmallow)", [
    "Ichigo Mashimaro",
    "Ichigo Mashimaro (Strawberry Marshmallow / 苺ましまろ)",
  ]],
  ["Ikki Tousen (Dragon Destiny)", ["Ikki Tousen", "Ikki Tousen (一騎当千)"]],
  ["Shirotsume Souwa: Episode of the Clovers", ["Shirotsume Souwa: Episode of the Clovers (白詰草話 -EPISODE OF THE CLOVERS-)"]],
  ["Wonder Festival", [
    "Wonder Festival (Wanda-chan / ワンダちゃん)",
    "Wonder Festival (Wonda & Reset)",
  ]],
  ["Yuiko Tokumi's Hakkaya Collection", [
    "Yuiko Tokumi's Hakkaya Collection (とくみゆいこ ぱっかやコレクション / Hakkaya Collection)",
    "Yuiko Tokumi's Hakkaya Collection (篤見唯子の世界 薄荷屋コレクション)",
  ]],
  ["Little Busters! Ecstasy", ["Little Busters! Ecstasy (リトルバスターズ! エクスタシー)"]],
  ["Romance wa Tsurugi no Kagayaki II (Romance is the Flash of a Sword II)", ["Romance wa Tsurugi no Kagayaki II"]],
  // Found via a re-run of the audit on 2026-08-12 — 5 new groups had
  // appeared since the original list above, from figures added after
  // 2026-08-07.
  ["Shuffle!", ["Shuffle! (シャッフル!)"]],
  // Official title includes the double exclamation point (一撃殺虫!!ホイホイさん).
  ["Ichigeki Sacchu!! HoiHoi-san", ["Ichigeki Sacchu HoiHoi-san"]],
  ["Lucky Star", ["Lucky Star (らき☆すた)"]],
  ["Majokko A La Mode (魔女っ娘ア・ラ・モード)", ["Majokko a la Mode (魔女っ娘ア・ラ・モード)"]],
  ["Tsukuyomi: Moon Phase", [
    "Tsukuyomi: Moon Phase (うた∽かた / 月詠 -MOON PHASE-)",
    "Tsukuyomi: Moon Phase (月詠 -MOON PHASE-)",
  ]],
]

let totalUpdated = 0
for (const [canonical, variants] of MERGES) {
  const { data, error } = await supabase
    .from("figures")
    .update({ series: canonical })
    .in("series", variants)
    .select("id")
  if (error) { console.error(canonical, error); continue }
  console.log(`${canonical}: merged ${data.length} figures from [${variants.join(" | ")}]`)
  totalUpdated += data.length
}
console.log(`\ndone, ${totalUpdated} figures updated`)

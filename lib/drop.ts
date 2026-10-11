// Current art drop announced by the entry modal (components/RegisterPrompt).
// Single source for copy, covers and the window it runs in; the modal goes
// back to the sign-up ask on its own once endsAt passes. Covers must be
// non-mature pieces — the modal shows them without the age gate.

export const ART_DROP = {
  id: "sinbiox-2026-10",
  endsAt: "2026-10-18T23:59:59Z", // 7 days from release
  covers: [
    "https://rnlnnunmzikpysstsywx.supabase.co/storage/v1/object/public/art/lime-bat-1791651222789.jpg",
    "https://rnlnnunmzikpysstsywx.supabase.co/storage/v1/object/public/art/cherry-fangs-hypnotic-1791652400164.jpg",
    "https://rnlnnunmzikpysstsywx.supabase.co/storage/v1/object/public/art/skull-princess-1791641627508.jpg",
  ],
} as const

export function isDropActive(now = Date.now()): boolean {
  return now < Date.parse(ART_DROP.endsAt)
}

export const DROP_TEXT = {
  en: {
    eyebrow: "new art drop",
    title: "SINBIOX",
    body: "Hand-drawn. One of one. Now in the archive.",
    cta: "see the drop",
  },
  ru: {
    eyebrow: "новый арт-дроп",
    title: "SINBIOX",
    body: "Нарисовано от руки. В одном экземпляре. Уже в архиве.",
    cta: "смотреть дроп",
  },
  jp: {
    eyebrow: "新作アートドロップ",
    title: "SINBIOX",
    body: "手描き。一点もの。アーカイブに登場。",
    cta: "ドロップを見る",
  },
} as const

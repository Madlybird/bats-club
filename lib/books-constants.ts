// Client-safe constants for the /books section. Keep this file free of any
// server imports (lib/books.ts pulls in the Supabase service client, which
// must never be bundled into client components).

export const BOOK_TYPES = ["Artbook", "Photobook", "Zine", "Magazine", "Cards"] as const
export type BookType = (typeof BOOK_TYPES)[number]

export const BOOK_CONDITIONS = ["New", "Like New", "Very Good", "Good", "Fair"] as const
export type BookCondition = (typeof BOOK_CONDITIONS)[number]

import { createClient } from "@supabase/supabase-js"

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY!

// Browser client (uses publishable key, subject to RLS)
export const supabase = createClient(supabaseUrl, supabasePublishableKey)

// Server-side admin client (uses secret key, bypasses RLS)
export const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

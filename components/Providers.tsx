"use client"

import { SessionProvider } from "next-auth/react"
import { CartProvider } from "@/lib/cart-context"
import { UserFiguresProvider } from "@/lib/user-figures-context"
import { ReactNode } from "react"

// Session is resolved client-side (/api/auth/session) on purpose: reading
// it in the root layout (619c45e) made every route dynamic and uncached.
export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <UserFiguresProvider>
        <CartProvider>{children}</CartProvider>
      </UserFiguresProvider>
    </SessionProvider>
  )
}

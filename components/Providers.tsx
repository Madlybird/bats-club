"use client"

import { SessionProvider } from "next-auth/react"
import { CartProvider } from "@/lib/cart-context"
import { UserFiguresProvider } from "@/lib/user-figures-context"
import { ReactNode } from "react"

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <UserFiguresProvider>
        <CartProvider>{children}</CartProvider>
      </UserFiguresProvider>
    </SessionProvider>
  )
}

"use client"

import { Session } from "next-auth"
import { SessionProvider } from "next-auth/react"
import { CartProvider } from "@/lib/cart-context"
import { UserFiguresProvider } from "@/lib/user-figures-context"
import { ReactNode } from "react"

export default function Providers({
  children,
  session,
}: {
  children: ReactNode
  session: Session | null
}) {
  return (
    <SessionProvider session={session}>
      <UserFiguresProvider>
        <CartProvider>{children}</CartProvider>
      </UserFiguresProvider>
    </SessionProvider>
  )
}

import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"
import { checkRateLimit } from "@/lib/rate-limit"
import { isFirstOrderOfferEligible } from "@/lib/member-offer.server"
import { MEMBER_SHIP_PERCENT_OFF } from "@/lib/member-offer"

// Lets the cart show the member first-order shipping discount before
// checkout. Display only — /api/checkout decides what is charged.
export async function GET(req: Request) {
  const limited = checkRateLimit(req, "member-offer", 60, 5 * 60 * 1000)
  if (limited) return limited

  const session = await getServerSession(authOptions)
  const userId = session?.user?.id ?? null
  const eligible = await isFirstOrderOfferEligible(userId)
  return NextResponse.json(
    { loggedIn: !!userId, eligible, percentOff: MEMBER_SHIP_PERCENT_OFF },
    { headers: { "Cache-Control": "no-store" } }
  )
}

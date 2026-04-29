import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/lib/auth"

export async function POST(req: Request) {
  const session = await getServerSession(authOptions)
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 })
  }

  let body: { orderId?: string; trackingNumber?: string; customerEmail?: string }
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 })
  }

  const { orderId, trackingNumber, customerEmail } = body
  if (!orderId || !trackingNumber || !customerEmail) {
    return NextResponse.json(
      { error: "orderId, trackingNumber, and customerEmail are required" },
      { status: 400 },
    )
  }

  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    return NextResponse.json({ error: "RESEND_API_KEY not configured" }, { status: 500 })
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: "Support <support@batsclub.com>",
      to: [customerEmail],
      template_id: "0c11d6d7-40f1-483a-ad83-a31f58c72478",
      template_variables: {
        order_number: orderId,
        tracking_number: trackingNumber,
      },
    }),
  })

  if (!res.ok) {
    const detail = await res.text().catch(() => "")
    return NextResponse.json(
      { error: "Resend request failed", status: res.status, detail },
      { status: 502 },
    )
  }

  const data = await res.json().catch(() => ({}))
  return NextResponse.json({ ok: true, id: data?.id ?? null })
}

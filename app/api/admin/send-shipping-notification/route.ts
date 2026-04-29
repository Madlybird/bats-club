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

  const requestBody = {
    from: "Support <support@batsclub.com>",
    to: [customerEmail],
    template_id: "0c11d6d7-40f1-483a-ad83-a31f58c72478",
    template_variables: {
      order_number: orderId,
      tracking_number: trackingNumber,
    },
  }

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  })

  const rawBody = await res.text().catch(() => "")
  let parsedBody: any = null
  try {
    parsedBody = rawBody ? JSON.parse(rawBody) : null
  } catch {
    parsedBody = null
  }

  if (!res.ok) {
    console.error("[shipping-notification] Resend error", {
      status: res.status,
      statusText: res.statusText,
      body: parsedBody ?? rawBody,
      requestBody,
    })
    return NextResponse.json(
      {
        error: "Resend request failed",
        status: res.status,
        detail: parsedBody ?? rawBody ?? null,
      },
      { status: 502 },
    )
  }

  console.log("[shipping-notification] Resend sent", { id: parsedBody?.id, to: customerEmail })
  return NextResponse.json({ ok: true, id: parsedBody?.id ?? null })
}

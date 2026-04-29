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

  const orderNumber = orderId

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Your Order Has Been Shipped</title>
</head>
<body style="margin:0;padding:0;background:#0a0a0a;font-family:'Inter',sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a0a;padding:40px 20px;">
  <tr>
    <td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#111;border:1px solid #2a0a1a;border-radius:12px;overflow:hidden;">
        <tr>
          <td style="background:linear-gradient(135deg,#1a0010,#2d0020);padding:40px;text-align:center;border-bottom:1px solid #3d0030;">
            <p style="margin:0 0 8px;font-size:28px;">🦇</p>
            <h1 style="margin:0;font-size:24px;font-weight:700;color:#fff;letter-spacing:2px;">BATS CLUB</h1>
            <p style="margin:6px 0 0;font-size:12px;color:#ff4d8f;letter-spacing:3px;text-transform:uppercase;">Your order is on its way</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px;">
            <p style="margin:0 0 24px;font-size:16px;color:#ccc;line-height:1.6;">Your vintage figure has left our archive and is heading your way. 🖤</p>
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#1a1a1a;border:1px solid #2a0a1a;border-radius:8px;margin-bottom:28px;">
              <tr>
                <td style="padding:20px 24px;border-bottom:1px solid #2a0a1a;">
                  <p style="margin:0;font-size:12px;color:#ff4d8f;letter-spacing:2px;text-transform:uppercase;">Order Number</p>
                  <p style="margin:6px 0 0;font-size:18px;font-weight:600;color:#fff;">${orderNumber}</p>
                </td>
              </tr>
              <tr>
                <td style="padding:20px 24px;">
                  <p style="margin:0;font-size:12px;color:#ff4d8f;letter-spacing:2px;text-transform:uppercase;">Tracking Number</p>
                  <p style="margin:6px 0 0;font-size:15px;color:#ccc;">${trackingNumber}</p>
                </td>
              </tr>
            </table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:32px;">
              <tr>
                <td align="center">
                  <a href="https://track.thailandpost.co.th/" style="display:inline-block;background:linear-gradient(135deg,#cc0052,#ff4d8f);color:#fff;text-decoration:none;font-size:14px;font-weight:600;letter-spacing:1px;padding:14px 36px;border-radius:6px;text-transform:uppercase;">Track Your Order</a>
                </td>
              </tr>
            </table>
            <p style="margin:0 0 16px;font-size:14px;color:#999;line-height:1.6;">You can track your delivery at <a href="https://track.thailandpost.co.th/" style="color:#ff4d8f;text-decoration:none;">track.thailandpost.co.th</a> using your tracking number above.</p>
            <p style="margin:0;font-size:14px;color:#999;line-height:1.6;">Have a question? Contact us at <a href="mailto:support@batsclub.com" style="color:#ff4d8f;text-decoration:none;">support@batsclub.com</a> — we'll get back to you shortly.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#0d0d0d;padding:24px 40px;border-top:1px solid #1a1a1a;text-align:center;">
            <p style="margin:0 0 6px;font-size:12px;color:#444;">© Bats Club · batsclub.com</p>
            <p style="margin:0 0 10px;font-size:12px;color:#333;">Vintage anime figure archive · Bangkok, Thailand</p>
            <a href="https://batsclub.com/terms" style="font-size:11px;color:#333;text-decoration:underline;">Terms & Conditions</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`

  const requestBody = {
    from: "Support <support@batsclub.com>",
    to: [customerEmail],
    subject: "Bats Club: your order is on its way",
    html,
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
    const { html: _html, ...redactedBody } = requestBody
    console.error("[shipping-notification] Resend error", {
      status: res.status,
      statusText: res.statusText,
      body: parsedBody ?? rawBody,
      requestBody: redactedBody,
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

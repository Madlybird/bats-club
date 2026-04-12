import { Resend } from "resend"

const FROM = "Bats Club <support@batsclub.com>"

function getResend() {
  return new Resend(process.env.RESEND_API_KEY)
}

const wrap = (content: string) => `
<!DOCTYPE html>
<html>
<body style="margin:0;padding:0;background:#0e0408">
<div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:480px;margin:0 auto;background:#0e0408;color:#f0e0e0;padding:40px 32px">
  <img src="https://batsclub.com/logo.png" alt="Bats Club" width="120" height="auto" style="display:block;max-width:120px;height:auto;margin-bottom:24px" />
  ${content}
  <p style="color:rgba(240,224,224,0.2);font-size:11px;margin:32px 0 0;border-top:1px solid rgba(255,45,120,0.13);padding-top:16px">
    &copy; 2026 Bats Club by Sinbiox Limited. All rights reserved.
  </p>
</div>
</body>
</html>
`

const btn = (href: string, label: string) =>
  `<a href="${href}" style="display:inline-block;background:#ff2d78;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none;margin:4px 8px 4px 0">${label}</a>`

export async function sendVerificationEmail(email: string, code: string) {
  const html = wrap(`
    <h1 style="font-size:20px;font-weight:900;color:#fff;margin:0 0 8px">Verify your account</h1>
    <p style="color:rgba(240,224,224,0.5);font-size:14px;margin:0 0 24px">Enter this code to activate your Bats Club account.</p>
    <div style="background:rgba(255,45,120,0.08);border:1px solid rgba(255,45,120,0.25);border-radius:8px;padding:20px;text-align:center;margin:0 0 16px">
      <span style="font-size:32px;font-weight:900;letter-spacing:6px;color:#ff2d78">${code}</span>
    </div>
    <p style="color:rgba(240,224,224,0.3);font-size:12px;margin:0">This code expires in 15 minutes. If you didn't create an account, ignore this email.</p>
  `)

  if (!process.env.RESEND_API_KEY) {
    console.log(`[email:verification] code=${code} to=${email}`)
    return
  }

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Verify your Bats Club account",
    html,
  })
}

export async function sendWelcomeEmail(email: string, username: string) {
  const html = wrap(`
    <h1 style="font-size:20px;font-weight:900;color:#fff;margin:0 0 8px">Welcome to Bats Club 🦇</h1>
    <p style="color:rgba(240,224,224,0.5);font-size:15px;line-height:1.6;margin:0 0 24px">
      Welcome to Bats Club — the private archive of rare Japanese anime figures.
      Your account is ready. Start exploring 2000+ authentic figures from the 1990s-2000s.
    </p>
    <div style="margin:0 0 8px">
      ${btn("https://batsclub.com/archive", "Browse the Archive")}
      ${btn(`https://batsclub.com/profile/${username}`, "View your Profile")}
    </div>
  `)

  if (!process.env.RESEND_API_KEY) {
    console.log(`[email:welcome] to=${email} username=${username}`)
    return
  }

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Welcome to Bats Club 🦇",
    html,
  })
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const html = wrap(`
    <h1 style="font-size:20px;font-weight:900;color:#fff;margin:0 0 8px">Reset your password</h1>
    <p style="color:rgba(240,224,224,0.5);font-size:15px;line-height:1.6;margin:0 0 24px">
      You requested a password reset. Click the link below to set a new password.
      Link expires in 1 hour. If you didn't request this, ignore this email.
    </p>
    <div style="margin:0 0 8px">
      ${btn(resetUrl, "Reset Password")}
    </div>
  `)

  if (!process.env.RESEND_API_KEY) {
    console.log(`[email:reset] link=${resetUrl} to=${email}`)
    return
  }

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Reset your Bats Club password",
    html,
  })
}

export async function sendOrderConfirmationEmail(
  email: string,
  figureName: string,
  price: number,
  country: string,
) {
  const html = wrap(`
    <h1 style="font-size:20px;font-weight:900;color:#fff;margin:0 0 8px">Order confirmed 🦇</h1>
    <p style="color:rgba(240,224,224,0.5);font-size:15px;line-height:1.6;margin:0 0 24px">
      Thank you for your purchase! Your order has been confirmed.
      We will contact you with shipping details and tracking number once your figure is dispatched.
    </p>
    <div style="background:rgba(255,45,120,0.08);border:1px solid rgba(255,45,120,0.25);border-radius:8px;padding:16px;margin:0 0 24px">
      <p style="margin:0 0 8px;font-size:14px"><strong style="color:#fff">Figure:</strong> <span style="color:rgba(240,224,224,0.6)">${figureName}</span></p>
      <p style="margin:0 0 8px;font-size:14px"><strong style="color:#fff">Price:</strong> <span style="color:#ff2d78">$${(price / 100).toFixed(2)}</span></p>
      <p style="margin:0;font-size:14px"><strong style="color:#fff">Shipping to:</strong> <span style="color:rgba(240,224,224,0.6)">${country}</span></p>
    </div>
    <p style="color:rgba(240,224,224,0.3);font-size:12px;margin:0">
      Questions? Email <a href="mailto:support@batsclub.com" style="color:#ff2d78;text-decoration:none">support@batsclub.com</a>
    </p>
  `)

  if (!process.env.RESEND_API_KEY) {
    console.log(`[email:order] figure=${figureName} price=${price} to=${email}`)
    return
  }

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Order confirmed — Bats Club 🦇",
    html,
  })
}

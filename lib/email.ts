import nodemailer from "nodemailer"

function getTransporter() {
  const host = process.env.SMTP_HOST
  const port = parseInt(process.env.SMTP_PORT || "587")
  const user = process.env.SMTP_USER
  const pass = process.env.SMTP_PASS

  if (!host || !user || !pass) return null

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  })
}

export async function sendPasswordResetEmail(email: string, resetUrl: string) {
  const transporter = getTransporter()

  const html = `
    <div style="font-family:sans-serif;max-width:480px;margin:0 auto;background:#0a0a0a;color:#e2e8f0;padding:32px;border-radius:12px;border:1px solid rgba(255,255,255,0.06)">
      <p style="font-size:36px;margin:0 0 16px">🦇</p>
      <h1 style="font-size:20px;font-weight:900;color:#fff;margin:0 0 8px">Bats Club</h1>
      <p style="color:rgba(255,255,255,0.4);margin:0 0 24px;font-size:14px">Password Reset</p>
      <p style="color:rgba(255,255,255,0.6);font-size:15px;line-height:1.6;margin:0 0 24px">
        We received a request to reset the password for your Bats Club account.
        Click the button below within <strong style="color:#fff">1 hour</strong> to set a new password.
      </p>
      <a href="${resetUrl}" style="display:inline-block;background:#ff2d78;color:#fff;font-weight:700;font-size:14px;padding:12px 28px;border-radius:8px;text-decoration:none">
        Reset Password
      </a>
      <p style="color:rgba(255,255,255,0.2);font-size:12px;margin:24px 0 0">
        If you didn't request this, you can safely ignore this email.
      </p>
    </div>
  `

  if (!transporter) {
    // Dev fallback: log the link to console
    console.log(`[Password Reset] Reset link for ${email}:\n${resetUrl}`)
    return
  }

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: email,
    subject: "Reset your Bats Club password",
    html,
  })
}

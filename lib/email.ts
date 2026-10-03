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
  itemName: string,
  price: number,
  country: string,
  downloadLinks: string[] = [],
) {
  const hasPhysicalShipping = !!country && country !== "—"
  const shipLine = hasPhysicalShipping
    ? `<p style="margin:8px 0 0;font-size:14px"><strong style="color:#fff">Shipping to:</strong> <span style="color:rgba(240,224,224,0.6)">${country}</span></p>`
    : ""
  const followUp = hasPhysicalShipping
    ? " We'll email you with tracking details as soon as it ships."
    : ""
  const downloadBlock = downloadLinks.length
    ? `
    <div style="background:rgba(255,45,120,0.08);border:1px solid rgba(255,45,120,0.25);border-radius:8px;padding:16px;margin:0 0 24px">
      <p style="margin:0 0 12px;font-size:14px;color:#fff;font-weight:700">Your download${downloadLinks.length > 1 ? "s" : ""}</p>
      ${downloadLinks.map((u) => btn(u, "Download PDF")).join(" ")}
      <p style="margin:12px 0 0;font-size:12px;color:rgba(240,224,224,0.35)">Available for 7 days. Personal use only — no resale or redistribution of the file.</p>
    </div>`
    : ""
  const html = wrap(`
    <h1 style="font-size:20px;font-weight:900;color:#fff;margin:0 0 8px">Order confirmed 🦇</h1>
    <p style="color:rgba(240,224,224,0.5);font-size:15px;line-height:1.6;margin:0 0 24px">
      Thank you for your purchase! Your order is confirmed.${followUp}
    </p>
    <div style="background:rgba(255,45,120,0.08);border:1px solid rgba(255,45,120,0.25);border-radius:8px;padding:16px;margin:0 0 24px">
      <p style="margin:0 0 8px;font-size:14px"><strong style="color:#fff">Item:</strong> <span style="color:rgba(240,224,224,0.6)">${itemName}</span></p>
      <p style="margin:0;font-size:14px"><strong style="color:#fff">Price:</strong> <span style="color:#ff2d78">$${(price / 100).toFixed(2)}</span></p>
      ${shipLine}
    </div>
    ${downloadBlock}
    <p style="color:rgba(240,224,224,0.3);font-size:12px;margin:0">
      Questions? Email <a href="mailto:support@batsclub.com" style="color:#ff2d78;text-decoration:none">support@batsclub.com</a>
    </p>
  `)

  if (!process.env.RESEND_API_KEY) {
    console.log(`[email:order] item=${itemName} price=${price} to=${email} downloads=${downloadLinks.length}`)
    return
  }

  await getResend().emails.send({
    from: FROM,
    to: email,
    subject: "Order confirmed — Bats Club 🦇",
    html,
  })
}

// ── Abandoned-checkout reminder ─────────────────────────────────────────

export type ReminderLocale = "en" | "ru" | "jp"

export interface ReminderItem {
  name: string
  imageUrl: string | null
  priceCents: number
  quantity: number
  condition: string | null
  href: string
}

const REMINDER_TEXT: Record<ReminderLocale, {
  subjectOne: (name: string) => string
  subjectMany: string
  heading: (first: string | null) => string
  intro: string
  introPartlySold: string
  completeBtn: string
  viewBtn: string
  condition: string
  shippingTo: (country: string) => string
  discount: string
  total: string
  oneOfAKind: string
  questions: string
  unsubscribe: string
}> = {
  en: {
    subjectOne: (name) => `${name} is still waiting for you 🦇`,
    subjectMany: "Your order is still waiting for you 🦇",
    heading: (first) => (first ? `Hi ${first}, your order is saved 🦇` : "Your order is saved 🦇"),
    intro: "You started checking out on Bats Club but didn't finish. No pressure, everything is just as you left it:",
    introPartlySold: "You started checking out on Bats Club but didn't finish. Part of your order has since been picked up by someone else, but these are still here:",
    completeBtn: "Complete my order",
    viewBtn: "Open in the shop",
    condition: "Condition",
    shippingTo: (c) => `Shipping to ${c}`,
    discount: "Shipping discount",
    total: "Total",
    oneOfAKind: "Just so you know: every piece in the archive is a single item. It's still here today, but once someone else picks it up, it's gone.",
    questions: "Questions about condition, photos or shipping? Just reply to this email, I read every one.",
    unsubscribe: "Don't want reminders like this? Reply \"unsubscribe\".",
  },
  ru: {
    subjectOne: (name) => `${name} всё ещё ждёт вас 🦇`,
    subjectMany: "Ваш заказ всё ещё ждёт вас 🦇",
    heading: (first) => (first ? `${first}, ваш заказ сохранён 🦇` : "Ваш заказ сохранён 🦇"),
    intro: "Вы начали оформлять заказ на Bats Club, но не завершили. Ничего страшного, всё осталось как было:",
    introPartlySold: "Вы начали оформлять заказ на Bats Club, но не завершили. Часть позиций уже купили, но эти ещё здесь:",
    completeBtn: "Завершить заказ",
    viewBtn: "Открыть в магазине",
    condition: "Состояние",
    shippingTo: (c) => `Доставка: ${c}`,
    discount: "Скидка на доставку",
    total: "Итого",
    oneOfAKind: "На всякий случай: каждая вещь в архиве в единственном экземпляре. Сегодня она ещё здесь, но если её купит кто-то другой, её больше не будет.",
    questions: "Вопросы про состояние, фото или доставку? Просто ответьте на это письмо, я читаю каждое.",
    unsubscribe: "Не хотите получать такие напоминания? Ответьте «unsubscribe».",
  },
  jp: {
    subjectOne: (name) => `${name}がまだお待ちしています 🦇`,
    subjectMany: "ご注文の商品がまだお待ちしています 🦇",
    heading: (first) => (first ? `${first}さん、ご注文は保存されています 🦇` : "ご注文は保存されています 🦇"),
    intro: "Bats Clubでご注文の手続きを始められましたが、まだ完了していません。ご安心ください、そのまま保存されています：",
    introPartlySold: "Bats Clubでご注文の手続きを始められましたが、まだ完了していません。一部の商品はすでに売れてしまいましたが、こちらはまだ在庫があります：",
    completeBtn: "注文を完了する",
    viewBtn: "ショップで見る",
    condition: "状態",
    shippingTo: (c) => `配送先：${c}`,
    discount: "送料割引",
    total: "合計",
    oneOfAKind: "ご参考までに：アーカイブの商品はすべて一点ものです。今日はまだありますが、他の方が購入されると無くなってしまいます。",
    questions: "状態、写真、配送についてご質問があれば、このメールにご返信ください。すべて目を通しています。",
    unsubscribe: "このようなリマインダーが不要な場合は「unsubscribe」とご返信ください。",
  },
}

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")
const usd = (cents: number) => `$${(cents / 100).toFixed(2)}`

/**
 * One reminder for an expired, unpaid Checkout Session. `ctaUrl` and every
 * item link point at the item pages on the site. When part of the cart sold
 * meanwhile, the original totals are omitted since they no longer apply.
 */
export async function sendCheckoutReminderEmail(opts: {
  email: string
  firstName: string | null
  locale: ReminderLocale
  items: ReminderItem[]
  partlySold: boolean
  ctaUrl: string
  countryName: string | null
  shippingCents: number
  discountCents: number
  allOneOfAKind: boolean
  idempotencyKey: string
}) {
  const t = REMINDER_TEXT[opts.locale]
  const showTotals = !opts.partlySold
  const itemsTotal = opts.items.reduce((n, i) => n + i.priceCents * i.quantity, 0)

  const itemBlocks = opts.items
    .map((i) => `
      ${i.imageUrl ? `<a href="${i.href}"><img src="${i.imageUrl}" alt="${esc(i.name)}" width="416" style="display:block;width:100%;height:auto;border-radius:6px;margin:0 0 12px" /></a>` : ""}
      <p style="margin:0 0 6px;font-size:15px;font-weight:700"><a href="${i.href}" style="color:#fff;text-decoration:none">${esc(i.name)}</a></p>
      ${i.condition ? `<p style="margin:0 0 6px;font-size:13px;color:rgba(240,224,224,0.5)">${t.condition}: ${esc(i.condition)}</p>` : ""}
      <p style="margin:0 0 16px;font-size:14px;color:rgba(240,224,224,0.6)">${usd(i.priceCents)}${i.quantity > 1 ? ` × ${i.quantity}` : ""}</p>`)
    .join("")

  const totals = showTotals
    ? `
      ${opts.countryName && opts.shippingCents > 0 ? `<p style="margin:0 0 6px;font-size:14px;color:rgba(240,224,224,0.6)">${t.shippingTo(esc(opts.countryName))}: ${usd(opts.shippingCents)}</p>` : ""}
      ${opts.discountCents > 0 ? `<p style="margin:0 0 6px;font-size:14px;color:#34d399">${t.discount}: −${usd(opts.discountCents)}</p>` : ""}
      <p style="margin:8px 0 0;font-size:15px;color:#ff2d78;font-weight:700">${t.total}: ${usd(itemsTotal + opts.shippingCents - opts.discountCents)}</p>`
    : ""

  const html = wrap(`
    <h1 style="font-size:20px;font-weight:900;color:#fff;margin:0 0 8px">${esc(t.heading(opts.firstName))}</h1>
    <p style="color:rgba(240,224,224,0.5);font-size:15px;line-height:1.6;margin:0 0 24px">${opts.partlySold ? t.introPartlySold : t.intro}</p>
    <div style="background:rgba(255,45,120,0.08);border:1px solid rgba(255,45,120,0.25);border-radius:8px;padding:16px;margin:0 0 24px">
      ${itemBlocks}
      ${totals}
    </div>
    ${btn(opts.ctaUrl, opts.items.length === 1 && !opts.partlySold ? t.completeBtn : t.viewBtn)}
    ${opts.allOneOfAKind ? `<p style="color:rgba(240,224,224,0.5);font-size:14px;line-height:1.6;margin:24px 0 0">${t.oneOfAKind}</p>` : ""}
    <p style="color:rgba(240,224,224,0.5);font-size:14px;line-height:1.6;margin:16px 0 0">${t.questions}</p>
    <p style="color:rgba(240,224,224,0.3);font-size:12px;margin:24px 0 0">${t.unsubscribe}</p>
  `)

  const subject = opts.items.length === 1 ? t.subjectOne(opts.items[0].name) : t.subjectMany

  if (!process.env.RESEND_API_KEY) {
    console.log(`[email:checkout-reminder] to=${opts.email} items=${opts.items.length} partlySold=${opts.partlySold}`)
    return
  }

  const { error } = await getResend().emails.send(
    { from: FROM, replyTo: "support@batsclub.com", to: opts.email, subject, html },
    { idempotencyKey: opts.idempotencyKey },
  )
  if (error) throw new Error(`Resend: ${error.message}`)
}

# 🦇 Bats Club — Anime Figure Archive & Shop

A Next.js 14 marketplace prototype for collecting, cataloguing, and buying anime scale figures.

## Features

- **Archive** — Figure cards with Schema.org structured data (name, series, character, manufacturer, scale, year, sculptor, material)
- **User States** — Mark figures as "Have It", "Wishlist", or "Want to Buy"
- **Public Profiles** — View any collector's collection by username
- **Shop** — Browse active listings with condition/price filters
- **Stripe Checkout** — Secure payments with fixed $15 shipping per order
- **Seller Admin** — Add/edit listings, upload photos, manage orders with status + tracking
- **CSV Import** — Bulk-import figures from a spreadsheet
- **Collector Spotlight** — Editorial articles linked to specific figures

## Stack

- **Next.js 14** (App Router, Server Components, Server Actions)
- **TypeScript**
- **Tailwind CSS** (dark anime aesthetic)
- **Prisma + SQLite**
- **NextAuth.js** (credentials)
- **Stripe Checkout**

---

## Setup

### 1. Install dependencies

```bash
cd bats-club
npm install
```

### 2. Configure environment

Copy `.env.local` and fill in your Stripe keys:

```bash
# .env.local is already created — edit the Stripe keys:
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### 3. Set up the database

```bash
npx prisma db push
npm run db:seed
```

### 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Seed Accounts

Seed credentials are defined in `prisma/seed.ts` — do not commit real passwords here.

---

## CSV Import Format

Navigate to **Admin → Import** and upload a CSV with these columns:

```csv
name,series,character,manufacturer,scale,year,sculptor,material
"Rem 1/7 Scale","Re:Zero","Rem","Good Smile Company","1/7",2017,"Takashi Inoue","PVC/ABS"
```

Required: `name`, `series`, `character`, `manufacturer`, `scale`, `year`
Optional: `sculptor`, `material`, `imageUrl`, `description`

---

## Stripe Webhook (local testing)

Use the Stripe CLI to forward webhooks to your local server:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the webhook signing secret and set `STRIPE_WEBHOOK_SECRET` in `.env.local`.

---

## Key Routes

| Path | Description |
|------|-------------|
| `/` | Figure archive |
| `/figures/[id]` | Figure detail with Schema.org JSON-LD |
| `/shop` | Active listings |
| `/shop/[id]` | Listing detail + checkout |
| `/profile/[username]` | Public collection profile |
| `/articles` | Collector Spotlight posts |
| `/articles/[slug]` | Article detail |
| `/admin` | Admin dashboard |
| `/admin/listings` | Manage listings |
| `/admin/orders` | Order management |
| `/admin/import` | CSV bulk import |
| `/admin/articles` | Manage articles |
| `/api/webhooks/stripe` | Stripe webhook endpoint |

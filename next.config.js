/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // SSRF/DoS hardening: the image optimizer fetches these URLs
    // server-side, so an open pattern lets it be used to probe internal
    // services and cloud metadata endpoints, or to hammer arbitrary
    // remote hosts through your own server (part of the Next.js Image
    // Optimizer DoS advisories). Locked to the two hosts actually in use,
    // confirmed against live DB data 2026-08-17 (486 figures + 397
    // listings all on Supabase storage; i.postimg.cc is only the
    // hardcoded welcome-article cover in scripts/seed-welcome.js /
    // app/api/admin/seed-welcome/route.ts, not currently live in any
    // article row but kept in case that seed endpoint runs again).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rnlnnunmzikpysstsywx.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "i.postimg.cc",
      },
    ],
    // Cost/latency tuning per Vercel's "reduce image optimization costs"
    // guide. Uploaded photo filenames carry a timestamp and are never
    // overwritten in place, so a 31-day optimizer cache is safe; Supabase
    // serves them with Cache-Control: no-cache, which would otherwise cap
    // the cache at the 4h default.
    minimumCacheTTL: 2678400,
    formats: ["image/webp"],
    qualities: [75],
    // Largest rendered photo is the ~50vw detail carousel; 2048/3840
    // variants were never needed.
    deviceSizes: [640, 750, 828, 1080, 1200, 1920],
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // Next.js 16 requires an explicit allowlist for every local image
    // path passed to next/image once localPatterns is set at all — plain
    // paths (logo.png, bat.png) need their own entry, and the 4 static
    // homepage figures under public/figures/ additionally need their
    // cache-busting ?v=3 query string allowlisted (prevents enumeration
    // attacks via arbitrary query strings).
    localPatterns: [
      {
        pathname: "/**",
      },
      {
        pathname: "/figures/**",
        search: "?v=3",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async headers() {
    return [
      {
        // Applies site-wide. No frame-ancestors/CSP restriction on the
        // Stripe checkout redirect flow — checkout itself happens on
        // Stripe's own domain, this site never embeds it in an iframe.
        source: "/:path*",
        headers: [
          // Clickjacking: nothing on this site is meant to be framed.
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          // The site uses none of these. Payment happens on Stripe's own
          // hosted Checkout page, so payment=() doesn't affect Apple/Google Pay.
          { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=(), usb=()" },
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // unsafe-inline for scripts: Next's inline flight/bootstrap
              // scripts + the gtag config snippet in app/layout.tsx. Removing
              // it needs per-request nonces, which would make every page
              // dynamic and undo the static/ISR caching.
              // unsafe-eval only in dev (Next HMR). Production was checked
              // without it on 2026-10-03: gtag.js and the GCR opt-in widget
              // load and send with zero CSP violations.
              // apis.google.com + gstatic: Google Customer Reviews opt-in
              // widget on /order/success (GoogleCustomerReviewsOptIn.tsx) —
              // platform.js loads from apis.google.com and pulls further
              // resources from gstatic.com; the survey modal itself renders
              // in an iframe from google.com.
              `script-src 'self' 'unsafe-inline'${process.env.NODE_ENV === "production" ? "" : " 'unsafe-eval'"} https://www.googletagmanager.com https://apis.google.com https://www.gstatic.com`,
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              // GA4 hit endpoints, per Google's CSP guide for GA4 + Google signals
              // (developers.google.com/tag-platform/security/guides/csp): gtag
              // sends to region1.*, analytics.google.com, www.google.com and
              // stats.g.doubleclick.net. Allowing only www.google-analytics.com
              // silently dropped nearly all GA4 traffic from 2026-08-11 to 2026-09-24.
              "connect-src 'self' https://*.google-analytics.com https://*.google.com https://*.g.doubleclick.net https://www.googletagmanager.com https://api.stripe.com",
              "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://www.google.com",
              "frame-ancestors 'none'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
            ].join("; "),
          },
        ],
      },
    ]
  },
}

module.exports = nextConfig

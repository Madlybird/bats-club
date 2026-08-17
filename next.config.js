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
    dangerouslyAllowSVG: false,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
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
          { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // unsafe-inline for scripts: gtag.js + the small inline
              // config snippet in app/layout.tsx. unsafe-eval is required
              // by Next.js dev/HMR and some framework internals.
              // apis.google.com + gstatic: Google Customer Reviews opt-in
              // widget on /order/success (GoogleCustomerReviewsOptIn.tsx) —
              // platform.js loads from apis.google.com and pulls further
              // resources from gstatic.com; the survey modal itself renders
              // in an iframe from google.com.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://apis.google.com https://www.gstatic.com",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://www.google-analytics.com https://api.stripe.com https://apis.google.com",
              "frame-src 'self' https://js.stripe.com https://checkout.stripe.com https://www.google.com",
              "frame-ancestors 'none'",
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

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // SSRF hardening: the image optimizer fetches these URLs server-side,
    // so an open `http://**` pattern lets it be used to probe internal
    // services and cloud metadata endpoints (e.g. 169.254.169.254, which
    // is plain http). We drop http entirely and never inline SVG.
    // NOTE: `https: **` still allows any HTTPS host so admin-entered figure
    // images keep working. For a full lockdown, replace it with an explicit
    // host allowlist (supabase + i.postimg.cc are the only ones in use).
    remotePatterns: [
      {
        protocol: "https",
        hostname: "rnlnnunmzikpysstsywx.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
      {
        protocol: "https",
        hostname: "**",
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

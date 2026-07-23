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
  async redirects() {
    const hiddenFigureIds = [
      "c36e619e-3a31-45ae-8683-0ff079a2c095",
      "247703db-1b52-4447-abb2-95a0a778a62f",
    ]
    return hiddenFigureIds.flatMap((id) => [
      { source: `/figures/${id}`, destination: "/archive", permanent: true },
      { source: `/jp/figures/${id}`, destination: "/jp/archive", permanent: true },
      { source: `/ru/figures/${id}`, destination: "/ru/archive", permanent: true },
    ])
  },
}

module.exports = nextConfig

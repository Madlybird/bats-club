/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
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
      {
        protocol: "http",
        hostname: "**",
      },
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  async redirects() {
    const hiddenFigureIds = [
      "c36e619e-3a31-45ae-8683-0ff079a2c095",
    ]
    return hiddenFigureIds.flatMap((id) => [
      { source: `/figures/${id}`, destination: "/archive", permanent: true },
      { source: `/jp/figures/${id}`, destination: "/jp/archive", permanent: true },
      { source: `/ru/figures/${id}`, destination: "/ru/archive", permanent: true },
    ])
  },
}

module.exports = nextConfig

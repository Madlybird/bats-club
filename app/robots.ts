import { MetadataRoute } from "next"

// Both this file and public/robots.txt used to exist at once — Next.js
// silently serves this one and ignores the static file, so the bot
// blocklist that only lived in public/robots.txt was never actually
// applied in prod. Merged here so it's the single source of truth.
const BLOCKED_BOTS = [
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "GPTBot",
  "ClaudeBot",
  "anthropic-ai",
  "PerplexityBot",
  "Google-Extended",
  "CCBot",
  "Bytespider",
  "Amazonbot",
  "FacebookBot",
  "Applebot-Extended",
]

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      ...BLOCKED_BOTS.map((userAgent) => ({ userAgent, disallow: "/" })),
      { userAgent: "*", crawlDelay: 10, allow: "/" },
    ],
    sitemap: "https://batsclub.com/sitemap.xml",
  }
}

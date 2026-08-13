import { MetadataRoute } from "next"

// Both this file and public/robots.txt used to exist at once — Next.js
// silently serves this one and ignores the static file, so the bot
// blocklist that only lived in public/robots.txt was never actually
// applied in prod. Merged here so it's the single source of truth.
//
// AI-assistant/answer-engine crawlers (GPTBot, ClaudeBot, anthropic-ai,
// PerplexityBot, Google-Extended, CCBot, Applebot-Extended) were removed
// from this list 2026-08-13 — they'd been lumped in with SEO scrapers,
// which meant ChatGPT/Claude/Perplexity/Gemini/Apple Intelligence could
// never read the site to recommend it. GA4's "AI Assistant" channel
// already showed the best engagement of any source despite the block.
const BLOCKED_BOTS = [
  "AhrefsBot",
  "SemrushBot",
  "MJ12bot",
  "DotBot",
  "Bytespider",
  "Amazonbot",
  "FacebookBot",
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

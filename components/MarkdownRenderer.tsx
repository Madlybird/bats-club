import React from "react"

type Block =
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] }
  | { type: "p"; text: string }
  | { type: "img"; alt: string; src: string; href?: string; caption?: string }
  | { type: "tags"; items: string[] }
  | { type: "divider" }

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n")
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i].trim()
    if (!line) { i++; continue }

    // Linked photo, optional caption: [![alt](src "caption")](href)
    const linkedImg = line.match(/^\[!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)\]\(([^)]+)\)$/)
    // Plain photo, optional caption: ![alt](src "caption")
    const plainImg = !linkedImg && line.match(/^!\[([^\]]*)\]\(([^\s)]+)(?:\s+"([^"]*)")?\)$/)
    // Spec/tag row: {Manufacturer|Year|Scale}
    const tagRow = line.match(/^\{(.+)\}$/)
    // Section divider
    const isDivider = line === "***"

    if (linkedImg) {
      blocks.push({ type: "img", alt: linkedImg[1], src: linkedImg[2], caption: linkedImg[3], href: linkedImg[4] })
      i++
    } else if (plainImg) {
      blocks.push({ type: "img", alt: plainImg[1], src: plainImg[2], caption: plainImg[3] })
      i++
    } else if (isDivider) {
      blocks.push({ type: "divider" })
      i++
    } else if (tagRow) {
      blocks.push({ type: "tags", items: tagRow[1].split("|").map((s) => s.trim()).filter(Boolean) })
      i++
    } else if (line.startsWith("## ")) {
      blocks.push({ type: "h2", text: line.slice(3).trim() })
      i++
    } else if (line.startsWith("> ")) {
      const parts: string[] = []
      while (i < lines.length && lines[i].startsWith("> ")) {
        parts.push(lines[i].slice(2))
        i++
      }
      blocks.push({ type: "quote", text: parts.join(" ") })
    } else if (line.startsWith("- ")) {
      const items: string[] = []
      while (i < lines.length && lines[i].startsWith("- ")) {
        items.push(lines[i].slice(2))
        i++
      }
      blocks.push({ type: "list", items })
    } else {
      blocks.push({ type: "p", text: line })
      i++
    }
  }
  return blocks
}

function renderInline(text: string): React.ReactNode[] {
  const nodes: React.ReactNode[] = []
  const regex = /(\*\*[^*\n]+\*\*|\*[^*\n]+\*)/g
  let last = 0
  let match: RegExpExecArray | null
  let key = 0
  while ((match = regex.exec(text)) !== null) {
    if (match.index > last) nodes.push(text.slice(last, match.index))
    const tok = match[0]
    if (tok.startsWith("**")) {
      nodes.push(<strong key={`b${key++}`} className="font-bold text-white">{tok.slice(2, -2)}</strong>)
    } else {
      nodes.push(<em key={`i${key++}`}>{tok.slice(1, -1)}</em>)
    }
    last = match.index + tok.length
  }
  if (last < text.length) nodes.push(text.slice(last))
  return nodes
}

interface Props {
  source: string
  className?: string
}

export default function MarkdownRenderer({ source, className }: Props) {
  const blocks = parseMarkdown(source || "")
  return (
    <div className={className} style={{ fontSize: 18, lineHeight: 1.8 }}>
      {blocks.map((block, i) => {
        if (block.type === "h2") {
          const numbered = block.text.match(/^(\d{2})\.\s+(.+)$/)
          return (
            <h2
              key={i}
              className="font-bold tracking-tight flex items-baseline gap-3"
              style={{ color: "#ff2d78", fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}
            >
              {numbered ? (
                <>
                  <span className="text-white/25 font-black" style={{ fontVariantNumeric: "tabular-nums", fontSize: "1.1rem" }}>
                    {numbered[1]}
                  </span>
                  <span>{renderInline(numbered[2])}</span>
                </>
              ) : (
                renderInline(block.text)
              )}
            </h2>
          )
        }
        if (block.type === "quote") {
          return (
            <blockquote
              key={i}
              className="italic"
              style={{
                borderLeft: "4px solid #ff2d78",
                paddingLeft: "1rem",
                color: "rgba(255,255,255,0.55)",
                margin: "1.5rem 0",
              }}
            >
              {renderInline(block.text)}
            </blockquote>
          )
        }
        if (block.type === "tags") {
          return (
            <div key={i} className="flex flex-wrap gap-2 mt-1 mb-3">
              {block.items.map((t, j) => (
                <span key={j} className="badge badge-pink">{t}</span>
              ))}
            </div>
          )
        }
        if (block.type === "divider") {
          return (
            <div key={i} className="flex items-center gap-3 my-10">
              <span className="flex-1 h-px bg-white/[0.08]" />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/bat.png" alt="" width={20} height={20} style={{ opacity: 0.35 }} />
              <span className="flex-1 h-px bg-white/[0.08]" />
            </div>
          )
        }
        if (block.type === "img") {
          const frameClass = "block my-6 rounded-2xl overflow-hidden border border-white/[0.06]" +
            (block.href ? " hover:border-[#ff2d78]/30 transition-colors group" : "")
          const photo = (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={block.src}
              alt={block.alt}
              loading="lazy"
              style={{ width: "100%", maxHeight: 440, objectFit: "contain", display: "block" }}
            />
          )
          const caption = (block.caption || block.href) && (
            <div className="flex items-center justify-between gap-3 px-4 py-2.5 border-t border-white/[0.06]">
              <span className="text-xs text-white/30 uppercase tracking-wider">{block.caption}</span>
              {block.href && (
                <span className="text-xs font-medium whitespace-nowrap" style={{ color: "#ff2d78" }}>
                  View this piece →
                </span>
              )}
            </div>
          )
          if (block.href) {
            return (
              <a key={i} href={block.href} target="_blank" rel="noopener noreferrer" className={frameClass} style={{ background: "rgba(255,255,255,0.02)" }}>
                {photo}
                {caption}
              </a>
            )
          }
          return (
            <div key={i} className={frameClass} style={{ background: "rgba(255,255,255,0.02)" }}>
              {photo}
              {caption}
            </div>
          )
        }
        if (block.type === "list") {
          return (
            <ul key={i} className="list-disc pl-6 my-4 space-y-1 text-white/75 marker:text-[#ff2d78]">
              {block.items.map((item, j) => (
                <li key={j}>{renderInline(item)}</li>
              ))}
            </ul>
          )
        }
        return (
          <p key={i} className="text-white/75 my-4">
            {renderInline(block.text)}
          </p>
        )
      })}
    </div>
  )
}

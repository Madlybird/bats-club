import React from "react"

type Block =
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] }
  | { type: "p"; text: string }

export function parseMarkdown(md: string): Block[] {
  const lines = md.replace(/\r\n/g, "\n").split("\n")
  const blocks: Block[] = []
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    if (!line.trim()) { i++; continue }

    if (line.startsWith("## ")) {
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
          return (
            <h2
              key={i}
              className="font-bold tracking-tight"
              style={{ color: "#ff2d78", fontSize: "1.75rem", marginTop: "2rem", marginBottom: "1rem" }}
            >
              {renderInline(block.text)}
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

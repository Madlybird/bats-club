"use client"

import { useRef } from "react"
import MarkdownRenderer from "@/components/MarkdownRenderer"

interface Props {
  value: string
  onChange: (v: string) => void
  placeholder?: string
  className?: string
}

export default function MarkdownEditor({ value, onChange, placeholder, className }: Props) {
  const ref = useRef<HTMLTextAreaElement | null>(null)

  const wrapSelection = (open: string, close: string = open) => {
    const ta = ref.current
    if (!ta) return
    const { selectionStart: s, selectionEnd: e } = ta
    const before = value.slice(0, s)
    const selected = value.slice(s, e) || "text"
    const after = value.slice(e)
    const next = `${before}${open}${selected}${close}${after}`
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      const pos = s + open.length
      ta.setSelectionRange(pos, pos + selected.length)
    })
  }

  const prefixLine = (prefix: string) => {
    const ta = ref.current
    if (!ta) return
    const { selectionStart: s, selectionEnd: e } = ta
    const lineStart = value.lastIndexOf("\n", s - 1) + 1
    const line = value.slice(lineStart, value.indexOf("\n", s) === -1 ? value.length : value.indexOf("\n", s))

    // If already prefixed, leave as-is; otherwise prepend.
    let next: string
    let delta = 0
    if (line.startsWith(prefix)) {
      next = value
    } else {
      next = value.slice(0, lineStart) + prefix + value.slice(lineStart)
      delta = prefix.length
    }
    onChange(next)
    requestAnimationFrame(() => {
      ta.focus()
      ta.setSelectionRange(s + delta, e + delta)
    })
  }

  const btnCls =
    "px-2.5 py-1.5 text-xs font-medium text-slate-300 bg-[#0a0a12] border border-[#1a1a3a] hover:border-violet-600 hover:text-white rounded-md transition-colors"

  return (
    <div className={className}>
      <div className="flex flex-wrap gap-1.5 mb-2">
        <button type="button" onClick={() => wrapSelection("**")} className={btnCls} title="Bold">
          <strong>B</strong>
        </button>
        <button type="button" onClick={() => wrapSelection("*")} className={`${btnCls} italic`} title="Italic">
          I
        </button>
        <button type="button" onClick={() => prefixLine("## ")} className={btnCls} title="Heading">
          ## Heading
        </button>
        <button type="button" onClick={() => prefixLine("> ")} className={btnCls} title="Quote">
          {"> Quote"}
        </button>
        <button type="button" onClick={() => prefixLine("- ")} className={btnCls} title="List">
          - List
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <textarea
          ref={ref}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full bg-[#0a0a12] border border-[#1a1a3a] text-slate-200 rounded-lg px-3 py-2.5 focus:outline-none focus:border-violet-600 transition-colors placeholder-slate-600 min-h-[400px] resize-y font-mono text-sm"
          placeholder={placeholder}
        />
        <div className="bg-[#05050a] border border-[#1a1a3a] rounded-lg p-4 min-h-[400px] overflow-y-auto">
          <p className="text-[10px] uppercase tracking-wider text-slate-500 mb-3">Live preview</p>
          {value.trim() ? (
            <MarkdownRenderer source={value} />
          ) : (
            <p className="text-slate-600 text-sm italic">Nothing to preview yet.</p>
          )}
        </div>
      </div>
    </div>
  )
}

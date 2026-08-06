"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"

const STORAGE_KEY = "bats_age_verified"
const EVENT_NAME = "bats:age-verified"

export interface AgeGateLabels {
  badge: string
  title: string
  body: string
  confirm: string
  deny: string
}

/** Tracks whether the visitor has already confirmed 18+ (localStorage,
 *  shared across every gate on the page via a same-tab custom event). */
function useAgeVerified() {
  const [verified, setVerified] = useState(false)

  useEffect(() => {
    if (window.localStorage.getItem(STORAGE_KEY) === "1") setVerified(true)
    const onVerified = () => setVerified(true)
    window.addEventListener(EVENT_NAME, onVerified)
    return () => window.removeEventListener(EVENT_NAME, onVerified)
  }, [])

  const confirm = () => {
    window.localStorage.setItem(STORAGE_KEY, "1")
    window.dispatchEvent(new Event(EVENT_NAME))
    setVerified(true)
  }

  return { verified, confirm }
}

function AgeGateModal({ labels, onConfirm, onDeny }: { labels: AgeGateLabels; onConfirm: () => void; onDeny: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4"
      onClick={onDeny}
    >
      <div
        className="max-w-sm w-full rounded-2xl border border-white/10 p-6 text-center"
        style={{ background: "#0a0a12" }}
        onClick={(e) => e.stopPropagation()}
      >
        <p className="text-2xl mb-2">🔞</p>
        <h3 className="text-lg font-bold text-white mb-2">{labels.title}</h3>
        <p className="text-sm text-white/50 mb-6">{labels.body}</p>
        <div className="flex flex-col gap-2">
          <button
            onClick={onConfirm}
            className="w-full py-2.5 rounded-lg font-bold text-white transition-colors"
            style={{ backgroundColor: "#ff2d78" }}
          >
            {labels.confirm}
          </button>
          <button
            onClick={onDeny}
            className="w-full py-2.5 rounded-lg font-medium text-white/60 border border-white/10 hover:text-white transition-colors"
          >
            {labels.deny}
          </button>
        </div>
      </div>
    </div>
  )
}

/** Card-grid thumbnail (archive/shop listings): wraps a Link, blurs the
 *  image, and only navigates once the visitor confirms their age.
 *  Needs a sized, positioned container (e.g. `relative aspect-square`). */
export function AgeGateLink({
  isMature,
  href,
  labels,
  className,
  style,
  overlay,
  children,
}: {
  isMature: boolean
  href: string
  labels: AgeGateLabels
  className?: string
  style?: React.CSSProperties
  /** Extra elements rendered on top, never blurred (e.g. a price badge). */
  overlay?: React.ReactNode
  children: React.ReactNode
}) {
  const router = useRouter()
  const { verified, confirm } = useAgeVerified()
  const [showModal, setShowModal] = useState(false)

  if (!isMature || verified) {
    return (
      <Link href={href} className={className} style={style}>
        {children}
        {overlay}
      </Link>
    )
  }

  const onConfirm = () => {
    confirm()
    setShowModal(false)
    router.push(href)
  }

  return (
    <>
      <div
        role="button"
        tabIndex={0}
        onClick={() => setShowModal(true)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") setShowModal(true)
        }}
        className={`${className ?? ""} cursor-pointer`}
        style={style}
      >
        <div className="absolute inset-0 overflow-hidden [filter:blur(18px)] scale-110 pointer-events-none select-none">
          {children}
        </div>
        <span className="absolute top-2 left-2 z-10 badge bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/20">
          {labels.badge}
        </span>
        {overlay}
      </div>
      {showModal && <AgeGateModal labels={labels} onConfirm={onConfirm} onDeny={() => setShowModal(false)} />}
    </>
  )
}

/** Plain-text link variant (e.g. a card's title below the thumbnail) —
 *  no blur box, just withholds navigation until age is confirmed. */
export function AgeGateTextLink({
  isMature,
  href,
  labels,
  className,
  children,
}: {
  isMature: boolean
  href: string
  labels: AgeGateLabels
  className?: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const { verified, confirm } = useAgeVerified()
  const [showModal, setShowModal] = useState(false)

  if (!isMature || verified) {
    return (
      <Link href={href} className={className}>
        {children}
      </Link>
    )
  }

  const onConfirm = () => {
    confirm()
    setShowModal(false)
    router.push(href)
  }

  return (
    <>
      <div role="button" tabIndex={0} onClick={() => setShowModal(true)} className={`${className ?? ""} cursor-pointer`}>
        {children}
      </div>
      {showModal && <AgeGateModal labels={labels} onConfirm={onConfirm} onDeny={() => setShowModal(false)} />}
    </>
  )
}

/** Detail-page usage (figure/listing gallery): blurs the content in
 *  place and reveals it after confirmation, no navigation involved.
 *  Covers deep links that skip the card grid entirely. */
export function AgeGateReveal({
  isMature,
  labels,
  className,
  children,
}: {
  isMature: boolean
  labels: AgeGateLabels
  className?: string
  children: React.ReactNode
}) {
  const { verified, confirm } = useAgeVerified()
  const [showModal, setShowModal] = useState(false)

  if (!isMature || verified) {
    return <div className={className}>{children}</div>
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="overflow-hidden [filter:blur(24px)] scale-110 pointer-events-none select-none">{children}</div>
      <button onClick={() => setShowModal(true)} className="absolute inset-0 z-20 flex items-center justify-center">
        <span className="badge bg-black/80 text-white text-sm font-bold px-4 py-2 rounded-full border border-white/20">
          {labels.badge}
        </span>
      </button>
      {showModal && <AgeGateModal labels={labels} onConfirm={confirm} onDeny={() => setShowModal(false)} />}
    </div>
  )
}

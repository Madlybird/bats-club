"use client"

import { useEffect, useState } from "react"
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
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
      <div className="max-w-sm w-full rounded-2xl border border-white/10 p-6 text-center" style={{ background: "#0a0a12" }}>
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

/** Card-grid thumbnail (archive/shop listings): purely visual — blurs
 *  the image + shows a "18+" badge. No click interception, the actual
 *  age check happens on the detail page after navigating there. */
export function MatureBlur({
  isMature,
  labels,
  children,
}: {
  isMature: boolean
  labels: AgeGateLabels
  children: React.ReactNode
}) {
  const { verified } = useAgeVerified()

  if (!isMature || verified) return <>{children}</>

  return (
    <>
      <div className="absolute inset-0 overflow-hidden [filter:blur(18px)] scale-110 pointer-events-none select-none">
        {children}
      </div>
      <span className="absolute top-2 left-2 z-10 badge bg-black/80 text-white text-[10px] font-bold px-2 py-1 rounded-full border border-white/20">
        {labels.badge}
      </span>
    </>
  )
}

/** Detail-page usage (figure/listing gallery): blurs the content and
 *  immediately pops the confirmation modal on landing. "Yes" reveals
 *  in place; "No" (or dismissing the modal) navigates back to `backHref`. */
export function AgeGateReveal({
  isMature,
  labels,
  className,
  backHref,
  children,
}: {
  isMature: boolean
  labels: AgeGateLabels
  className?: string
  backHref: string
  children: React.ReactNode
}) {
  const router = useRouter()
  const { verified, confirm } = useAgeVerified()
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    if (isMature && !verified) setShowModal(true)
  }, [isMature, verified])

  if (!isMature || verified) {
    return <div className={className}>{children}</div>
  }

  const deny = () => {
    setShowModal(false)
    router.push(backHref)
  }

  return (
    <div className={`relative ${className ?? ""}`}>
      <div className="overflow-hidden [filter:blur(24px)] scale-110 pointer-events-none select-none">{children}</div>
      {showModal && <AgeGateModal labels={labels} onConfirm={confirm} onDeny={deny} />}
    </div>
  )
}

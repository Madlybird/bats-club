"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react"
import { useSession } from "next-auth/react"

type StatusMap = Record<string, string>

interface UserFiguresContextValue {
  /** figureId -> status ("HAVE" | "WISHLIST" | "BUY"). Empty when logged out. */
  statuses: StatusMap
  /** True while the initial fetch is in flight (only relevant when logged in). */
  loading: boolean
  /** Optimistically set/clear a status — used by StatusButton after a successful API call. */
  setStatus: (figureId: string, status: string | null) => void
}

const UserFiguresContext = createContext<UserFiguresContextValue>({
  statuses: {},
  loading: false,
  setStatus: () => {},
})

export function UserFiguresProvider({ children }: { children: ReactNode }) {
  const { status: sessionStatus } = useSession()
  const [statuses, setStatuses] = useState<StatusMap>({})
  const [loading, setLoading] = useState(false)
  const fetchedFor = useRef<string | null>(null)

  useEffect(() => {
    if (sessionStatus !== "authenticated") {
      if (sessionStatus === "unauthenticated") {
        setStatuses({})
        fetchedFor.current = null
      }
      return
    }
    // Fetch once per authenticated session — the result is held in memory
    // and kept in sync by setStatus() after each StatusButton mutation.
    if (fetchedFor.current === "done") return
    fetchedFor.current = "done"
    setLoading(true)
    fetch("/api/user-figures/statuses", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : {}))
      .then((map) => {
        if (map && typeof map === "object") setStatuses(map as StatusMap)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [sessionStatus])

  const setStatus = useCallback((figureId: string, status: string | null) => {
    setStatuses((prev) => {
      const next = { ...prev }
      if (status) next[figureId] = status
      else delete next[figureId]
      return next
    })
  }, [])

  // Memo the value so the provider doesn't hand a fresh object to all
  // consumers (~100 StatusButtons on /archive) on every parent render.
  const value = useMemo(
    () => ({ statuses, loading, setStatus }),
    [statuses, loading, setStatus],
  )

  return (
    <UserFiguresContext.Provider value={value}>
      {children}
    </UserFiguresContext.Provider>
  )
}

export function useUserFigureStatus(figureId: string): string | null {
  const { statuses } = useContext(UserFiguresContext)
  return statuses[figureId] ?? null
}

export function useUserFiguresActions() {
  const { setStatus } = useContext(UserFiguresContext)
  return { setStatus }
}

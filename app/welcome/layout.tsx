import { Metadata } from "next"

// Auth/account utility pages have no search value and were showing up
// as noise in GSC's indexing report (Google guessing locale-prefixed
// variants that never existed, e.g. /ru/forgot-password before it was
// built). Keep them out of the index entirely.
export const metadata: Metadata = {
  robots: { index: false, follow: false },
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children
}

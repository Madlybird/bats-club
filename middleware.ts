import { withAuth } from "next-auth/middleware"
import { NextResponse } from "next/server"

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token
    const pathname = req.nextUrl.pathname

    if (pathname.startsWith("/admin")) {
      if (!token?.isAdmin) {
        return NextResponse.redirect(new URL("/login", req.url))
      }
    }

    return NextResponse.next()
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname
        if (pathname.startsWith("/admin")) {
          return !!token?.isAdmin
        }
        return !!token
      },
    },
  }
)

// Profile view pages are public; the edit pages do their own server-side
// auth check via getServerSession, so we only gate /admin here.
export const config = {
  matcher: ["/admin/:path*"],
}

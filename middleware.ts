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

export const config = {
  matcher: ["/admin/:path*", "/profile/:path*"],
}

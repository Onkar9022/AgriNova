import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Block non-ADMIN users from /admin/* routes
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Block ADMIN users from farmer-specific routes (except profile)
    if (
      !pathname.startsWith("/admin") &&
      !pathname.startsWith("/api") &&
      !pathname.startsWith("/profile") &&
      token?.role === "ADMIN"
    ) {
      return NextResponse.redirect(new URL("/admin/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token }) => {
        return !!token;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/soil-analysis/:path*",
    "/history/:path*",
    "/admin/:path*",
    "/results/:path*",
    "/profile/:path*",
  ],
};

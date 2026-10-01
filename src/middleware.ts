import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { COOKIE_NAME, decodeSession } from "@/lib/session";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = await decodeSession(request.cookies.get(COOKIE_NAME)?.value);

  // Protect page routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/app")) {
    if (!session) {
      const login = new URL("/login", request.url);
      login.searchParams.set("next", pathname);
      return NextResponse.redirect(login);
    }
    if (pathname.startsWith("/admin") && session.role === "staff") {
      return NextResponse.redirect(new URL("/app/dashboard", request.url));
    }
    if (pathname.startsWith("/app") && session.role !== "staff" && !pathname.startsWith("/app/")) {
      // allow admins only on /app if needed — staff shell is for staff
    }
  }

  if (pathname === "/login" && session) {
    const dest = session.role === "staff" ? "/app/dashboard" : "/admin/dashboard";
    return NextResponse.redirect(new URL(dest, request.url));
  }

  // API: /me/* requires auth; staff-only enforced in handlers
  if (pathname.startsWith("/api/v1/me") && !session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Sign in required" },
      { status: 401 },
    );
  }

  if (pathname.startsWith("/api/v1/admin") && !session) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Sign in required" },
      { status: 401 },
    );
  }

  if (pathname.startsWith("/api/v1/admin") && session?.role === "staff") {
    return NextResponse.json(
      { code: "FORBIDDEN", message: "Admin access required" },
      { status: 403 },
    );
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/login", "/admin/:path*", "/app/:path*", "/api/v1/me/:path*", "/api/v1/admin/:path*"],
};
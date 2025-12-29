import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token")?.value || null;
  const pathname = request.nextUrl.pathname;

  /**
   * ✅ PUBLIC INVOICE ROUTES (CUSTOMER)
   * - /invoice/:id
   * - /invoice/:id/pdf
   */
  if (pathname.startsWith("/invoice/")) {
    return NextResponse.next();
  }

  /**
   * ✅ PUBLIC ASSETS & NEXT INTERNAL
   */
  if (
    pathname.startsWith("/assets/") ||
    pathname === "/favicon.ico" ||
    pathname === "/icon.png" ||
    pathname === "/apple-icon.png" ||
    pathname === "/manifest.json" ||
    pathname.startsWith("/_next/")
  ) {
    return NextResponse.next();
  }

  /**
   * ✅ ALLOW NEXT INTERNAL API (proxy, route handlers)
   */
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  /**
   * ✅ AUTH PAGE LOGIC
   */
  const isAuthPage = pathname.startsWith("/login");

  // Kalau sudah login, jangan masuk login lagi
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // Kalau belum login dan bukan halaman public → redirect login
  if (!isAuthPage && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|icon.png|manifest.json).*)",
  ],
};

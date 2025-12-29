import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token")?.value || null;
  const pathname = request.nextUrl.pathname;

  // ✅ Allow akses langsung ke asset public
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

  // ✅ Allow API route (hindari blocking)
  if (pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  // ✅ ✅ ✅ PUBLIC ROUTE: Invoice Customer (Tidak butuh login)
  // /invoice/2
  // /invoice/2/pdf
  if (pathname.startsWith("/invoice/")) {
    return NextResponse.next();
  }

  // LOGIN PAGE
  const isAuthPage = pathname.startsWith("/login");

  // kalau sudah login, jangan bisa ke login lagi
  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  // kalau belum login, redirect ke login
  if (!isAuthPage && !token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|api|assets|favicon.ico|icon.png|manifest.json).*)",
  ],
};

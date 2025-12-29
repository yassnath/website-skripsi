import { NextResponse } from "next/server";

export function middleware(request) {
  const token = request.cookies.get("token")?.value || null;
  const pathname = request.nextUrl.pathname;

  // ✅ PUBLIC INVOICE VIEW: tidak perlu login
  if (pathname.startsWith("/invoice/")) {
    return NextResponse.next();
  }

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

  // LOGIN PAGE
  const isAuthPage = pathname.startsWith("/login");

  if (isAuthPage && token) {
    return NextResponse.redirect(new URL("/", request.url));
  }

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

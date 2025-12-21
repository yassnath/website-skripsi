import { NextResponse } from "next/server";

export function middleware(req) {
  const { pathname } = req.nextUrl;

  // Boleh akses halaman login
  if (pathname.startsWith("/login")) {
    return NextResponse.next();
  }

  // Baca token dari localStorage yang di-inject lewat header (client must send)
  const authHeader = req.headers.get("authorization");

  // Jika tidak ada Authorization → redirect login
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    const url = new URL("/login", req.url);
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/",
    "/dashboard/:path*",
    "/invoice-list/:path*",
    "/invoice/:path*",
  ],
};

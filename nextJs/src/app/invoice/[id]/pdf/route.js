import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { id } = params;

  const apiBase =
    (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080").replace(
      /\/+$/,
      ""
    );

  // ✅ langsung redirect ke backend PDF public
  return NextResponse.redirect(`${apiBase}/api/public/invoices/${id}/pdf`);
}

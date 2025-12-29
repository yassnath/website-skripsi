export const runtime = "nodejs";

export async function GET(_req, { params }) {
  const id = params?.id;

  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  if (!API_BASE) {
    return new Response("NEXT_PUBLIC_API_URL belum diset", { status: 500 });
  }

  // ✅ Ambil PDF publik dari backend Laravel
  const upstream = `${API_BASE}/api/public/invoices/${id}/pdf`;

  const res = await fetch(upstream, {
    method: "GET",
    cache: "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    return new Response(text || "PDF tidak ditemukan", { status: res.status });
  }

  const contentType = res.headers.get("content-type") || "application/pdf";
  const disposition =
    res.headers.get("content-disposition") ||
    `inline; filename="invoice-${id}.pdf"`;

  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": contentType,
      "Content-Disposition": disposition,
      "Cache-Control": "no-store",
    },
  });
}

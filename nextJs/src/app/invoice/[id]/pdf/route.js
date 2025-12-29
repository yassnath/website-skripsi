export const runtime = "nodejs";

export async function GET(req, { params }) {
  const id = params?.id;
  const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "").replace(/\/+$/, "");

  if (!API_BASE) {
    return new Response("NEXT_PUBLIC_API_URL belum diset", { status: 500 });
  }

  const upstream = `${API_BASE}/api/public/invoices/${id}/pdf`;

  const res = await fetch(upstream, {
    method: "GET",
    headers: {
      Accept: "application/pdf",
    },
    cache: "no-store",
  });

  // ✅ kalau backend balikin JSON error
  const contentType = res.headers.get("content-type") || "";
  if (!res.ok) {
    const errText = await res.text();
    return new Response(errText || "PDF error", { status: res.status });
  }

  // ✅ pastikan benar-benar PDF
  if (!contentType.includes("pdf")) {
    const txt = await res.text();
    return new Response(txt, { status: 500 });
  }

  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

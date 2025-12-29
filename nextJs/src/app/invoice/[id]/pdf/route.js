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
    headers: { Accept: "application/pdf,application/json,text/plain,*/*" },
    cache: "no-store",
  });

  const contentType = res.headers.get("content-type") || "";

  // ✅ kalau upstream error, forward isi error-nya biar kebaca
  if (!res.ok) {
    const errText = await res.text();
    return new Response(errText || "Upstream error", {
      status: res.status,
      headers: { "Content-Type": contentType || "text/plain" },
    });
  }

  // ✅ kalau bukan PDF, forward teksnya (biasanya JSON error)
  if (!contentType.includes("pdf")) {
    const txt = await res.text();
    return new Response(txt || "Upstream returned non-PDF", {
      status: 502,
      headers: { "Content-Type": contentType || "text/plain" },
    });
  }

  // ✅ normal: PDF stream
  return new Response(res.body, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${id}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}

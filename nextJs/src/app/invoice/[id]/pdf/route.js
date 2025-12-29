export async function GET(req, { params }) {
  const { id } = params;

  const API_BASE =
    process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  const cleanBase = API_BASE.replace(/\/+$/, "");

  const targetUrl = `${cleanBase}/api/invoices/${id}/pdf`;

  try {
    const res = await fetch(targetUrl, {
      method: "GET",
      headers: {
        Accept: "application/pdf",
      },
      cache: "no-store",
    });

    if (!res.ok) {
      return new Response(
        `PDF tidak ditemukan atau error di backend. Status: ${res.status}`,
        { status: res.status }
      );
    }

    const pdfBuffer = await res.arrayBuffer();

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="invoice-${id}.pdf"`,
      },
    });
  } catch (err) {
    return new Response("Gagal mengambil PDF dari backend.", { status: 500 });
  }
}

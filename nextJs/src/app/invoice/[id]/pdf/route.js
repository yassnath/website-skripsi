import { NextResponse } from "next/server";

export async function GET(req, { params }) {
  const { id } = params;

  const backend = process.env.BACKEND_INTERNAL_URL;
  if (!backend) {
    return new NextResponse("BACKEND_INTERNAL_URL not set", { status: 500 });
  }

  const url = `${backend.replace(/\/+$/, "")}/api/invoices/${id}/pdf`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/pdf",
    },
    cache: "no-store",
  });

  if (!res.ok) {
    return new NextResponse("PDF not found", { status: res.status });
  }

  const pdfBuffer = await res.arrayBuffer();

  return new NextResponse(pdfBuffer, {
    status: 200,
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="invoice-${id}.pdf"`,
    },
  });
}

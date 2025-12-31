"use client";

import { useEffect, useMemo, useState } from "react";

/**
 * ✅ ANIMASI MASUK (sama seperti page lain)
 */
function useCvAntPageIn() {
  const [pageIn, setPageIn] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setPageIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return pageIn;
}

const safeStr = (v, fallback = "-") =>
  v == null || String(v).trim() === "" ? fallback : String(v);

const formatDate = (dateStr) => {
  if (!dateStr) return "-";
  const d = new Date(dateStr);
  if (isNaN(d)) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

export default function InvoicePublicPreview({ id }) {
  const pageIn = useCvAntPageIn();

  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  /**
   * ✅ deteksi ukuran layar supaya UX di HP lebih masuk akal
   */
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  /**
   * ✅ API BASE dari ENV
   */
  const apiBase = useMemo(() => {
    let base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    return String(base).replace(/\/+$/, "");
  }, []);

  /**
   * ✅ URL PDF publik lewat route Next (proxy)
   * Route: /invoice/:id/pdf
   */
  const pdfUrl = useMemo(() => {
    if (!id) return "";
    return `/invoice/${id}/pdf`;
  }, [id]);

  /**
   * ✅ FETCH INVOICE (PUBLIC)
   */
  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        const res = await fetch(`${apiBase}/api/public/invoices/${id}`);
        const data = await res.json();
        if (!res.ok) throw new Error("Invoice tidak ditemukan.");
        setInvoice(data);
      } catch {
        setInvoice(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) fetchInvoice();
  }, [id, apiBase]);

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;

    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = invoice?.no_invoice
      ? `invoice-${invoice.no_invoice}.pdf`
      : `invoice-${id}.pdf`;

    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  if (loading) {
    return (
      <div className="container py-5 text-center text-muted">
        Memuat invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container py-5 text-center text-muted">
        Invoice tidak ditemukan.
      </div>
    );
  }

  return (
    <div className={`cvant-page-in ${pageIn ? "is-in" : ""}`}>
      <div className="py-3 py-md-4" style={{ background: "#1b2431" }}>
        <div className="container px-3 px-md-4 px-lg-0">
          {/* ✅ HEADER CARD */}
          <div
            className="rounded shadow-sm border border-secondary position-relative mb-3 overflow-hidden"
            style={{ background: "#273142" }}
          >
            <div className="p-3 p-md-4">
              {/* ✅ MOBILE: stack, DESKTOP: flex */}
              <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                {/* LEFT */}
                <div className="text-light">
                  <h5 className="fw-bold text-info mb-2">CV AS Nusa Trans</h5>
                  <div className="small text-light opacity-90">
                    Ruko Graha Kota Blok BB-07, Suko, Sidoarjo
                  </div>
                  <div className="small text-light opacity-90">
                    Email: asnusa.trans@gmail.com
                  </div>
                  <div className="small text-light opacity-90">
                    Telp: 0812-3425-9399
                  </div>
                </div>

                {/* RIGHT */}
                <div className="text-light text-md-end">
                  <h5 className="fw-bold mb-2 text-light">INVOICE</h5>
                  <div className="small">
                    <strong>No:</strong>{" "}
                    <span className="opacity-90">{safeStr(invoice.no_invoice)}</span>
                  </div>
                  <div className="small">
                    <strong>Tanggal:</strong>{" "}
                    <span className="opacity-90">{formatDate(invoice.tanggal)}</span>
                  </div>
                  <div className="small">
                    <strong>Jatuh Tempo:</strong>{" "}
                    <span className="opacity-90">
                      {invoice.due_date ? formatDate(invoice.due_date) : "-"}
                    </span>
                  </div>
                </div>
              </div>

              {/* divider */}
              <hr className="my-3 border-secondary" />

              {/* CUSTOMER + BUTTON */}
              <div className="d-flex flex-column flex-md-row justify-content-between gap-3">
                {/* Customer */}
                <div className="text-light">
                  <div className="small mb-1">
                    <strong>Kepada:</strong>{" "}
                    <span className="opacity-90">{safeStr(invoice.nama_pelanggan)}</span>
                  </div>
                  <div className="small">
                    <strong>Email:</strong>{" "}
                    <span className="opacity-90">{safeStr(invoice.email)}</span>
                  </div>
                </div>

                {/* ✅ Buttons: CONSISTENT seperti contoh kamu */}
                <div
                  className="d-flex align-items-center gap-2 flex-wrap"
                  style={{ justifyContent: isMobile ? "stretch" : "flex-end" }}
                >
                  <button
                    className="btn btn-sm btn-outline-primary d-inline-flex align-items-center justify-content-center"
                    onClick={handleDownloadPdf}
                    style={{
                      minWidth: isMobile ? "100%" : "150px",
                    }}
                  >
                    Download PDF
                  </button>

                  <a
                    className="btn btn-sm btn-outline-success d-inline-flex align-items-center justify-content-center"
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{
                      minWidth: isMobile ? "100%" : "150px",
                    }}
                  >
                    Open PDF
                  </a>
                </div>
              </div>

              {/* ✅ Alert khusus mobile */}
              {isMobile && (
                <div
                  className="mt-3 p-2 rounded"
                  style={{
                    background: "#1f2937",
                    border: "1px solid rgba(255,255,255,0.08)",
                    fontSize: "12px",
                    color: "#cbd5e1",
                    lineHeight: 1.4,
                  }}
                >
                  Jika preview PDF tidak muncul di beberapa HP (misalnya iPhone),
                  silakan klik <strong className="text-light">Open PDF</strong>{" "}
                  atau <strong className="text-light">Download PDF</strong>.
                </div>
              )}
            </div>
          </div>

          {/* ✅ PDF VIEWER */}
          <div
            className="rounded shadow-sm border border-secondary overflow-hidden"
            style={{ background: "#273142" }}
          >
            <iframe
              title="Invoice PDF Preview"
              src={pdfUrl}
              style={{
                width: "100%",
                height: isMobile ? "68vh" : "85vh",
                border: "none",
                background: "#111",
              }}
            />
          </div>

          {/* Footer hint */}
          <div
            className="text-center small mt-3 px-2"
            style={{ color: "rgba(255,255,255,0.55)" }}
          >
            Jika preview tidak muncul di perangkat Anda, klik{" "}
            <strong style={{ color: "#fff" }}>Open PDF</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}

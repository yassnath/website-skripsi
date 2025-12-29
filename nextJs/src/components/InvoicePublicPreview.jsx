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

  const topTitleMargin = isMobile ? "8px" : "14px";

  return (
    <div className={`cvant-page-in ${pageIn ? "is-in" : ""}`}>
      {/* ✅ BACKGROUND sesuai request */}
      <div className="py-4" style={{ background: "#1b2431" }}>
        {/* ✅ padding responsif biar tidak nempel kiri-kanan */}
        <div className="container p-0 px-3 px-md-4 px-lg-0">
          {/* ✅ Header card */}
          <div
            className="p-4 p-md-4 text-light rounded shadow-sm border border-secondary position-relative mb-3"
            style={{ background: "#273142" }}
          >
            <div className="position-relative z-1">
              {/* Header row */}
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                {/* ✅ LEFT: margin-left + margin-top title */}
                <div
                  className="pe-2 pe-md-4"
                  style={{
                    marginLeft: isMobile ? "6px" : "14px",
                  }}
                >
                  <h4
                    className="fw-bold mb-1 text-info"
                    style={{ marginTop: topTitleMargin }}
                  >
                    CV AS Nusa Trans
                  </h4>

                  <div className="text-light">
                    Ruko Graha Kota Blok BB-07, Suko, Sidoarjo
                  </div>
                  <div className="text-light">Email: asnusa.trans@gmail.com</div>
                  <div className="text-light">Telp: 0812-3425-9399</div>
                </div>

                {/* ✅ RIGHT: margin-right + margin-top title */}
                <div
                  className="text-end ps-2 ps-md-4"
                  style={{
                    marginRight: isMobile ? "6px" : "14px",
                  }}
                >
                  <h4
                    className="fw-bold text-light mb-2"
                    style={{ marginTop: topTitleMargin }}
                  >
                    INVOICE
                  </h4>

                  <div className="text-light">
                    <strong>No. Invoice:</strong> {safeStr(invoice.no_invoice)}
                  </div>

                  <div className="text-light">
                    <strong>Tanggal:</strong> {formatDate(invoice.tanggal)}
                  </div>

                  <div className="text-light">
                    <strong>Jatuh Tempo:</strong>{" "}
                    {invoice.due_date ? formatDate(invoice.due_date) : "-"}
                  </div>
                </div>
              </div>

              <hr className="my-3 border-secondary" />

              {/* Customer + Buttons */}
              <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
                {/* ✅ Customer info: margin-left */}
                <div
                  className="text-light"
                  style={{
                    marginLeft: isMobile ? "6px" : "14px",
                  }}
                >
                  <div style={{ marginBottom: "6px" }}>
                    <strong>Kepada:</strong> {safeStr(invoice.nama_pelanggan)}
                  </div>

                  <div style={{ marginBottom: "14px" }}>
                    <strong>Email:</strong> {safeStr(invoice.email)}
                  </div>
                </div>

                {/* ✅ Buttons: margin-right + margin-bottom */}
                <div
                  className="d-flex gap-2 flex-wrap"
                  style={{
                    marginRight: isMobile ? "6px" : "14px",
                    marginBottom: "14px",
                  }}
                >
                  <button
                    className="btn btn-sm btn-outline-info"
                    onClick={handleDownloadPdf}
                  >
                    Download PDF
                  </button>

                  <a
                    className="btn btn-sm btn-outline-success"
                    href={pdfUrl}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Open PDF
                  </a>
                </div>
              </div>

              {/* ✅ Note untuk mobile */}
              {isMobile && (
                <div className="alert alert-secondary py-2 mb-0 small mt-2">
                  Preview PDF pada sebagian HP (terutama iPhone) kadang tidak
                  tampil di dalam halaman. Jika tidak muncul, silakan klik{" "}
                  <strong>Open PDF</strong> atau <strong>Download PDF</strong>.
                </div>
              )}
            </div>
          </div>

          {/* ✅ PDF Preview wrapper */}
          <div
            className="rounded shadow-sm border border-secondary overflow-hidden"
            style={{ background: "#273142" }}
          >
            <iframe
              title="Invoice PDF Preview"
              src={pdfUrl}
              style={{
                width: "100%",
                height: isMobile ? "60vh" : "85vh",
                border: "none",
                background: "#111",
              }}
            />
          </div>

          <div className="text-center text-muted small mt-3 px-2">
            Jika preview tidak muncul di perangkat Anda, klik{" "}
            <strong className="text-light">Open PDF</strong>.
          </div>
        </div>
      </div>
    </div>
  );
}

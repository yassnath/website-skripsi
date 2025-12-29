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

    // ✅ Force download via <a download>
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
      {/* ✅ padding responsif biar gak nempel kiri kanan */}
      <div className="container my-3 p-0 px-3 px-md-4 px-lg-0">
        {/* Header card */}
        <div className="p-4 bg-white rounded shadow-sm position-relative mb-3">
          <div className="position-relative z-1">
            <div className="d-flex flex-wrap justify-content-between align-items-start gap-3">
              <div className="ms-1">
                <h4 className="fw-bold mb-1 text-primary">
                  CV AS Nusa Trans
                </h4>
                <div className="text-dark">
                  Ruko Graha Kota Blok BB-07, Suko, Sidoarjo
                </div>
                <div className="text-dark">Email: asnusa.trans@gmail.com</div>
                <div className="text-dark">Telp: 0812-3425-9399</div>
              </div>

              <div className="text-end me-1">
                <h4 className="fw-bold text-dark mb-2">INVOICE</h4>
                <div className="text-dark">
                  <strong>No. Invoice:</strong> {safeStr(invoice.no_invoice)}
                </div>
                <div className="text-dark">
                  <strong>Tanggal:</strong> {formatDate(invoice.tanggal)}
                </div>
                <div className="text-dark">
                  <strong>Jatuh Tempo:</strong>{" "}
                  {invoice.due_date ? formatDate(invoice.due_date) : "-"}
                </div>
              </div>
            </div>

            <hr className="my-3" />

            <div className="d-flex flex-wrap justify-content-between align-items-center gap-2 mb-3">
              <div className="text-dark">
                <div>
                  <strong>Kepada:</strong> {safeStr(invoice.nama_pelanggan)}
                </div>
                <div>
                  <strong>Email:</strong> {safeStr(invoice.email)}
                </div>
              </div>

              <div className="d-flex gap-2">
                <button
                  className="btn btn-sm btn-outline-primary"
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

            {/* ✅ NOTE untuk mobile: iframe pdf kadang memang gak muncul */}
            {isMobile && (
              <div className="alert alert-warning py-2 mb-0 small">
                Preview PDF pada sebagian HP (terutama iPhone) kadang tidak
                tampil di dalam halaman. Jika tidak muncul, silakan klik{" "}
                <strong>Open PDF</strong> atau <strong>Download PDF</strong>.
              </div>
            )}
          </div>
        </div>

        {/* PDF Preview */}
        <div className="bg-white rounded shadow-sm overflow-hidden">
          <iframe
            title="Invoice PDF Preview"
            src={pdfUrl}
            style={{
              width: "100%",
              height: isMobile ? "60vh" : "85vh",
              border: "none",
            }}
          />
        </div>

        <div className="text-center text-muted small mt-3 px-2">
          Jika preview tidak muncul di perangkat Anda, klik{" "}
          <strong>Open PDF</strong>.
        </div>
      </div>
    </div>
  );
}

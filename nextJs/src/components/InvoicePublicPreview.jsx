"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

/**
 * ✅ ANIMASI MASUK (sama seperti InvoicePreviewLayer)
 */
function useCvAntPageIn() {
  const [pageIn, setPageIn] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setPageIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return pageIn;
}

/**
 * ✅ HELPERS (biar armada selalu kebaca walau struktur beda)
 */
const safeStr = (v, fallback = "-") =>
  v == null || String(v).trim() === "" ? fallback : String(v);

const toInt = (val) => Math.round(parseFloat(val) || 0);

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
   * ✅ API BASE dari ENV
   */
  const apiBase = useMemo(() => {
    let base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    return String(base).replace(/\/+$/, "");
  }, []);

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

  /**
   * ✅ ROWS (DENGAN ARMADA FIX)
   * - kalau rincian ada → pakai rincian
   * - kalau tidak → pakai invoice utama
   *
   * Armada sumber:
   * 1) rincian.armada.plat_nomor
   * 2) rincian.armada_plat / plat / plat_nomor
   * 3) invoice.armada.plat_nomor
   * 4) fallback "-"
   */
  const rows = useMemo(() => {
    if (!invoice) return [];

    const rin = Array.isArray(invoice?.rincian) ? invoice.rincian : [];

    const resolveArmadaPlat = (r) => {
      const fromRincian =
        r?.armada?.plat_nomor ||
        r?.armada_plat ||
        r?.plat ||
        r?.plat_nomor ||
        "";

      if (fromRincian && String(fromRincian).trim()) return String(fromRincian);

      const fromInvoice = invoice?.armada?.plat_nomor || "";
      if (fromInvoice && String(fromInvoice).trim()) return String(fromInvoice);

      return "-";
    };

    if (rin.length > 0) {
      return rin.map((r) => {
        const ton = toInt(r?.tonase);
        const hrg = toInt(r?.harga);
        const rowSubtotal = ton * hrg;

        return {
          lokasi_muat: safeStr(r?.lokasi_muat, "-"),
          lokasi_bongkar: safeStr(r?.lokasi_bongkar, "-"),
          armada_plat: resolveArmadaPlat(r),
          armada_start_date: r?.armada_start_date || invoice?.armada_start_date,
          armada_end_date: r?.armada_end_date || invoice?.armada_end_date,
          tonase: ton,
          harga: hrg,
          subtotal: rowSubtotal,
        };
      });
    }

    const ton = toInt(invoice?.tonase);
    const hrg = toInt(invoice?.harga);
    const rowSubtotal = ton * hrg;

    return [
      {
        lokasi_muat: safeStr(invoice?.lokasi_muat, "-"),
        lokasi_bongkar: safeStr(invoice?.lokasi_bongkar, "-"),
        armada_plat: safeStr(invoice?.armada?.plat_nomor, "-"),
        armada_start_date: invoice?.armada_start_date || null,
        armada_end_date: invoice?.armada_end_date || null,
        tonase: ton,
        harga: hrg,
        subtotal: rowSubtotal,
      },
    ];
  }, [invoice]);

  /**
   * ✅ TOTALS
   */
  const subtotal = useMemo(
    () => rows.reduce((sum, r) => sum + (toInt(r?.subtotal) || 0), 0),
    [rows]
  );

  const pph = useMemo(() => Math.round(subtotal * 0.02), [subtotal]);
  const totalBayar = useMemo(() => subtotal - pph, [subtotal, pph]);

  const money = (n) => `Rp ${toInt(n).toLocaleString("id-ID")}`;

  /**
   * ✅ PRINT DINAMIS:
   * - rows <= 3 → PORTRAIT
   * - rows > 3  → LANDSCAPE
   * + shrink teks tabel supaya 1 baris
   * + zoom dinamis
   */
  useEffect(() => {
    const STYLE_ID = "invoice-public-print-dynamic";

    const applyPrint = () => {
      const isPortrait = rows.length <= 3;

      // zoom dinamis
      const baseZoom = isPortrait ? 0.88 : 0.92;
      const extraCut = Math.max(0, rows.length - 4) * 0.03;
      const zoom = Math.max(0.7, baseZoom - extraCut);

      const liftMm = isPortrait ? 6 : 10;
      const lift = Math.min(14, liftMm + Math.max(0, rows.length - 4) * 1);

      let el = document.getElementById(STYLE_ID);
      if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
        document.head.appendChild(el);
      }

      el.textContent = `
        @media print {
          @page {
            size: A4 ${isPortrait ? "portrait" : "landscape"};
            margin: 6mm 6mm;
          }

          .invoice-paper {
            position: relative !important;
            left: 50% !important;
            transform: translate(-50%, -${lift}mm) scale(${zoom}) !important;
            transform-origin: top center !important;
          }

          .invoice-detail-table th,
          .invoice-detail-table td {
            font-size: 10px !important;
            padding: 3px 4px !important;
            line-height: 1.1 !important;
            white-space: nowrap !important;
          }

          .invoice-paper,
          .invoice-paper * {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .invoice-watermark {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            opacity: 0.07 !important;
            z-index: 0 !important;
            pointer-events: none !important;
          }
        }
      `;
    };

    const cleanup = () => {
      const el = document.getElementById(STYLE_ID);
      if (el) el.remove();
    };

    window.addEventListener("beforeprint", applyPrint);
    window.addEventListener("afterprint", cleanup);

    return () => {
      window.removeEventListener("beforeprint", applyPrint);
      window.removeEventListener("afterprint", cleanup);
      cleanup();
    };
  }, [rows.length]);

  /**
   * ✅ PDF URL PUBLIC
   */
  const pdfUrl = useMemo(() => {
    if (!invoice) return "";
    return `${apiBase}/api/public/invoices/${invoice.id}/pdf`;
  }, [invoice, apiBase]);

  const handleOpenPdf = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank");
  };

  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `invoice-${invoice.no_invoice}.pdf`;
    a.target = "_blank";
    a.click();
  };

  /**
   * ✅ LOADING & EMPTY
   */
  if (loading) {
    return (
      <div className="container py-5 text-center text-muted">
        Memuat invoice...
      </div>
    );
  }

  if (!invoice) {
    return (
      <div className="container py-5 text-center text-danger fw-semibold">
        Invoice tidak ditemukan.
      </div>
    );
  }

  /**
   * ✅ STYLE CELL agar 1 baris + kecil
   */
  const cellStyle = {
    fontSize: "13px",
    whiteSpace: "nowrap",
    lineHeight: 1.15,
    verticalAlign: "middle",
  };

  const headStyle = {
    ...cellStyle,
    fontWeight: 700,
  };

  return (
    <>
      <div className={`cvant-page-in ${pageIn ? "is-in" : ""}`}>
        {/* ✅ tombol biru tema */}
        <div className="container py-4">
          <div className="d-flex justify-content-end gap-2 mb-3 no-print">
            <button className="btn btn-primary btn-sm" onClick={handleOpenPdf}>
              Open PDF
            </button>
            <button
              className="btn btn-primary btn-sm"
              onClick={handleDownloadPdf}
            >
              Download PDF
            </button>
          </div>
        </div>

        <div className="invoice-screen">
          <div className="container my-3 p-5 bg-white rounded shadow-sm position-relative invoice-paper">
            <div
              className="position-absolute top-50 start-50 translate-middle invoice-watermark"
              style={{ opacity: 0.1, zIndex: 0 }}
            >
              <Image
                src="/assets/images/icon.png"
                alt="CV ANT Logo"
                width={500}
                height={500}
                className="user-select-none"
              />
            </div>

            <div className="position-relative z-1">
              <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4 invoice-header">
                <div className="invoice-header-left">
                  <h4 className="fw-bold mb-1 text-primary invoice-company-title">
                    CV AS Nusa Trans
                  </h4>
                  <div className="text-dark invoice-company-line">
                    Ruko Graha Kota Blok BB-07, Suko, Sidoarjo
                  </div>
                  <div className="text-dark invoice-company-line">
                    Email: asnusa.trans@gmail.com
                  </div>
                  <div className="text-dark invoice-company-line">
                    Telp: 0812-3425-9399
                  </div>
                </div>

                <div className="text-end text-dark invoice-header-right">
                  <h4 className="fw-bold text-dark mb-2 invoice-title">
                    INVOICE
                  </h4>
                  <div className="invoice-info-line">
                    <strong>No. Invoice:</strong> {invoice.no_invoice}
                  </div>
                  <div className="invoice-info-line">
                    <strong>Tanggal:</strong> {formatDate(invoice.tanggal)}
                  </div>
                  <div className="invoice-info-line">
                    <strong>Jatuh Tempo:</strong>{" "}
                    {invoice.due_date ? formatDate(invoice.due_date) : "-"}
                  </div>
                </div>
              </div>

              <div className="row mb-4 text-dark invoice-customer">
                <div className="col-md-6 invoice-from">
                  <h6 className="fw-bold text-dark invoice-section-title">
                    Dari:
                  </h6>
                  <p className="mb-1">CV. AS Nusa Trans</p>
                  <p className="mb-1">
                    Ruko Graha Kota Blok BB-07, Sidoarjo
                  </p>
                  <p>Telp: 0812-3425-9399 | asnusa.trans@gmail.com</p>
                </div>

                <div className="col-md-6 text-end invoice-to">
                  <h6 className="fw-bold text-dark invoice-section-title">
                    Kepada:
                  </h6>
                  <p className="mb-1">{invoice.nama_pelanggan}</p>
                  <p className="mb-1">{invoice.email}</p>
                  <p>{invoice.no_telp}</p>
                </div>
              </div>

              <div className="px-4 invoice-table-wrap invoice-table-responsive">
                <table className="table table-bordered text-center align-middle bg-white invoice-detail-table">
                  <thead className="table-dark text-center invoice-detail-head">
                    <tr>
                      <th style={headStyle}>Lokasi Muat</th>
                      <th style={headStyle}>Lokasi Bongkar</th>
                      <th style={headStyle}>Armada</th>
                      <th style={headStyle}>Berangkat</th>
                      <th style={headStyle}>Sampai</th>
                      <th style={headStyle}>Tonase</th>
                      <th style={headStyle}>Harga / Ton</th>
                      <th style={headStyle}>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody className="invoice-detail-body">
                    {rows.map((r, idx) => (
                      <tr key={idx}>
                        <td style={cellStyle} title={r.lokasi_muat}>
                          <span className="cell-2line">{r.lokasi_muat}</span>
                        </td>
                        <td style={cellStyle} title={r.lokasi_bongkar}>
                          <span className="cell-2line">{r.lokasi_bongkar}</span>
                        </td>
                        <td style={cellStyle}>
                          <span className="cell-2line">
                            {r.armada_plat || "-"}
                          </span>
                        </td>
                        <td style={cellStyle}>
                          <span className="cell-2line">
                            {r.armada_start_date
                              ? formatDate(r.armada_start_date)
                              : "-"}
                          </span>
                        </td>
                        <td style={cellStyle}>
                          <span className="cell-2line">
                            {r.armada_end_date
                              ? formatDate(r.armada_end_date)
                              : "-"}
                          </span>
                        </td>
                        <td style={cellStyle}>
                          <span className="cell-2line">{toInt(r.tonase)}</span>
                        </td>
                        <td style={cellStyle}>
                          <span className="cell-2line">{money(r.harga)}</span>
                        </td>
                        <td style={cellStyle}>
                          <span className="cell-2line">{money(r.subtotal)}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="d-flex justify-content-between mt-4 invoice-armada-summary">
                <div
                  className="text-dark invoice-armada-left"
                  style={{ maxWidth: "45%" }}
                />
                <table className="table table-sm w-50 invoice-totals">
                  <tbody>
                    <tr>
                      <td className="fw-semibold">Subtotal</td>
                      <td className="text-end">{money(subtotal)}</td>
                    </tr>
                    <tr>
                      <td className="fw-semibold">PPH (2%)</td>
                      <td className="text-end">{money(pph)}</td>
                    </tr>
                    <tr className="fw-bold table-light invoice-totals-bold">
                      <td>Total Bayar</td>
                      <td className="text-end">{money(totalBayar)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="text-dark mt-4 invoice-status">
                <p className="mb-1">
                  <strong>Status:</strong> {invoice.status}
                </p>
                <p className="mb-0">
                  <strong>Diterima oleh:</strong>{" "}
                  {invoice.diterima_oleh || "-"}
                </p>
              </div>

              <div className="mt-5 text-center text-muted small invoice-footer-note">
                Mohon lakukan pembayaran sebelum tanggal jatuh tempo.
                <br />
                Harap konfirmasi pembayaran via WhatsApp: 0812-3425-9399.
              </div>

              <div className="mt-5 text-end text-dark invoice-sign">
                <p className="mb-5">Hormat kami,</p>
                <p className="fw-bold">CV ANT</p>
              </div>
            </div>
          </div>
        </div>

        {/* ✅ STYLE FIX kamu tidak aku ubah sama sekali + tambah responsif tabel */}
        <style jsx global>{`
          .invoice-paper {
            overflow-x: hidden;
          }

          .invoice-table-responsive {
            width: 100%;
            overflow-x: auto;
          }

          .invoice-detail-table th,
          .invoice-detail-table td {
            padding: 8px 10px;
            line-height: 1.15;
            vertical-align: middle;
          }

          .cell-2line {
            display: inline;
          }

          /* ✅ tambahan supaya 1 baris + lebih rapat di layar kecil */
          .invoice-detail-table th,
          .invoice-detail-table td {
            white-space: nowrap !important;
          }

          @media (max-width: 991.98px) {
            .invoice-paper.container {
              padding: 18px !important;
            }

            .invoice-detail-table th,
            .invoice-detail-table td {
              font-size: 12px !important;
              padding: 6px 6px !important;
              line-height: 1.15 !important;
              white-space: nowrap !important;
            }

            .invoice-table-wrap {
              padding-left: 0 !important;
              padding-right: 0 !important;
            }
          }

          @media (max-width: 575.98px) {
            .invoice-paper.container {
              padding: 14px !important;
            }

            .invoice-detail-table th,
            .invoice-detail-table td {
              font-size: 11px !important;
              padding: 5px 5px !important;
            }

            .invoice-title {
              font-size: 20px !important;
            }

            .invoice-company-title {
              font-size: 18px !important;
            }
          }

          @media print {
            html,
            body {
              background: #fff !important;
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }

            body * {
              visibility: hidden !important;
            }

            .invoice-screen,
            .invoice-screen * {
              visibility: visible !important;
            }

            .invoice-screen {
              position: absolute !important;
              left: 0 !important;
              top: 0 !important;
              width: 100% !important;
            }

            .no-print {
              display: none !important;
            }

            body {
              overflow: hidden !important;
            }

            .invoice-screen,
            .invoice-paper,
            .invoice-paper * {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }

            .invoice-paper.container {
              padding-left: 0 !important;
              padding-right: 0 !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
              max-width: 100% !important;
              width: 100% !important;
            }

            .invoice-paper {
              margin: 0 !important;
              padding: 0 !important;
              border: none !important;
              box-shadow: none !important;
              background: #fff !important;
              border-radius: 0 !important;
            }

            .invoice-screen {
              font-family: DejaVu Sans, Arial, sans-serif !important;
              font-size: 12px !important;
              color: #222 !important;
              line-height: 1.5 !important;
            }

            .invoice-screen .text-dark {
              color: #222 !important;
            }

            .invoice-watermark {
              position: fixed !important;
              top: 50% !important;
              left: 50% !important;
              transform: translate(-50%, -50%) !important;
              opacity: 0.07 !important;
              z-index: 0 !important;
              pointer-events: none !important;
            }

            table,
            tr,
            td,
            th {
              page-break-inside: avoid !important;
              break-inside: avoid !important;
            }
          }
        `}</style>
      </div>
    </>
  );
}

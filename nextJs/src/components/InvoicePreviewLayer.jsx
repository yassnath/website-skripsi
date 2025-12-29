"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import Image from "next/image";

function useCvAntPageIn() {
  const [pageIn, setPageIn] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setPageIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return pageIn;
}

export default function InvoicePreviewLayer() {
  const pageIn = useCvAntPageIn();

  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [invoice, setInvoice] = useState(null);
  const [armadas, setArmadas] = useState([]);
  const [sending, setSending] = useState(false);

  // ✅ FIX: pastikan API base selalu dari env dan bersih dari slash
  let apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
  apiBase = apiBase.replace(/\/+$/, "");

  useEffect(() => {
    if (id) {
      api
        .get(`/invoices/${id}`)
        .then((res) => setInvoice(res))
        .catch(() => {});
    }
  }, [id]);

  useEffect(() => {
    api
      .get("/armadas")
      .then((res) => setArmadas(Array.isArray(res) ? res : []))
      .catch(() => setArmadas([]));
  }, []);

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

  const platById = useMemo(() => {
    const map = new Map();
    for (const a of armadas) {
      if (a?.id != null) map.set(String(a.id), a?.plat_nomor || "");
    }
    return map;
  }, [armadas]);

  const rows = useMemo(() => {
    if (!invoice) return [];

    const rin = Array.isArray(invoice?.rincian) ? invoice.rincian : [];

    const resolvePlatFromRincian = (r) => {
      const direct =
        r?.armada?.plat_nomor ||
        r?.armada_plat ||
        r?.plat ||
        r?.plat_nomor ||
        "";

      if (direct && String(direct).trim()) return String(direct);

      const idKey = r?.armada_id != null ? String(r.armada_id) : "";
      if (idKey && platById.has(idKey)) return platById.get(idKey) || "-";

      return "-";
    };

    if (rin.length > 0) {
      return rin.map((r) => {
        const ton = toInt(r?.tonase);
        const hrg = toInt(r?.harga);
        const rowSubtotal = ton * hrg;

        return {
          lokasi_muat: r?.lokasi_muat || "-",
          lokasi_bongkar: r?.lokasi_bongkar || "-",
          armada_plat: resolvePlatFromRincian(r),
          armada_start_date: r?.armada_start_date || null,
          armada_end_date: r?.armada_end_date || null,
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
        lokasi_muat: invoice?.lokasi_muat || "-",
        lokasi_bongkar: invoice?.lokasi_bongkar || "-",
        armada_plat: invoice?.armada?.plat_nomor || "-",
        armada_start_date: invoice?.armada_start_date || null,
        armada_end_date: invoice?.armada_end_date || null,
        tonase: ton,
        harga: hrg,
        subtotal: rowSubtotal,
      },
    ];
  }, [invoice, platById]);

  const subtotal = useMemo(() => {
    return rows.reduce((sum, r) => sum + (toInt(r?.subtotal) || 0), 0);
  }, [rows]);

  const pph = useMemo(() => Math.round(subtotal * 0.02), [subtotal]);
  const totalBayar = useMemo(() => subtotal - pph, [subtotal, pph]);

  useEffect(() => {
    const STYLE_ID = "invoice-print-orientation";

    const applyOrientation = () => {
      const isPortrait = rows.length > 3;

      let el = document.getElementById(STYLE_ID);
      if (!el) {
        el = document.createElement("style");
        el.id = STYLE_ID;
        document.head.appendChild(el);
      }

      el.textContent = `
        @media print {
          @page { size: A4 ${isPortrait ? "portrait" : "landscape"}; margin: 10mm 10mm; }
        }
      `;
    };

    const cleanup = () => {
      const el = document.getElementById(STYLE_ID);
      if (el) el.remove();
    };

    window.addEventListener("beforeprint", applyOrientation);
    window.addEventListener("afterprint", cleanup);

    return () => {
      window.removeEventListener("beforeprint", applyOrientation);
      window.removeEventListener("afterprint", cleanup);
    };
  }, [rows.length]);

  // ✅ FIX: Send email menggunakan URL langsung dari apiBase (tidak localhost)
  const handleSendToEmail = async () => {
    if (!invoice) return;
    setSending(true);

    try {
      const pdfUrl = `${apiBase}/api/invoices/${invoice.id}/pdf`;

      const subject = encodeURIComponent(`Invoice ${invoice.no_invoice}`);
      const body = encodeURIComponent(
        `Yth. ${invoice.nama_pelanggan},\n\n` +
          `Silakan klik berikut untuk melihat invoice:\n${pdfUrl}\n\n` +
          `Terima kasih,\nCV AS Nusa Trans (CV ANT)`
      );

      const to = encodeURIComponent(invoice.email || "");
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;

      window.open(gmailUrl, "_blank");
    } catch (e) {
      alert("Gagal mengirim email. Pastikan backend berjalan dan URL valid.");
    } finally {
      setSending(false);
    }
  };

  const cellStyle = {
    fontSize: "15px",
    whiteSpace: "nowrap",
    lineHeight: 1.2,
    verticalAlign: "middle",
  };

  const headStyle = {
    ...cellStyle,
    fontWeight: 700,
  };

  const money = (n) => `Rp ${toInt(n).toLocaleString("id-ID")}`;

  if (!invoice) {
    return (
      <div className="container py-5 text-center text-muted">
        Memuat data invoice...
      </div>
    );
  }

  return (
    <>
      <div className={`cvant-page-in ${pageIn ? "is-in" : ""}`}>
        <div className="d-flex justify-content-end gap-3 no-print">
          <button
            className="btn btn-sm btn-outline-primary"
            onClick={() =>
              (window.location.href = `/invoice-edit?id=${invoice.id}`)
            }
          >
            Edit
          </button>

          {/* ✅ FIX: Generate PDF selalu pakai apiBase */}
          <button
            className="btn btn-sm btn-outline-success"
            onClick={() =>
              window.open(
                `${apiBase}/api/invoices/${invoice.id}/pdf`,
                "_blank"
              )
            }
          >
            Generate PDF
          </button>

          <button
            className="btn btn-sm btn-outline-secondary"
            onClick={handleSendToEmail}
            disabled={sending}
          >
            {sending ? "Sending to email..." : "Send to Email"}
          </button>
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
                          <span className="cell-2line">
                            {money(r.subtotal)}
                          </span>
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

        {/* ⚠️ Styling tidak diubah sama sekali */}
        <style jsx global>{`
          .invoice-paper {
            overflow-x: hidden;
          }

          .invoice-table-responsive {
            width: 100%;
            overflow-x: auto;
          }

          /* rapatkan baris tabel (web view) */
          .invoice-detail-table th,
          .invoice-detail-table td {
            padding: 8px 10px;
            line-height: 1.15;
            vertical-align: middle;
          }

          /* cell content wrapper: default desktop tetap single line (mengikuti cellStyle nowrap) */
          .cell-2line {
            display: inline;
          }

          @media (max-width: 991.98px) {
            .invoice-paper.container {
              padding: 18px !important;
            }

            /* di layar kecil: boleh wrap */
            .invoice-detail-table th,
            .invoice-detail-table td {
              font-size: 12px !important;
              padding: 6px 6px !important;
              line-height: 1.15 !important;
              white-space: normal !important; /* ✅ td tetap table-cell, hanya allow wrap */
              word-break: break-word !important;
            }

            /* batasi isi jadi max 2 baris (TANPA mengubah display td) */
            .cell-2line {
              display: -webkit-box;
              -webkit-line-clamp: 2;
              -webkit-box-orient: vertical;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: normal;
            }

            /* header tetap ringkas */
            .invoice-detail-table th {
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

          /* ============================
             PRINT (tetap seperti punyamu)
             ============================ */
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

            .invoice-header {
              display: table !important;
              width: 100% !important;
              table-layout: fixed !important;
            }
            .invoice-header-left {
              display: table-cell !important;
              width: 60% !important;
              vertical-align: top !important;
              text-align: left !important;
              padding-left: 0 !important;
            }
            .invoice-header-right {
              display: table-cell !important;
              width: 40% !important;
              vertical-align: top !important;
              text-align: right !important;
              padding-right: 0 !important;
            }

            .invoice-customer {
              display: table !important;
              width: 100% !important;
              table-layout: fixed !important;
              margin-bottom: 10px !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
            }

            .invoice-from,
            .invoice-to {
              display: table-cell !important;
              vertical-align: top !important;
              float: none !important;
              max-width: none !important;
            }

            .invoice-from {
              width: 60% !important;
              text-align: left !important;
              padding-left: 0 !important;
              padding-right: 10px !important;
            }

            .invoice-to {
              width: 40% !important;
              text-align: right !important;
              padding-right: 0 !important;
              padding-left: 10px !important;
            }

            .invoice-from h6,
            .invoice-from p {
              text-align: left !important;
              margin-left: 0 !important;
              padding-left: 0 !important;
            }

            .invoice-to h6,
            .invoice-to p {
              text-align: right !important;
              margin-right: 0 !important;
              padding-right: 0 !important;
            }

            .invoice-table-wrap {
              padding-left: 0 !important;
              padding-right: 0 !important;
              margin-left: 0 !important;
              margin-right: 0 !important;
            }

            .invoice-detail-table {
              width: 100% !important;
              margin-top: 10px !important;
              border-collapse: collapse !important;
            }
            .invoice-detail-table th,
            .invoice-detail-table td {
              font-size: 10px !important;
              line-height: 1.1 !important;
              padding: 3px 4px !important;
              white-space: nowrap !important;
            }

            .invoice-detail-table,
            .invoice-detail-table th,
            .invoice-detail-table td,
            .table-bordered,
            .table-bordered > :not(caption) > * > * {
              border: none !important;
            }

            .border-bottom {
              border-bottom: none !important;
            }
            .invoice-header {
              margin-bottom: 6px !important;
              padding-bottom: 0 !important;
            }

            .invoice-armada-summary {
              display: table !important;
              width: 100% !important;
              table-layout: fixed !important;
              margin-top: 8px !important;
            }
            .invoice-armada-left {
              display: table-cell !important;
              width: 50% !important;
              vertical-align: top !important;
              padding-right: 10px !important;
              padding-left: 0 !important;
              max-width: none !important;
            }
            .invoice-totals {
              display: table !important;
              width: 50% !important;
              margin-left: auto !important;
              margin-right: 0 !important;
              border-collapse: collapse !important;
            }
            .invoice-totals td {
              padding: 3px 4px !important;
              font-size: 11px !important;
              border: none !important;
            }
            .invoice-totals td:first-child {
              text-align: left !important;
            }
            .invoice-totals td:last-child {
              text-align: right !important;
              white-space: nowrap !important;
              padding-right: 0 !important;
            }
            .invoice-totals tr.invoice-totals-bold td {
              font-weight: 700 !important;
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

"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import Image from "next/image";

export default function InvoicePublicPreview({ id }) {
  const [invoice, setInvoice] = useState(null);
  const [armadas, setArmadas] = useState([]);
  const [loading, setLoading] = useState(true);

  // ✅ API base dari env (dibersihkan)
  const apiBase = useMemo(() => {
    let base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    base = String(base).replace(/\/+$/, "");
    return base;
  }, []);

  useEffect(() => {
    if (id) {
      api
        .get(`/public/invoices/${id}`) // ✅ endpoint public
        .then((res) => setInvoice(res))
        .catch(() => setInvoice(null))
        .finally(() => setLoading(false));
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

  const money = (n) => `Rp ${toInt(n).toLocaleString("id-ID")}`;

  // ✅ public PDF url
  const pdfUrl = useMemo(() => {
    if (!invoice) return "";
    return `${apiBase}/api/public/invoices/${invoice.id}/pdf`;
  }, [invoice, apiBase]);

  // ✅ Download PDF
  const handleDownloadPdf = () => {
    if (!pdfUrl) return;
    const a = document.createElement("a");
    a.href = pdfUrl;
    a.download = `invoice-${invoice.no_invoice}.pdf`;
    a.target = "_blank";
    a.click();
  };

  // ✅ Open PDF
  const handleOpenPdf = () => {
    if (!pdfUrl) return;
    window.open(pdfUrl, "_blank");
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
      <div className="container py-5 text-center text-danger fw-semibold">
        Invoice tidak ditemukan / sudah tidak tersedia.
      </div>
    );
  }

  return (
    <>
      <div className="container py-4">
        {/* ✅ Buttons */}
        <div className="d-flex justify-content-end gap-2 mb-3">
          <button className="btn btn-primary btn-sm" onClick={handleOpenPdf}>
            Open PDF
          </button>
          <button className="btn btn-primary btn-sm" onClick={handleDownloadPdf}>
            Download PDF
          </button>
        </div>

        <div className="invoice-screen">
          <div className="container p-5 bg-white rounded shadow-sm position-relative invoice-paper">
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
              {/* HEADER */}
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
                  <h4 className="fw-bold text-dark mb-2 invoice-title">INVOICE</h4>
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

              {/* CUSTOMER */}
              <div className="row mb-4 text-dark invoice-customer">
                <div className="col-md-6 invoice-from">
                  <h6 className="fw-bold text-dark invoice-section-title">Dari:</h6>
                  <p className="mb-1">CV. AS Nusa Trans</p>
                  <p className="mb-1">Ruko Graha Kota Blok BB-07, Sidoarjo</p>
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

              {/* TABLE */}
              <div className="px-4 invoice-table-wrap invoice-table-responsive">
                <table className="table table-bordered text-center align-middle bg-white invoice-detail-table">
                  <thead className="table-dark text-center invoice-detail-head">
                    <tr>
                      <th>Lokasi Muat</th>
                      <th>Lokasi Bongkar</th>
                      <th>Armada</th>
                      <th>Berangkat</th>
                      <th>Sampai</th>
                      <th>Tonase</th>
                      <th>Harga / Ton</th>
                      <th>Subtotal</th>
                    </tr>
                  </thead>

                  <tbody className="invoice-detail-body">
                    {rows.map((r, idx) => (
                      <tr key={idx}>
                        <td>{r.lokasi_muat}</td>
                        <td>{r.lokasi_bongkar}</td>
                        <td>{r.armada_plat}</td>
                        <td>{r.armada_start_date ? formatDate(r.armada_start_date) : "-"}</td>
                        <td>{r.armada_end_date ? formatDate(r.armada_end_date) : "-"}</td>
                        <td>{toInt(r.tonase)}</td>
                        <td>{money(r.harga)}</td>
                        <td>{money(r.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TOTAL */}
              <div className="d-flex justify-content-between mt-4 invoice-armada-summary">
                <div style={{ maxWidth: "45%" }} />
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

              {/* FOOTER */}
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
      </div>
    </>
  );
}

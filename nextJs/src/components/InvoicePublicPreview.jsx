"use client";

import { useEffect, useMemo, useState } from "react";
import Image from "next/image";

export default function InvoicePublicPreview({ id }) {
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);

  // ✅ API BASE dari ENV
  const apiBase = useMemo(() => {
    let base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    return String(base).replace(/\/+$/, "");
  }, []);

  // ✅ fetch invoice PUBLIC
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

  const rows = useMemo(() => {
    if (!invoice) return [];

    const rin = Array.isArray(invoice?.rincian) ? invoice.rincian : [];

    if (rin.length > 0) {
      return rin.map((r) => ({
        lokasi_muat: r?.lokasi_muat || "-",
        lokasi_bongkar: r?.lokasi_bongkar || "-",
        armada_plat: r?.armada?.plat_nomor || "-",
        armada_start_date: r?.armada_start_date || null,
        armada_end_date: r?.armada_end_date || null,
        tonase: toInt(r?.tonase),
        harga: toInt(r?.harga),
        subtotal: toInt(r?.tonase) * toInt(r?.harga),
      }));
    }

    return [
      {
        lokasi_muat: invoice?.lokasi_muat || "-",
        lokasi_bongkar: invoice?.lokasi_bongkar || "-",
        armada_plat: invoice?.armada?.plat_nomor || "-",
        armada_start_date: invoice?.armada_start_date || null,
        armada_end_date: invoice?.armada_end_date || null,
        tonase: toInt(invoice?.tonase),
        harga: toInt(invoice?.harga),
        subtotal: toInt(invoice?.tonase) * toInt(invoice?.harga),
      },
    ];
  }, [invoice]);

  const subtotal = useMemo(
    () => rows.reduce((sum, r) => sum + (toInt(r?.subtotal) || 0), 0),
    [rows]
  );

  const pph = useMemo(() => Math.round(subtotal * 0.02), [subtotal]);
  const totalBayar = useMemo(() => subtotal - pph, [subtotal, pph]);

  const money = (n) => `Rp ${toInt(n).toLocaleString("id-ID")}`;

  // ✅ PUBLIC PDF URL
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

  return (
    <div className="container py-4">
      {/* ✅ tombol biru tema */}
      <div className="d-flex justify-content-end gap-2 mb-3">
        <button className="btn btn-primary btn-sm" onClick={handleOpenPdf}>
          Open PDF
        </button>
        <button className="btn btn-primary btn-sm" onClick={handleDownloadPdf}>
          Download PDF
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
              <div>
                <h4 className="fw-bold mb-1 text-primary">CV AS Nusa Trans</h4>
                <div className="text-dark">
                  Ruko Graha Kota Blok BB-07, Suko, Sidoarjo
                </div>
                <div className="text-dark">Email: asnusa.trans@gmail.com</div>
                <div className="text-dark">Telp: 0812-3425-9399</div>
              </div>

              <div className="text-end text-dark">
                <h4 className="fw-bold mb-2">INVOICE</h4>
                <div>
                  <strong>No. Invoice:</strong> {invoice.no_invoice}
                </div>
                <div>
                  <strong>Tanggal:</strong> {formatDate(invoice.tanggal)}
                </div>
                <div>
                  <strong>Jatuh Tempo:</strong>{" "}
                  {invoice.due_date ? formatDate(invoice.due_date) : "-"}
                </div>
              </div>
            </div>

            <div className="row mb-4 text-dark">
              <div className="col-md-6">
                <strong>Dari:</strong>
                <p className="mb-1">CV. AS Nusa Trans</p>
                <p className="mb-1">
                  Ruko Graha Kota Blok BB-07, Sidoarjo
                </p>
                <p>Telp: 0812-3425-9399 | asnusa.trans@gmail.com</p>
              </div>

              <div className="col-md-6 text-end">
                <strong>Kepada:</strong>
                <p className="mb-1">{invoice.nama_pelanggan}</p>
                <p className="mb-1">{invoice.email}</p>
                <p>{invoice.no_telp}</p>
              </div>
            </div>

            <table className="table table-bordered text-center align-middle bg-white">
              <thead className="table-dark">
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
              <tbody>
                {rows.map((r, idx) => (
                  <tr key={idx}>
                    <td>{r.lokasi_muat}</td>
                    <td>{r.lokasi_bongkar}</td>
                    <td>{r.armada_plat}</td>
                    <td>{r.armada_start_date ? formatDate(r.armada_start_date) : "-"}</td>
                    <td>{r.armada_end_date ? formatDate(r.armada_end_date) : "-"}</td>
                    <td>{r.tonase}</td>
                    <td>{money(r.harga)}</td>
                    <td>{money(r.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="d-flex justify-content-end mt-4">
              <table className="table table-sm w-50">
                <tbody>
                  <tr>
                    <td>Subtotal</td>
                    <td className="text-end">{money(subtotal)}</td>
                  </tr>
                  <tr>
                    <td>PPH (2%)</td>
                    <td className="text-end">{money(pph)}</td>
                  </tr>
                  <tr className="fw-bold table-light">
                    <td>Total Bayar</td>
                    <td className="text-end">{money(totalBayar)}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-5 text-center text-muted small">
              Mohon lakukan pembayaran sebelum tanggal jatuh tempo.
              <br />
              Harap konfirmasi pembayaran via WhatsApp: 0812-3425-9399.
            </div>

            <div className="mt-5 text-end text-dark">
              <p className="mb-5">Hormat kami,</p>
              <p className="fw-bold">CV ANT</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

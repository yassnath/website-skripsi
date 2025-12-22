"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
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


export default function ExpensePreviewLayer() {
  const pageIn = useCvAntPageIn();

  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [expense, setExpense] = useState(null);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

  useEffect(() => {
    if (!id) return;

    api
      .get(`/expenses/${id}`)
      .then((res) => {
        const d = res?.data ?? res;
        setExpense(d);
      })
      .catch((e) => {
        console.error("ERROR PREVIEW EXPENSE:", e);
      });
  }, [id]);

  if (!expense) {
    return (
      <div className="container py-5 text-center text-muted">
        Memuat data pengeluaran...
      </div>
    );
  }

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const dd = String(d.getDate()).padStart(2, "0");
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const yyyy = d.getFullYear();
    return `${dd}-${mm}-${yyyy}`;
  };

  const detailList =
    (expense.details && expense.details.length > 0 && expense.details) ||
    (expense.rincian && expense.rincian.length > 0 && expense.rincian) || [
      {
        nama: "Total Pengeluaran",
        jumlah: parseFloat(expense.total_pengeluaran || 0),
      },
    ];

  return (
    <>
      <div className={`cvant-page-in ${pageIn ? "is-in" : ""}`}>
      <div className="d-flex justify-content-end gap-3 no-print">
        <button
          className="btn btn-sm btn-outline-primary"
          onClick={() =>
            (window.location.href = `/invoice-expense-edit?id=${expense.id}`)
          }
        >
          Edit
        </button>

        <button
          className="btn btn-sm btn-outline-success"
          onClick={() =>
            window.open(`${apiBase}/api/expenses/${expense.id}/pdf`, "_blank")
          }
        >
          Generate PDF
        </button>
      </div>

      <div className="expense-screen">
        <div className="container my-3 p-5 bg-white rounded shadow-sm position-relative expense-paper">
          <div
            className="position-absolute top-50 start-50 translate-middle expense-watermark"
            style={{ opacity: 0.07, zIndex: 0 }}
          >
            <Image
              src="/assets/images/icon.png"
              alt="CV ANT Logo"
              width={450}
              height={450}
              className="user-select-none"
            />
          </div>

          <div className="position-relative z-1 text-dark">
            <div className="d-flex justify-content-between align-items-start border-bottom pb-3 mb-4 expense-header">
              <div className="expense-header-left">
                <h4 className="fw-bold mb-1 text-primary">
                  CV AS Nusa Trans
                </h4>
                <div className="text-dark">
                  Ruko Graha Kota Blok BB-07, Suko, Sidoarjo
                </div>
                <div className="text-dark">Email: asnusa.trans@gmail.com</div>
                <div className="text-dark">Telp: 0812-3425-9399</div>
              </div>

              <div className="text-end expense-header-right">
                <h4 className="fw-bold text-dark mb-2">EXPENSE</h4>
                <div>
                  <strong>No. Expense:</strong> {expense.no_expense}
                </div>
                <div>
                  <strong>Tanggal:</strong> {formatDate(expense.tanggal)}
                </div>
                <div>
                  <strong>Status:</strong>{" "}
                  <span className="fw-bold">{expense.status}</span>
                </div>
              </div>
            </div>

            <div className="fw-bold mb-3"></div>

            <table className="table table-bordered text-center align-middle bg-white expense-detail-table">
              <thead className="table-dark">
                <tr>
                  <th style={{ width: "50%" }}>Nama Pengeluaran</th>
                  <th style={{ width: "50%" }}>Jumlah (Rp)</th>
                </tr>
              </thead>

              <tbody>
                {detailList.length === 0 ? (
                  <tr>
                    <td colSpan="2" className="text-muted">
                      Tidak ada rincian
                    </td>
                  </tr>
                ) : (
                  detailList.map((item, idx) => (
                    <tr key={idx}>
                      <td>{item.nama}</td>
                      <td>
                        Rp {parseFloat(item.jumlah || 0).toLocaleString("id-ID")}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="d-flex justify-content-end mt-4 expense-totals-wrap">
              <table className="table table-sm w-50 expense-totals">
                <tbody>
                  <tr className="fw-bold table-light">
                    <td>Total Pengeluaran</td>
                    <td className="text-end">
                      Rp{" "}
                      {parseFloat(expense.total_pengeluaran || 0).toLocaleString(
                        "id-ID"
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="mt-4 expense-footer-info">
              <p>
                <strong>Dicatat oleh:</strong> {expense.dicatat_oleh || "-"}
              </p>
            </div>

            <div className="mt-5 text-end text-dark expense-sign">
              <p className="mb-5">Hormat kami,</p>
              <p className="fw-bold">CV ANT</p>
            </div>
          </div>
        </div>
      </div>

      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 10mm 10mm;
          }

          html,
          body {
            background: #fff !important;
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          body * {
            visibility: hidden !important;
          }
          .expense-screen,
          .expense-screen * {
            visibility: visible !important;
          }

          .expense-screen {
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

          .expense-screen,
          .expense-paper,
          .expense-paper * {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }

          .expense-paper.container {
            padding-left: 0 !important;
            padding-right: 0 !important;
            margin-left: 0 !important;
            margin-right: 0 !important;
            max-width: 100% !important;
            width: 100% !important;
          }

          .expense-paper {
            margin: 0 !important;
            padding: 0 !important;
            border: none !important;
            box-shadow: none !important;
            background: #fff !important;
            border-radius: 0 !important;
          }

          .expense-screen {
            font-family: DejaVu Sans, Arial, sans-serif !important;
            font-size: 12px !important;
            color: #222 !important;
            line-height: 1.5 !important;
          }
          .expense-screen .text-dark {
            color: #222 !important;
          }

          .expense-watermark {
            position: fixed !important;
            top: 50% !important;
            left: 50% !important;
            transform: translate(-50%, -50%) !important;
            opacity: 0.07 !important;
            z-index: 0 !important;
            pointer-events: none !important;
          }

          .expense-header {
            display: table !important;
            width: 100% !important;
            table-layout: fixed !important;
          }
          .expense-header-left {
            display: table-cell !important;
            width: 60% !important;
            vertical-align: top !important;
            text-align: left !important;
            padding-left: 0 !important;
          }
          .expense-header-right {
            display: table-cell !important;
            width: 40% !important;
            vertical-align: top !important;
            text-align: right !important;
            padding-right: 0 !important;
          }

          .expense-totals td:last-child {
            text-align: right !important;
            white-space: nowrap !important;
            padding-right: 0 !important;
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
      <style jsx>{`
        .cvant-page-in {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 450ms ease, transform 450ms ease;
          will-change: opacity, transform;
        }
      
        .cvant-page-in.is-in {
          opacity: 1;
          transform: translateY(0);
        }
      
        @media (prefers-reduced-motion: reduce) {
          .cvant-page-in,
          .cvant-page-in.is-in {
            transition: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </>
  );
}
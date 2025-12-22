"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

const RecentTransactions = () => {
  // ✅ efek masuk
  const [pageIn, setPageIn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setPageIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const [transactions, setTransactions] = useState([]);

  const getStatusClass = (status) => {
    switch (status) {
      case "Paid":
        return "bg-success-focus text-success-main";
      case "Unpaid":
        return "bg-danger-focus text-danger-main";
      case "Waiting":
        return "bg-warning-focus text-warning-main";
      case "Recorded":
        return "bg-info-focus text-info-main";
      default:
        return "bg-secondary text-white";
    }
  };

  const formatDate = (raw) => {
    if (!raw) return "-";

    if (/^\d{2}-\d{2}-\d{4}$/.test(raw)) return raw;

    if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) {
      const [y, m, d] = raw.split("-");
      return `${d}-${m}-${y}`;
    }

    if (raw.includes("T")) {
      const [y, m, d] = raw.split("T")[0].split("-");
      return `${d}-${m}-${y}`;
    }

    return raw;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [invRes, expRes] = await Promise.all([
          api.get("/invoices"),
          api.get("/expenses"),
        ]);

        const invoices = Array.isArray(invRes) ? invRes : [];
        const expenses = Array.isArray(expRes) ? expRes : [];

        const incomeList = invoices.map((i) => ({
          id: i.id,
          type: "Income",
          nomor: i.no_invoice,
          customer: i.nama_pelanggan,
          tanggal: formatDate(i.tanggal),
          total: Number(i.total_bayar ?? i.total_biaya ?? 0),
          status: i.status,
          rawDate: new Date(formatDate(i.tanggal).split("-").reverse().join("-")),
        }));

        const expenseList = expenses.map((e) => ({
          id: e.id,
          type: "Expense",
          nomor: e.no_expense,
          customer: "-",
          tanggal: formatDate(e.tanggal),
          total: Number(e.total_pengeluaran ?? 0),
          status: e.status || "Recorded",
          rawDate: new Date(formatDate(e.tanggal).split("-").reverse().join("-")),
        }));

        const merged = [...incomeList, ...expenseList]
          .sort((a, b) => b.rawDate - a.rawDate)
          .slice(0, 6);

        setTransactions(merged);
      } catch (err) {
        console.error("Error fetch transactions:", err);
      }
    };

    fetchData();
  }, []);

  return (
    <>
      <div className={`col-xxl-12 page-in ${pageIn ? "is-in" : ""}`}>
        <div className="card h-100">
          <div className="card-header">
            <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h6 className="mb-2 fw-bold text-lg mb-0">Recent Transactions</h6>

              <Link
                href="/invoice-list"
                className="text-primary-600 hover-text-primary d-flex align-items-center gap-1"
              >
                View All
                <Icon
                  icon="solar:alt-arrow-right-linear"
                  className="icon"
                  width={18}
                  height={18}
                />
              </Link>
            </div>
          </div>

          <div className="card-body p-24">
            <div className="table-responsive scroll-sm">
              <table className="table bordered-table mb-0">
                <thead>
                  <tr className="text-center">
                    <th>No</th>
                    <th>Date</th>
                    <th>Nomor</th>
                    <th>Type</th>
                    <th>Total</th>
                    <th>Status</th>
                  </tr>
                </thead>

                <tbody className="text-center">
                  {transactions.length === 0 && (
                    <tr>
                      <td colSpan="6" className="text-secondary-light">
                        No recent transactions found.
                      </td>
                    </tr>
                  )}

                  {transactions.map((t, i) => (
                    <tr key={t.type + t.id}>
                      <td>{i + 1}</td>

                      <td>{t.tanggal}</td>

                      <td>
                        <span
                          style={{
                            color: t.type === "Income" ? "#2563eb" : "#dc3545",
                            cursor: "pointer",
                          }}
                          onClick={() => {
                            window.location.href =
                              t.type === "Income"
                                ? `/invoice-preview?id=${t.id}`
                                : `/expense-preview?id=${t.id}`;
                          }}
                        >
                          {t.nomor}
                        </span>
                      </td>

                      <td>
                        <span
                          className={
                            t.type === "Income"
                              ? "text-primary-600"
                              : "text-danger-600"
                          }
                        >
                          {t.type}
                        </span>
                      </td>

                      <td>Rp {t.total.toLocaleString("id-ID")}</td>

                      <td>
                        <span
                          className={`${getStatusClass(
                            t.status
                          )} px-24 py-4 rounded-pill fw-medium text-sm`}
                        >
                          {t.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page-in {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 450ms ease, transform 450ms ease;
          will-change: opacity, transform;
        }
        .page-in.is-in {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .page-in,
          .page-in.is-in {
            transition: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </>
  );
};

export default RecentTransactions;

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

/* ✅ cek mode light/dark sama seperti sistem kamu */
function isLightModeNow() {
  if (typeof window === "undefined") return false;

  const html = document.documentElement;
  const body = document.body;

  const bs =
    (html.getAttribute("data-bs-theme") ||
      body?.getAttribute("data-bs-theme") ||
      "").toLowerCase();
  if (bs === "light") return true;
  if (bs === "dark") return false;

  const dt =
    (html.getAttribute("data-theme") ||
      body?.getAttribute("data-theme") ||
      "").toLowerCase();
  if (dt === "light") return true;
  if (dt === "dark") return false;

  const cls = `${html.className || ""} ${body?.className || ""}`.toLowerCase();
  if (cls.includes("light") || cls.includes("theme-light")) return true;
  if (cls.includes("dark") || cls.includes("theme-dark")) return false;

  return false;
}

const RecentTransactions = () => {
  // ✅ efek masuk
  const [pageIn, setPageIn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setPageIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const [transactions, setTransactions] = useState([]);
  const [isLightMode, setIsLightMode] = useState(false);

  useEffect(() => {
    const update = () => setIsLightMode(isLightModeNow());
    update();

    const obs = new MutationObserver(update);
    obs.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["data-bs-theme", "data-theme", "class", "style"],
    });
    if (document.body) {
      obs.observe(document.body, {
        attributes: true,
        attributeFilter: ["data-bs-theme", "data-theme", "class", "style"],
      });
    }
    return () => obs.disconnect();
  }, []);

  const cardBg = isLightMode ? "#ffffff" : "#1b2431";
  const cardBorder = isLightMode ? "rgba(148,163,184,0.35)" : "#273142";
  const textMain = isLightMode ? "#0b1220" : "#ffffff";
  const textSub = isLightMode ? "#64748b" : "#94a3b8";

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
          link: `/invoice-preview?id=${i.id}`,
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
          link: `/expense-preview?id=${e.id}`,
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

  /* ✅ render mobile card list */
  const renderMobileCards = () => {
    if (transactions.length === 0) {
      return (
        <div className="text-center py-4" style={{ color: textSub }}>
          No recent transactions found.
        </div>
      );
    }

    return (
      <div className="d-flex flex-column gap-12 d-md-none">
        {transactions.map((t) => (
          <div
            key={t.type + t.id}
            className="p-16 radius-12"
            style={{
              border: `1px solid ${cardBorder}`,
              backgroundColor: cardBg,
            }}
          >
            {/* header nomor + status */}
            <div className="d-flex justify-content-between align-items-start gap-2">
              <div>
                <span
                  style={{
                    color: t.type === "Income" ? "#2563eb" : "#dc3545",
                    cursor: "pointer",
                    fontWeight: 700,
                    fontSize: "14px",
                  }}
                  onClick={() => (window.location.href = t.link)}
                >
                  {t.nomor}
                </span>

                <div style={{ fontSize: "13px", color: textSub }}>
                  {t.type} • {t.tanggal}
                </div>
              </div>

              <span
                className={`${getStatusClass(
                  t.status
                )} px-16 py-4 rounded-pill fw-medium`}
                style={{
                  fontSize: "12px",
                  whiteSpace: "nowrap",
                }}
              >
                {t.status}
              </span>
            </div>

            {/* total */}
            <div className="mt-10 d-flex justify-content-between align-items-center">
              <div style={{ fontSize: "13px", color: textSub }}>
                Customer: {t.customer}
              </div>

              <div style={{ fontWeight: 700, fontSize: "14px", color: textMain }}>
                Rp {t.total.toLocaleString("id-ID")}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <>
      <div className={`col-xxl-12 page-in ${pageIn ? "is-in" : ""}`}>
        <div className="card h-100">
          <div className="card-header">
            {/* ✅ title + view all sejajar desktop & mobile */}
            <div className="d-flex align-items-center justify-content-between gap-2 flex-wrap flex-md-nowrap">
              <h6 className="mb-0 fw-bold text-lg">Recent Transactions</h6>

              <Link
                href="/invoice-list"
                className="text-primary-600 hover-text-primary d-flex align-items-center gap-1 cvant-rt-viewall"
                style={{ whiteSpace: "nowrap" }}
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
            {/* ✅ MOBILE */}
            {renderMobileCards()}

            {/* ✅ DESKTOP tetap table */}
            <div className="table-responsive scroll-sm d-none d-md-block">
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
                          onClick={() => (window.location.href = t.link)}
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
            {/* END TABLE */}
          </div>
        </div>
      </div>

      {/* ✅ mobile view-all kecil biar sejajar */}
      <style jsx global>{`
        @media (max-width: 767.98px) {
          .cvant-rt-viewall {
            font-size: 12px !important;
          }

          .cvant-rt-viewall .icon {
            font-size: 14px !important;
          }
        }
      `}</style>
    </>
  );
};

export default RecentTransactions;

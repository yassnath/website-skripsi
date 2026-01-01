"use client";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { useEffect, useState } from "react";
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

const LatestRegisteredOne = () => {
  // ✅ efek masuk
  const [pageIn, setPageIn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setPageIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const [latestInvoices, setLatestInvoices] = useState([]);
  const [biggestData, setBiggestData] = useState([]);
  const [activeTab, setActiveTab] = useState("latest");

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

  const formatTanggal = (raw) => {
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

  const fetchData = async () => {
    try {
      const [invRes, expRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/expenses"),
      ]);

      const invoices = Array.isArray(invRes) ? invRes : [];
      const expenses = Array.isArray(expRes) ? expRes : [];

      const incomeFormatted = invoices
        .map((i) => ({
          id: i.id,
          no_invoice: i.no_invoice,
          nama_pelanggan: i.nama_pelanggan,
          tanggal: formatTanggal(i.tanggal),
          total_bayar: Number(i.total_bayar),
          status: i.status,
        }))
        .sort((a, b) => {
          const da = new Date(a.tanggal.split("-").reverse().join("-"));
          const db = new Date(b.tanggal.split("-").reverse().join("-"));
          return db - da;
        })
        .slice(0, 6);

      setLatestInvoices(incomeFormatted);

      const invoiceData = invoices.map((i) => ({
        id: i.id,
        type: "invoice",
        no: i.no_invoice,
        customer: i.nama_pelanggan || "-",
        tanggal: formatTanggal(i.tanggal),
        total: Number(i.total_bayar),
        status: i.status,
        link: `/invoice-preview?id=${i.id}`,
      }));

      const expenseData = expenses.map((e) => ({
        id: e.id,
        type: "expense",
        no: e.no_expense,
        customer: "-",
        tanggal: formatTanggal(e.tanggal),
        total: Number(e.total_pengeluaran),
        status: e.status || "Recorded",
        link: `/expense-preview?id=${e.id}`,
      }));

      const biggest = [...invoiceData, ...expenseData]
        .sort((a, b) => b.total - a.total)
        .slice(0, 6);

      setBiggestData(biggest);
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  /* ✅ card style adapt light/dark */
  const cardBg = isLightMode ? "#ffffff" : "#1b2431";
  const cardBorder = isLightMode ? "rgba(148,163,184,0.35)" : "#273142";
  const cardTextMain = isLightMode ? "#0b1220" : "#ffffff";
  const cardTextSub = isLightMode ? "#64748b" : "#94a3b8";

  const renderMobileCardList = (data, isLatestMode) => {
    return (
      <div className="d-flex flex-column gap-12 d-md-none">
        {data.map((item) => {
          const id = isLatestMode ? item.id : `${item.type}-${item.id}`;
          const link = isLatestMode ? `/invoice-preview?id=${item.id}` : item.link;

          const no = isLatestMode ? item.no_invoice : item.no;
          const customer = isLatestMode ? item.nama_pelanggan : item.customer;
          const tanggal = item.tanggal;
          const total = isLatestMode ? item.total_bayar : item.total;
          const status = item.status;

          return (
            <div
              key={id}
              className="p-16 radius-12"
              style={{
                border: `1px solid ${cardBorder}`,
                backgroundColor: cardBg,
              }}
            >
              <div className="d-flex justify-content-between align-items-start gap-2">
                <div>
                  <Link
                    href={link}
                    style={{
                      color: item.type === "expense" ? "#dc3545" : "#2563eb",
                      textDecoration: "none",
                      fontWeight: 700,
                      fontSize: "14px",
                    }}
                  >
                    {no}
                  </Link>

                  <div style={{ fontSize: "13px", color: cardTextSub }}>
                    {customer}
                  </div>
                </div>

                <span
                  className={`${getStatusClass(status)} px-16 py-4 rounded-pill fw-medium`}
                  style={{
                    fontSize: "12px",
                    whiteSpace: "nowrap",
                  }}
                >
                  {status}
                </span>
              </div>

              <div className="mt-10 d-flex justify-content-between align-items-center">
                <div style={{ fontSize: "13px", color: cardTextSub }}>
                  {tanggal}
                </div>

                <div style={{ fontWeight: 700, fontSize: "14px", color: cardTextMain }}>
                  Rp {Number(total).toLocaleString("id-ID")}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    );
  };

  return (
    <>
      <div className={`col-xxl-8 col-xl-12 page-in ${pageIn ? "is-in" : ""}`}>
        <div className="card h-100">
          <div className="card-body p-24">
            {/* ✅ HEADER: Tabs + ViewAll sejajar (desktop & mobile) */}
            <div className="d-flex align-items-center justify-content-between gap-2 mb-16 flex-nowrap">
              {/* ✅ Tabs */}
              <ul className="nav border-gradient-tab nav-pills mb-0 d-flex flex-row gap-2 cvant-latest-tabs">
                <li className="nav-item">
                  <button
                    className={`nav-link d-flex align-items-center ${
                      activeTab === "latest" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("latest")}
                  >
                    <span className="d-none d-md-inline">Latest Customers</span>
                    <span className="d-inline d-md-none">Latest</span>

                    <span
                      className="text-sm fw-semibold py-6 px-12 rounded-pill text-white ms-12 cvant-tab-badge"
                      style={{
                        backgroundColor:
                          activeTab === "latest" ? "#2563eb" : "#6b7280",
                      }}
                    >
                      {latestInvoices.length}
                    </span>
                  </button>
                </li>

                <li className="nav-item">
                  <button
                    className={`nav-link d-flex align-items-center ${
                      activeTab === "biggest" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("biggest")}
                  >
                    <span className="d-none d-md-inline">Biggest Transactions</span>
                    <span className="d-inline d-md-none">Biggest</span>

                    <span
                      className="text-sm fw-semibold py-6 px-12 rounded-pill text-white ms-12 cvant-tab-badge"
                      style={{
                        backgroundColor:
                          activeTab === "biggest" ? "#2563eb" : "#6b7280",
                      }}
                    >
                      {biggestData.length}
                    </span>
                  </button>
                </li>
              </ul>

              {/* ✅ View All selalu sejajar */}
              <Link
                href="/invoice-list"
                style={{
                  color: "#2563eb",
                  textDecoration: "none",
                  whiteSpace: "nowrap",
                }}
                className="d-flex align-items-center gap-1 cvant-view-all"
              >
                View All{" "}
                <Icon icon="solar:alt-arrow-right-linear" className="icon" />
              </Link>
            </div>

            {/* ✅ TAB CONTENT */}
            <div className="tab-content">
              {/* Latest */}
              <div
                className={`tab-pane fade ${
                  activeTab === "latest" ? "show active" : ""
                }`}
              >
                {renderMobileCardList(latestInvoices, true)}

                {/* ✅ DESKTOP TABLE tetap */}
                <div className="table-responsive scroll-sm d-none d-md-block">
                  <table className="table bordered-table sm-table mb-0">
                    <thead>
                      <tr className="text-center">
                        <th>No Invoice</th>
                        <th>Customer</th>
                        <th>Tanggal</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {latestInvoices.map((i) => (
                        <tr key={i.id} className="text-center">
                          <td>
                            <Link
                              href={`/invoice-preview?id=${i.id}`}
                              style={{ color: "#2563eb", textDecoration: "none" }}
                            >
                              {i.no_invoice}
                            </Link>
                          </td>
                          <td>{i.nama_pelanggan}</td>
                          <td>{i.tanggal}</td>
                          <td>
                            Rp {Number(i.total_bayar).toLocaleString("id-ID")}
                          </td>
                          <td>
                            <span
                              className={`${getStatusClass(
                                i.status
                              )} px-24 py-4 rounded-pill fw-medium text-sm`}
                            >
                              {i.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Biggest */}
              <div
                className={`tab-pane fade ${
                  activeTab === "biggest" ? "show active" : ""
                }`}
              >
                {renderMobileCardList(biggestData, false)}

                {/* ✅ DESKTOP TABLE tetap */}
                <div className="table-responsive scroll-sm d-none d-md-block">
                  <table className="table bordered-table sm-table mb-0">
                    <thead>
                      <tr className="text-center">
                        <th>No Invoice</th>
                        <th>Customer</th>
                        <th>Tanggal</th>
                        <th>Total</th>
                        <th>Status</th>
                      </tr>
                    </thead>

                    <tbody>
                      {biggestData.map((d) => (
                        <tr key={`${d.type}-${d.id}`} className="text-center">
                          <td>
                            <Link
                              href={d.link}
                              style={{
                                color: d.type === "expense" ? "#dc3545" : "#2563eb",
                                textDecoration: "none",
                              }}
                            >
                              {d.no}
                            </Link>
                          </td>
                          <td>{d.customer}</td>
                          <td>{d.tanggal}</td>
                          <td>Rp {d.total.toLocaleString("id-ID")}</td>
                          <td>
                            <span
                              className={`${getStatusClass(
                                d.status
                              )} px-24 py-4 rounded-pill fw-medium text-sm`}
                            >
                              {d.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
            {/* END TAB */}
          </div>
        </div>
      </div>

      {/* ✅ STYLE KHUSUS MOBILE: TAB + VIEW ALL sama ukuran & tetap 1 baris */}
      <style jsx global>{`
        @media (max-width: 767.98px) {
          /* ✅ paksa header tetap 1 baris */
          .cvant-latest-tabs {
            gap: 6px !important;
            flex-wrap: nowrap !important;
          }

          /* ✅ Tab font sama seperti ViewAll */
          .cvant-latest-tabs .nav-link {
            font-size: 13px !important;
            padding: 7px 10px !important;
            border-radius: 10px !important;
            white-space: nowrap !important;
          }

          /* ✅ Badge lebih kecil tapi tetap jelas */
          .cvant-tab-badge {
            font-size: 11px !important;
            padding: 4px 8px !important;
            margin-left: 6px !important;
          }

          /* ✅ ViewAll font sama dengan tab */
          .cvant-view-all {
            font-size: 13px !important;
            font-weight: 600;
            white-space: nowrap !important;
          }

          .cvant-view-all .icon {
            font-size: 15px !important;
          }
        }
      `}</style>
    </>
  );
};

export default LatestRegisteredOne;

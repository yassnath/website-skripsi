"use client";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

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

  return (
    <>
      <div
        className={`col-xxl-8 col-xl-12 page-in ${pageIn ? "is-in" : ""}`}
      >
        <div className="card h-100">
          <div className="card-body p-24">
            <div className="d-flex flex-wrap align-items-center gap-1 justify-content-between mb-16">
              <ul className="nav border-gradient-tab nav-pills mb-0">
                <li className="nav-item">
                  <button
                    className={`nav-link d-flex align-items-center ${
                      activeTab === "latest" ? "active" : ""
                    }`}
                    onClick={() => setActiveTab("latest")}
                  >
                    Latest Customers
                    <span
                      className="text-sm fw-semibold py-6 px-12 rounded-pill text-white ms-12"
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
                    Biggest Transactions
                    <span
                      className="text-sm fw-semibold py-6 px-12 rounded-pill text-white ms-12"
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

              <Link
                href="/invoice-list"
                style={{ color: "#2563eb", textDecoration: "none" }}
                className="d-flex align-items-center gap-1"
              >
                View All{" "}
                <Icon icon="solar:alt-arrow-right-linear" className="icon" />
              </Link>
            </div>

            <div className="tab-content">
              <div
                className={`tab-pane fade ${
                  activeTab === "latest" ? "show active" : ""
                }`}
              >
                <div className="table-responsive scroll-sm">
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
                          <td>Rp {Number(i.total_bayar).toLocaleString("id-ID")}</td>
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

              <div
                className={`tab-pane fade ${
                  activeTab === "biggest" ? "show active" : ""
                }`}
              >
                <div className="table-responsive scroll-sm">
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
                                color:
                                  d.type === "expense" ? "#dc3545" : "#2563eb",
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
          </div>
        </div>
      </div>
</>
  );
};

export default LatestRegisteredOne;

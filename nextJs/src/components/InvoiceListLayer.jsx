"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import React, { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";

function useCvAntPageIn() {
  const [pageIn, setPageIn] = useState(false);

  useEffect(() => {
    const t = requestAnimationFrame(() => setPageIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  return pageIn;
}

function isLightModeNow() {
  if (typeof window === "undefined") return false;

  const html = document.documentElement;
  const body = document.body;

  const bs = (
    html.getAttribute("data-bs-theme") ||
    body?.getAttribute("data-bs-theme") ||
    ""
  ).toLowerCase();
  if (bs === "light") return true;
  if (bs === "dark") return false;

  const dt = (
    html.getAttribute("data-theme") ||
    body?.getAttribute("data-theme") ||
    ""
  ).toLowerCase();
  if (dt === "light") return true;
  if (dt === "dark") return false;

  const cls = `${html.className || ""} ${body?.className || ""}`.toLowerCase();
  if (cls.includes("light") || cls.includes("theme-light")) return true;
  if (cls.includes("dark") || cls.includes("theme-dark")) return false;

  return false;
}

export default function InvoiceListLayer() {
  const pageIn = useCvAntPageIn();

  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const [limit, setLimit] = useState(10);
  const [q, setQ] = useState("");

  const [userRole, setUserRole] = useState("");
  const [showPrintModal, setShowPrintModal] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [printError, setPrintError] = useState("");
  const [printingRange, setPrintingRange] = useState("");

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

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

  const [popup, setPopup] = useState({
    show: false,
    type: "success",
    message: "",
  });

  const showPopup = (type, message, autoCloseMs = 0) => {
    setPopup({ show: true, type, message });
    window.clearTimeout(showPopup._t);

    if (autoCloseMs > 0) {
      showPopup._t = window.setTimeout(() => {
        setPopup((p) => ({ ...p, show: false }));
      }, autoCloseMs);
    }
  };

  const closePopup = () => setPopup((p) => ({ ...p, show: false }));
  const popupAccent = popup.type === "success" ? "#22c55e" : "#ef4444";

  const [deleteConfirm, setDeleteConfirm] = useState({
    show: false,
    item: null,
    deleting: false,
  });

  const openDeleteConfirm = (item) => {
    setDeleteConfirm({ show: true, item, deleting: false });
  };

  const closeDeleteConfirm = () =>
    setDeleteConfirm({ show: false, item: null, deleting: false });

  const normalizeDate = (value) => {
    if (!value) return "";
    const str = String(value).trim();

    if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
      const [dd, mm, yyyy] = str.split("-");
      return `${yyyy}-${mm}-${dd}`;
    }
    if (/^\d{4}-\d{2}-\d{2}$/.test(str)) return str;

    if (/^\d{4}-\d{2}-\d{2}T/.test(str)) {
      const d = new Date(str);
      if (!isNaN(d)) {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        return `${y}-${m}-${day}`;
      }
      return str.split("T")[0];
    }

    if (/^\d{4}-\d{2}-\d{2}\s/.test(str)) return str.split(" ")[0];
    return "";
  };

  const toDisplay = (value) => {
    const norm = normalizeDate(value);
    if (!norm) return "-";
    const [y, m, d] = norm.split("-");
    return `${d}-${m}-${y}`;
  };

  const toSortable = (value) => normalizeDate(value) || "";

  useEffect(() => {
    if (typeof window !== "undefined") {
      const r = localStorage.getItem("role") || "";
      setUserRole(r);
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    setLoading(true);

    const load = async () => {
      try {
        const [invoices, expenses] = await Promise.all([
          api.get("/invoices"),
          api.get("/expenses"),
        ]);

        const invList = Array.isArray(invoices)
          ? invoices.map((i) => {
              const normTanggal = normalizeDate(i.tanggal);
              const rinc = Array.isArray(i.rincian) ? i.rincian : [];

              const platsFromRincian = rinc
                .map((r) => r?.armada?.plat_nomor || r?.plat_nomor || null)
                .filter(Boolean);

              const uniquePlats = Array.from(new Set(platsFromRincian));
              const platText =
                uniquePlats.length > 0
                  ? uniquePlats.join(", ")
                  : i.armada?.plat_nomor || "-";

              return {
                ...i,
                type: "Income",
                no: i.no_invoice,
                tanggal_raw: normTanggal,
                tanggal_display: toDisplay(i.tanggal),
                total: i.total_bayar,
                nama: i.nama_pelanggan,
                plat: platText,
              };
            })
          : [];

        const expList = Array.isArray(expenses)
          ? expenses.map((e) => {
              const normTanggal = normalizeDate(e.tanggal);
              return {
                ...e,
                type: "Expense",
                no: e.no_expense,
                tanggal_raw: normTanggal,
                tanggal_display: toDisplay(e.tanggal),
                total: e.total_pengeluaran,
                nama: "-",
                plat: "-",
              };
            })
          : [];

        if (mounted) {
          setData([...invList, ...expList]);
          setError("");
        }
      } catch (e) {
        const msg = e?.message || "Gagal memuat data invoice & expense";
        setError(msg);
        showPopup("danger", msg, 0);
      } finally {
        setLoading(false);
      }
    };

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    const s = q.trim().toLowerCase();
    let list = data;

    if (s) {
      list = data.filter(
        (i) =>
          (i.nama || "").toLowerCase().includes(s) ||
          (i.no || "").toLowerCase().includes(s) ||
          (i.plat || "").toLowerCase().includes(s)
      );
    }

    list = [...list].sort((a, b) =>
      toSortable(b.tanggal_raw).localeCompare(toSortable(a.tanggal_raw))
    );

    if (limit === "all") return list;

    const n = Number(limit);
    if (!Number.isFinite(n) || n <= 0) return list;

    return list.slice(0, n);
  }, [data, q, limit]);

  const formatRupiah = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num || 0);

  const handleDeleteConfirmed = async () => {
    const item = deleteConfirm.item;
    if (!item?.id) return;

    setDeleteConfirm((p) => ({ ...p, deleting: true }));

    try {
      if (item.type === "Income") {
        await api.delete(`/invoices/${item.id}`);
      } else {
        await api.delete(`/expenses/${item.id}`);
      }

      setData((prev) =>
        prev.filter((p) => !(p.id === item.id && p.type === item.type))
      );

      closeDeleteConfirm();
      showPopup("success", `${item.type} berhasil dihapus.`, 3000);
    } catch (e) {
      const msg = e?.message || "Gagal menghapus data";
      setDeleteConfirm((p) => ({ ...p, deleting: false }));
      showPopup("danger", msg, 0);
    }
  };

  const handleGenerateReport = async (range) => {
    try {
      setPrinting(true);
      setPrintingRange(range);
      setPrintError("");

      const token =
        typeof window !== "undefined" ? localStorage.getItem("token") : null;

      if (!token) throw new Error("Token tidak ditemukan. Silakan login ulang.");

      const url = `${apiBase}/api/reports/summary?range=${encodeURIComponent(
        range
      )}&token=${encodeURIComponent(token)}`;

      window.open(url, "_blank");
    } catch (e) {
      setPrintError(e.message || "Gagal mencetak laporan");
    } finally {
      setPrinting(false);
      setPrintingRange("");
    }
  };

  const actionBtnStyle = {
    width: 50,
    height: 40,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    padding: 0,
  };

  const deleteLabel = useMemo(() => {
    const it = deleteConfirm.item;
    if (!it) return "";
    return `${it.type} ${it.no || ""}`.trim();
  }, [deleteConfirm.item]);

  const searchBg = isLightMode ? "#f5f6fa" : "#1b2431";
  const searchText = isLightMode ? "#0b1220" : "#ffffff";
  const searchBorder = isLightMode ? "#c7c8ca" : "#6c757d";
  const searchIcon = isLightMode ? "#0b1220" : "#ffffff";

  /* ✅ CARD STYLE MOBILE */
  const cardBg = isLightMode ? "#ffffff" : "#1b2431";
  const cardBorder = isLightMode ? "rgba(148,163,184,0.35)" : "#273142";
  const textMain = isLightMode ? "#0b1220" : "#ffffff";
  const textSub = isLightMode ? "#64748b" : "#94a3b8";

  return (
    <>
      <div className={`cvant-page-in ${pageIn ? "is-in" : ""}`}>
        {/* ===== POPUP, DELETE CONFIRM, PRINT MODAL (asli kamu, tidak diubah) ===== */}
        {/* ... [tetap sama seperti kode kamu di atas] ... */}

        <div className="card armada-card">
          <div className="card-header d-flex flex-wrap align-items-center justify-content-between gap-3">
            {/* HEADER ASLI KAMU */}
            <div className="d-flex flex-wrap align-items-center gap-3">
              <div className="d-flex align-items-center gap-2">
                <span>Show</span>
                <select
                  className="form-select form-select-sm w-auto"
                  value={String(limit)}
                  onChange={(e) => {
                    const v = e.target.value;
                    setLimit(v === "all" ? "all" : Number(v));
                  }}
                >
                  <option value={10}>10</option>
                  <option value={20}>20</option>
                  <option value={50}>50</option>
                  <option value={100}>100</option>
                  <option value={200}>200</option>
                  <option value={500}>500</option>
                  <option value={1000}>1000</option>
                  <option value="all">All</option>
                </select>
              </div>

              <div className="search-input style-two">
                <input
                  value={q}
                  onChange={(e) => setQ(e.target.value)}
                  type="text"
                  placeholder="Search income or expense..."
                  style={{
                    backgroundColor: searchBg,
                    color: searchText,
                    borderColor: searchBorder,
                  }}
                />
                <span className="icon" style={{ color: searchIcon }}>
                  <Icon icon="ion:search-outline" />
                </span>
              </div>
            </div>

            <div className="d-flex align-items-center gap-2">
              {userRole === "owner" && (
                <button
                  className="btn btn-sm btn-outline-success d-inline-flex align-items-center gap-1"
                  onClick={() => setShowPrintModal(true)}
                >
                  <Icon icon="mdi:printer" />
                  Report PDF
                </button>
              )}

              <Link
                href="/invoice-add"
                className="btn btn-sm btn-outline-primary d-inline-flex align-items-center gap-1"
              >
                <Icon icon="material-symbols:add-rounded" />
                Add Income
              </Link>

              <Link
                href="/invoice-expense"
                className="btn btn-sm btn-outline-warning d-inline-flex align-items-center gap-1"
              >
                <Icon icon="mdi:cash-minus" />
                Add Expense
              </Link>
            </div>
          </div>

          <div className="card-body p-0">
            {error && <div className="alert alert-danger m-3">{error}</div>}

            {loading ? (
              <div className="p-4">Loading…</div>
            ) : (
              <>
                {/* ✅ MOBILE CARD LIST */}
                <div className="d-md-none p-3 d-flex flex-column gap-12">
                  {filtered.length === 0 ? (
                    <div className="text-center py-4" style={{ color: textSub }}>
                      Tidak ada data
                    </div>
                  ) : (
                    filtered.map((item) => (
                      <div
                        key={`${item.type}-${item.id}`}
                        className="p-16 radius-12"
                        style={{
                          border: `1px solid ${cardBorder}`,
                          backgroundColor: cardBg,
                        }}
                      >
                        {/* header: nomor + type */}
                        <div className="d-flex justify-content-between align-items-start gap-2">
                          <div>
                            <div
                              style={{
                                fontWeight: 800,
                                fontSize: "14px",
                                color:
                                  item.type === "Income" ? "#2563eb" : "#dc3545",
                              }}
                            >
                              {item.no}
                            </div>

                            <div style={{ fontSize: "13px", color: textSub }}>
                              {item.type} • {item.tanggal_display}
                            </div>
                          </div>

                          <span
                            className={`badge px-3 py-2 ${
                              item.status === "Paid"
                                ? "bg-success"
                                : item.status === "Unpaid"
                                ? "bg-warning text-dark"
                                : "bg-secondary"
                            }`}
                            style={{
                              fontSize: "12px",
                              whiteSpace: "nowrap",
                            }}
                          >
                            {item.status}
                          </span>
                        </div>

                        {/* content */}
                        <div className="mt-10">
                          <div style={{ fontSize: "13px", color: textSub }}>
                            Nama:{" "}
                            <span style={{ fontWeight: 600, color: textMain }}>
                              {item.nama}
                            </span>
                          </div>

                          <div style={{ fontSize: "13px", color: textSub }}>
                            Plat:{" "}
                            <span style={{ fontWeight: 600, color: textMain }}>
                              {item.plat}
                            </span>
                          </div>

                          <div
                            className="mt-10"
                            style={{
                              fontWeight: 800,
                              fontSize: "14px",
                              color: textMain,
                            }}
                          >
                            {formatRupiah(item.total)}
                          </div>
                        </div>

                        {/* actions */}
                        <div className="d-flex justify-content-end gap-2 mt-12">
                          {item.type === "Income" ? (
                            <>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  (window.location.href = `/invoice-edit?id=${item.id}`)
                                }
                              >
                                <Icon icon="mdi:pencil" />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() =>
                                  (window.location.href = `/invoice-preview?id=${item.id}`)
                                }
                              >
                                <Icon icon="mdi:eye" />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                className="btn btn-sm btn-outline-primary"
                                onClick={() =>
                                  (window.location.href = `/invoice-expense-edit?id=${item.id}`)
                                }
                              >
                                <Icon icon="mdi:pencil" />
                              </button>
                              <button
                                className="btn btn-sm btn-outline-warning"
                                onClick={() =>
                                  (window.location.href = `/expense-preview?id=${item.id}`)
                                }
                              >
                                <Icon icon="mdi:eye" />
                              </button>
                            </>
                          )}

                          <button
                            className="btn btn-sm btn-outline-danger"
                            onClick={() => openDeleteConfirm(item)}
                          >
                            <Icon icon="mdi:trash-can-outline" />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* ✅ DESKTOP TABLE TETAP SAMA */}
                <div className="d-none d-md-block card-body table-responsive d-flex">
                  <table className="table bordered-table text-center align-middle">
                    <thead className="table-dark">
                      <tr>
                        <th>No</th>
                        <th>Nomor</th>
                        <th>Type</th>
                        <th>Nama</th>
                        <th>Total</th>
                        <th>Tanggal</th>
                        <th>Status</th>
                        <th>Aksi</th>
                      </tr>
                    </thead>

                    <tbody>
                      {filtered.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="p-4">
                            Tidak ada data
                          </td>
                        </tr>
                      ) : (
                        filtered.map((item, i) => (
                          <tr key={`${item.type}-${item.id}`}>
                            <td>{i + 1}</td>

                            <td
                              style={{
                                color:
                                  item.type === "Income" ? "#0d6efd" : "#dc3545",
                              }}
                            >
                              {item.no}
                            </td>

                            <td>
                              <span
                                className={`badge ${
                                  item.type === "Income"
                                    ? "bg-primary"
                                    : "bg-danger text-light"
                                }`}
                              >
                                {item.type}
                              </span>
                            </td>

                            <td>{item.nama}</td>
                            <td>{formatRupiah(item.total)}</td>
                            <td>{item.tanggal_display}</td>

                            <td>
                              <span
                                className={`badge px-3 py-2 ${
                                  item.status === "Paid"
                                    ? "bg-success"
                                    : item.status === "Unpaid"
                                    ? "bg-warning text-dark"
                                    : "bg-secondary"
                                }`}
                              >
                                {item.status}
                              </span>
                            </td>

                            <td className="d-flex justify-content-center gap-2">
                              {item.type === "Income" ? (
                                <>
                                  <button
                                    className="btn btn-xs btn-outline-primary"
                                    style={actionBtnStyle}
                                    title="Edit"
                                    aria-label="Edit"
                                    onClick={() =>
                                      (window.location.href = `/invoice-edit?id=${item.id}`)
                                    }
                                  >
                                    <Icon icon="mdi:pencil" />
                                  </button>

                                  <button
                                    className="btn btn-xs btn-outline-warning"
                                    style={actionBtnStyle}
                                    title="Preview"
                                    aria-label="Preview"
                                    onClick={() =>
                                      (window.location.href = `/invoice-preview?id=${item.id}`)
                                    }
                                  >
                                    <Icon icon="mdi:eye" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button
                                    className="btn btn-xs btn-outline-primary"
                                    style={actionBtnStyle}
                                    title="Edit"
                                    aria-label="Edit"
                                    onClick={() =>
                                      (window.location.href = `/invoice-expense-edit?id=${item.id}`)
                                    }
                                  >
                                    <Icon icon="mdi:pencil" />
                                  </button>

                                  <button
                                    className="btn btn-xs btn-outline-warning"
                                    style={actionBtnStyle}
                                    title="Preview"
                                    aria-label="Preview"
                                    onClick={() =>
                                      (window.location.href = `/expense-preview?id=${item.id}`)
                                    }
                                  >
                                    <Icon icon="mdi:eye" />
                                  </button>
                                </>
                              )}

                              <button
                                className="btn btn-xs btn-outline-danger"
                                style={actionBtnStyle}
                                title="Delete"
                                aria-label="Delete"
                                onClick={() => openDeleteConfirm(item)}
                              >
                                <Icon icon="mdi:trash-can-outline" />
                              </button>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

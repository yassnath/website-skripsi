"use client";

import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { Icon } from "@iconify/react/dist/iconify.js";

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

export default function InvoiceExpenseEditPage() {
  const pageIn = useCvAntPageIn();

  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

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

  const controlBg = isLightMode ? "#ffffff" : "#273142";
  const controlText = isLightMode ? "#0b1220" : "#ffffff";
  const controlBorder = isLightMode ? "#c7c8ca" : "#6c757d";
  const optionBg = controlBg;
  const optionText = controlText;

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

  const [form, setForm] = useState({
    no_expense: "",
    tanggal: "",
    total_pengeluaran: 0,
    status: "Approved",
    dicatat_oleh: "Admin",
    rincian: [{ nama: "", jumlah: "" }],
  });

  const toInputDate = (raw) => {
    if (!raw) return "";
    const s = String(raw).trim();

    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

    if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
      const [dd, mm, yyyy] = s.split("-");
      return `${yyyy}-${mm}-${dd}`;
    }

    if (s.includes("T") || s.endsWith("Z") || /[+-]\d{2}:\d{2}$/.test(s)) {
      const d = new Date(s);
      if (!isNaN(d.getTime())) {
        const yyyy = d.getFullYear();
        const mm = String(d.getMonth() + 1).padStart(2, "0");
        const dd = String(d.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      }
    }

    if (/^\d{4}-\d{2}-\d{2}\s/.test(s)) {
      const maybe = s.split(" ")[0];
      if (/^\d{4}-\d{2}-\d{2}$/.test(maybe)) return maybe;
    }

    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

    return "";
  };

  useEffect(() => {
    if (!id) {
      setLoading(false);
      showPopup("danger", "ID expense tidak ditemukan.", 0);
      return;
    }

    setLoading(true);

    api
      .get(`/expenses/${id}`)
      .then((res) => {
        const d = res.data ?? res;

        setForm({
          no_expense: d.no_expense || "",
          tanggal: toInputDate(d.tanggal),
          total_pengeluaran: parseFloat(d.total_pengeluaran) || 0,
          status: d.status || "Approved",
          dicatat_oleh: d.dicatat_oleh || "Admin",
          rincian: Array.isArray(d.rincian)
            ? d.rincian.map((r) => ({
                nama: r.nama || "",
                jumlah: r.jumlah || 0,
              }))
            : [{ nama: "", jumlah: 0 }],
        });

        setErr("");
      })
      .catch((e) => {
        console.error("EXPENSE FETCH ERROR:", e);
        setErr("Gagal memuat data pengeluaran");
        showPopup("danger", "Gagal memuat data pengeluaran", 0);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const totalExpense = useMemo(
    () => form.rincian.reduce((sum, r) => sum + (parseFloat(r.jumlah) || 0), 0),
    [form.rincian]
  );

  useEffect(() => {
    setForm((prev) => ({
      ...prev,
      total_pengeluaran: totalExpense,
    }));
  }, [totalExpense]);

  const onChange = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const updateRincian = (index, key, value) => {
    const updated = [...form.rincian];
    updated[index][key] = value;
    setForm((prev) => ({ ...prev, rincian: updated }));
  };

  const addRincian = () => {
    setForm((prev) => ({
      ...prev,
      rincian: [...prev.rincian, { nama: "", jumlah: "" }],
    }));
  };

  const removeRincian = (index) => {
    if (form.rincian.length === 1) return;
    setForm((prev) => ({
      ...prev,
      rincian: prev.rincian.filter((_, i) => i !== index),
    }));
  };

  const validate = () => {
    if (!form.tanggal) {
      setErr("");
      showPopup("danger", "Tanggal harus diisi.", 0);
      return false;
    }

    if (!Array.isArray(form.rincian) || form.rincian.length === 0) {
      setErr("");
      showPopup("danger", "Minimal satu rincian harus diisi.", 0);
      return false;
    }

    const cleaned = form.rincian.filter(
      (r) => (r.nama || "").trim() && (parseFloat(r.jumlah) || 0) > 0
    );

    if (cleaned.length === 0) {
      setErr("");
      showPopup(
        "danger",
        "Minimal satu rincian harus memiliki Nama dan Jumlah > 0.",
        0
      );
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!id) {
      showPopup("danger", "ID expense tidak ditemukan.", 0);
      return;
    }

    if (!validate()) return;

    setSaving(true);
    setErr("");

    try {
      const payload = {
        tanggal: form.tanggal,
        total_pengeluaran: totalExpense,
        status: form.status,
        dicatat_oleh: form.dicatat_oleh,
        rincian: form.rincian
          .filter((r) => (r.nama || "").trim() && (parseFloat(r.jumlah) || 0) > 0)
          .map((r) => ({
            nama: (r.nama || "").trim(),
            jumlah: parseFloat(r.jumlah) || 0,
          })),
      };

      await api.put(`/expenses/${id}`, payload);

      showPopup(
        "success",
        "Expense updated successfully! Redirecting to Invoice List Page...",
        3000
      );
      setTimeout(() => {
        window.location.href = "/invoice-list";
      }, 3000);
    } catch (e) {
      console.error(e);
      setErr("Gagal menyimpan perubahan.");
      showPopup("danger", "Gagal menyimpan perubahan.", 0);
    } finally {
      setSaving(false);
    }
  };

  const handlePreview = () => {
    if (!id) {
      showPopup("danger", "ID expense tidak ditemukan.", 0);
      return;
    }
    window.location.href = `/expense-preview?id=${id}`;
  };

  const formatRupiah = (num) =>
    new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      minimumFractionDigits: 0,
    }).format(num);

  if (loading) return <div className="p-5 text-center">Memuat data...</div>;

  return (
    <>
      <div className={`cvant-page-in ${pageIn ? "is-in" : ""}`}>
      {popup.show && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            zIndex: 9999,
            background: "rgba(0,0,0,0.55)",
            padding: "16px",
          }}
          onClick={closePopup}
        >
          <div
            className="radius-12 shadow-sm p-24"
            style={{
              width: "100%",
              maxWidth: "600px",
              backgroundColor: "#1b2431",
              border: `2px solid ${popupAccent}`,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-start justify-content-between gap-2">
              <div className="d-flex align-items-start gap-12">
                <span style={{ marginTop: "2px" }}>
                  <Icon
                    icon={
                      popup.type === "success"
                        ? "solar:check-circle-linear"
                        : "solar:danger-triangle-linear"
                    }
                    style={{
                      fontSize: "28px",
                      color: popupAccent,
                    }}
                  />
                </span>

                <div>
                  <h5 className="mb-8 fw-bold" style={{ color: "#ffffff" }}>
                    {popup.type === "success" ? "Success" : "Error"}
                  </h5>
                  <p
                    className="mb-0"
                    style={{ color: "#cbd5e1", fontSize: "15px" }}
                  >
                    {popup.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn p-0"
                aria-label="Close"
                onClick={closePopup}
                style={{
                  border: "none",
                  background: "transparent",
                  lineHeight: 1,
                }}
              >
                <Icon
                  icon="solar:close-circle-linear"
                  style={{ fontSize: 24, color: "#94a3b8" }}
                />
              </button>
            </div>

            <div className="d-flex justify-content-end mt-20">
              <button
                type="button"
                className={`btn btn-${
                  popup.type === "success" ? "primary" : "danger"
                } radius-12 px-16`}
                onClick={closePopup}
                style={{
                  border: `2px solid ${popupAccent}`,
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="container-fluid py-4">
        <div className="row g-4">
          <div className="col-lg-12">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-transparent d-flex justify-content-end gap-3">
                <button
                  onClick={handlePreview}
                  className="btn btn-sm btn-outline-warning"
                >
                  Preview
                </button>

                <button
                  disabled={saving}
                  onClick={handleSave}
                  className="btn btn-sm btn-primary"
                >
                  {saving ? "Saving..." : "Save"}
                </button>
              </div>

              <div className="card-body">
                <div className="row g-3">
                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Nomor Expense</label>
                    <input
                      className="form-control"
                      value={form.no_expense}
                      readOnly
                    />
                  </div>

                  <div className="col-md-6">
                    <label className="form-label fw-semibold">Tanggal</label>
                    <input
                      type="date"
                      className="form-control"
                      value={form.tanggal}
                      onChange={onChange("tanggal")}
                    />
                  </div>

                  <div className="col-12">
                    <hr />
                  </div>

                  <div className="col-12">
                    <label className="form-label fw-semibold">
                      Rincian Pengeluaran
                    </label>

                    {form.rincian.map((r, i) => (
                      <div className="row g-2 align-items-center mb-2" key={i}>
                        <div className="col-md-6">
                          <input
                            type="text"
                            className="form-control"
                            placeholder="Nama pengeluaran"
                            value={r.nama}
                            onChange={(e) => updateRincian(i, "nama", e.target.value)}
                          />
                        </div>

                        <div className="col-md-4">
                          <input
                            type="number"
                            className="form-control text-end"
                            placeholder="Jumlah (Rp)"
                            value={r.jumlah}
                            onChange={(e) => updateRincian(i, "jumlah", e.target.value)}
                          />
                        </div>

                        <div className="col-md-2 text-end">
                          {form.rincian.length > 1 && (
                            <button
                              className="btn btn-sm btn-outline-danger"
                              onClick={() => removeRincian(i)}
                            >
                              Hapus
                            </button>
                          )}
                        </div>
                      </div>
                    ))}

                    <button
                      className="btn btn-sm btn-outline-primary mt-2"
                      onClick={addRincian}
                    >
                      + Tambah Pengeluaran
                    </button>
                  </div>

                  <div className="col-md-6 mt-4">
                    <label className="form-label fw-semibold">
                      Total Pengeluaran
                    </label>
                    <input
                      type="text"
                      className="form-control fw-bold"
                      readOnly
                      value={formatRupiah(totalExpense)}
                    />
                  </div>

                  <div className="col-md-3 mt-4">
                    <label className="form-label fw-semibold">Status</label>
                    <select
                      className="form-select"
                      value={form.status}
                      onChange={onChange("status")}
                      style={{
                        backgroundColor: controlBg,
                        color: controlText,
                        borderColor: controlBorder,
                      }}
                    >
                      {["Approved", "Paid"].map((s) => (
                        <option
                          key={s}
                          value={s}
                          style={{ backgroundColor: optionBg, color: optionText }}
                        >
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="col-md-3 mt-4">
                    <label className="form-label fw-semibold">Dicatat Oleh</label>
                    <select
                      className="form-select"
                      value={form.dicatat_oleh}
                      onChange={onChange("dicatat_oleh")}
                      style={{
                        backgroundColor: controlBg,
                        color: controlText,
                        borderColor: controlBorder,
                      }}
                    >
                      {["Admin", "Owner"].map((role) => (
                        <option
                          key={role}
                          value={role}
                          style={{ backgroundColor: optionBg, color: optionText }}
                        >
                          {role}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      </div>
</>
  );
}
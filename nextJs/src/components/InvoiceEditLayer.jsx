"use client";

import { useSearchParams, useRouter } from "next/navigation";
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

export default function InvoiceEditLayer() {
  const pageIn = useCvAntPageIn();
  const sp = useSearchParams();
  const router = useRouter();
  const id = sp.get("id");

  const [armadas, setArmadas] = useState([]);
  const [form, setForm] = useState({
    no_invoice: "",
    tanggal: "",
    due_date: "",
    nama_pelanggan: "",
    email: "",
    no_telp: "",
    status: "Unpaid",
    diterima_oleh: "Admin",
    rincian: [
      {
        lokasi_muat: "",
        lokasi_bongkar: "",
        armada_id: "",
        armada_start_date: "",
        armada_end_date: "",
        tonase: "",
        harga: "",
      },
    ],
  });

  const [err, setErr] = useState("");
  const [saving, setSaving] = useState(false);
  const [isLightMode, setIsLightMode] = useState(false);

  const apiBase = useMemo(() => {
    let base = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    return String(base).replace(/\/+$/, "");
  }, []);

  const siteBase = useMemo(() => {
    if (typeof window !== "undefined") {
      return (
        (process.env.NEXT_PUBLIC_SITE_URL || window.location.origin).replace(
          /\/+$/,
          ""
        )
      );
    }
    return (process.env.NEXT_PUBLIC_SITE_URL || "").replace(/\/+$/, "");
  }, []);

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

  const controlBg = isLightMode ? "#ffffff" : "#273142";
  const controlText = isLightMode ? "#0b1220" : "#ffffff";
  const controlBorder = isLightMode ? "#c7c8ca" : "#6c757d";
  const optionBg = controlBg;
  const optionText = controlText;

  const toInputDate = (raw) => {
    if (!raw) return "";
    const str = String(raw).trim();

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

  useEffect(() => {
    api
      .get("/armadas")
      .then((res) => setArmadas(Array.isArray(res) ? res : []))
      .catch(() => setArmadas([]));
  }, []);

  useEffect(() => {
    if (!id) return;

    api
      .get(`/invoices/${id}`)
      .then((d) => {
        let rincian = [];

        const rawRincian = d?.rincian ?? d?.details ?? [];
        if (typeof rawRincian === "string") {
          try {
            const parsed = JSON.parse(rawRincian);
            rincian = Array.isArray(parsed) ? parsed : [];
          } catch {
            rincian = [];
          }
        } else {
          rincian = Array.isArray(rawRincian) ? rawRincian : [];
        }

        if (rincian.length === 0) {
          rincian = [
            {
              lokasi_muat: "",
              lokasi_bongkar: "",
              armada_id: "",
              armada_start_date: "",
              armada_end_date: "",
              tonase: "",
              harga: "",
            },
          ];
        }

        rincian = rincian.map((r) => ({
          lokasi_muat: r.lokasi_muat ?? "",
          lokasi_bongkar: r.lokasi_bongkar ?? "",
          armada_id: r.armada_id ?? "",
          armada_start_date: toInputDate(r.armada_start_date ?? ""),
          armada_end_date: toInputDate(r.armada_end_date ?? ""),
          tonase: r.tonase ?? "",
          harga: r.harga ?? "",
        }));

        setForm({
          no_invoice: d?.no_invoice || "",
          tanggal: toInputDate(d?.tanggal || ""),
          due_date: toInputDate(d?.due_date || ""),
          nama_pelanggan: d?.nama_pelanggan || "",
          email: d?.email || "",
          no_telp: d?.no_telp || "",
          status: d?.status || "Unpaid",
          diterima_oleh: d?.diterima_oleh || "Admin",
          rincian,
        });
      })
      .catch(() => {
        setErr("Gagal memuat data invoice");
        showPopup("danger", "Gagal memuat data invoice.", 0);
      });
  }, [id]);

  const onChange = (key) => (e) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }));

  const updateRincian = (index, key, value) => {
    const updated = [...(form.rincian || [])];
    updated[index] = { ...(updated[index] || {}), [key]: value };
    setForm((prev) => ({ ...prev, rincian: updated }));
  };

  const addRincian = () => {
    setForm((prev) => ({
      ...prev,
      rincian: [
        ...(prev.rincian || []),
        {
          lokasi_muat: "",
          lokasi_bongkar: "",
          armada_id: "",
          armada_start_date: "",
          armada_end_date: "",
          tonase: "",
          harga: "",
        },
      ],
    }));
  };

  const removeRincian = (index) => {
    setForm((prev) => ({
      ...prev,
      rincian: (prev.rincian || []).filter((_, i) => i !== index),
    }));
  };

  const calcRowSubtotal = (r) => {
    const t = parseFloat(r?.tonase) || 0;
    const h = parseFloat(r?.harga) || 0;
    return t * h;
  };

  const subtotal = useMemo(() => {
    return (form.rincian || []).reduce((sum, r) => sum + calcRowSubtotal(r), 0);
  }, [form.rincian]);

  const pph = useMemo(() => subtotal * 0.02, [subtotal]);
  const totalBayar = useMemo(() => subtotal - pph, [subtotal, pph]);

  const validate = () => {
    const required = ["no_invoice", "tanggal", "nama_pelanggan", "status"];
    const empty = required.filter((f) => !String(form[f] || "").trim());

    if (empty.length > 0) {
      showPopup(
        "danger",
        `Please fill the required fields: ${empty.join(", ")}`,
        0
      );
      return false;
    }

    if (!Array.isArray(form.rincian) || form.rincian.length === 0) {
      showPopup("danger", "At least one invoice detail is required.", 0);
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (!id) return showPopup("danger", "ID invoice tidak ditemukan.", 0);
    if (!validate()) return;

    setSaving(true);
    setErr("");

    try {
      const payload = {
        no_invoice: String(form.no_invoice || "").trim(),
        nama_pelanggan: form.nama_pelanggan,
        email: form.email,
        no_telp: form.no_telp,
        tanggal: form.tanggal,
        due_date: form.due_date,
        status: form.status,
        diterima_oleh: form.diterima_oleh,
        total_biaya: subtotal,
        pph,
        total_bayar: totalBayar,

        rincian: (form.rincian || []).map((r) => ({
          lokasi_muat: r.lokasi_muat || "",
          lokasi_bongkar: r.lokasi_bongkar || "",
          armada_id: r.armada_id || "",
          armada_start_date: r.armada_start_date || null,
          armada_end_date: r.armada_end_date || null,
          tonase: parseFloat(r.tonase) || 0,
          harga: parseFloat(r.harga) || 0,
        })),
      };

      await api.put(`/invoices/${id}`, payload);

      showPopup(
        "success",
        "Invoice updated successfully! Redirecting to Invoice List Page...",
        2500
      );
      setTimeout(() => router.push("/invoice-list"), 3000);
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Gagal mengupdate invoice";

      showPopup("danger", msg, 0);
    } finally {
      setSaving(false);
    }
  };

  const handlePdf = () => {
    if (!id) return showPopup("danger", "ID invoice tidak ditemukan.", 0);
    router.push(`/invoice-preview?id=${id}`);
  };

  const getPublicInvoiceViewerUrl = (invoiceId) => {
    return `${siteBase}/invoice/${invoiceId}`;
  };

  const handleEmail = async () => {
    if (!id) return showPopup("danger", "ID invoice tidak ditemukan.", 0);
    if (!String(form.email || "").trim()) {
      return showPopup("danger", "Email customer belum diisi.", 0);
    }

    try {
      const publicUrl = getPublicInvoiceViewerUrl(id);
      const subject = encodeURIComponent(`Invoice ${form.no_invoice || ""}`);
      const body = encodeURIComponent(
        `Yth. ${form.nama_pelanggan},\n\n` +
          `Silakan klik berikut untuk melihat invoice:\n${publicUrl}\n\n` +
          `Terima kasih,\nCV AS Nusa Trans (CV ANT)`
      );

      const to = encodeURIComponent(form.email || "");
      const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${subject}&body=${body}`;

      window.open(gmailUrl, "_blank");
    } catch (e) {
      showPopup(
        "danger",
        `Gagal membuat link invoice publik.\n\n${e?.message || "Unknown error"}`,
        0
      );
    }
  };

  return (
    <>
      <div className={`cvant-page-in ${pageIn ? "is-in" : ""}`}>
        <div className="container-fluid py-4">
          {!id ? (
            <div className="alert alert-warning">ID invoice tidak ditemukan</div>
          ) : (
            <div className="row g-4">
              <div className="col-lg-12">
                <div className="card shadow-sm border-0">
                  <div className="card-header bg-transparent d-flex justify-content-end gap-2">
                    <button
                      onClick={handleEmail}
                      className="btn btn-sm btn-outline-secondary"
                      type="button"
                    >
                      Send to Email
                    </button>

                    <button
                      onClick={handlePdf}
                      className="btn btn-sm btn-outline-warning"
                      type="button"
                    >
                      Preview
                    </button>

                    <button
                      disabled={saving}
                      onClick={handleSave}
                      className="btn btn-sm btn-primary"
                      type="button"
                    >
                      {saving ? "Saving..." : "Save"}
                    </button>
                  </div>

                  {/* ✅ BODY FORM (tidak aku ubah) */}
                  <div className="card-body">
                    <div className="row g-3">
                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Nomor Invoice
                        </label>
                        <input
                          className="form-control"
                          value={form.no_invoice || ""}
                          readOnly
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label fw-semibold">Tanggal</label>
                        <input
                          type="date"
                          className="form-control"
                          value={form.tanggal || ""}
                          onChange={onChange("tanggal")}
                        />
                      </div>

                      <div className="col-md-3">
                        <label className="form-label fw-semibold">
                          Jatuh Tempo
                        </label>
                        <input
                          type="date"
                          className="form-control"
                          value={form.due_date || ""}
                          onChange={onChange("due_date")}
                        />
                      </div>

                      <div className="col-12">
                        <hr className="my-2" />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Nama Customer
                        </label>
                        <input
                          className="form-control"
                          value={form.nama_pelanggan || ""}
                          onChange={onChange("nama_pelanggan")}
                          placeholder="Nama pelanggan"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Email Customer
                        </label>
                        <input
                          className="form-control"
                          value={form.email || ""}
                          onChange={onChange("email")}
                          placeholder="email@domain.com"
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">No. Telp</label>
                        <input
                          className="form-control"
                          value={form.no_telp || ""}
                          onChange={onChange("no_telp")}
                          placeholder="0812xxxx"
                        />
                      </div>

                      <div className="col-12">
                        <label className="form-label fw-semibold">
                          Rincian Muat / Bongkar & Armada
                        </label>

                        {(form.rincian || []).map((r, i) => {
                          const rowTotal = calcRowSubtotal(r);

                          return (
                            <div
                              key={i}
                              className={`row g-2 align-items-center mb-2 ${
                                i > 0 ? "mt-3" : ""
                              }`}
                              style={{ paddingBottom: "6px" }}
                            >
                              <div className="col-md-3">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Lokasi Muat"
                                  value={r.lokasi_muat}
                                  onChange={(e) =>
                                    updateRincian(
                                      i,
                                      "lokasi_muat",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>

                              <div className="col-md-3">
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Lokasi Bongkar"
                                  value={r.lokasi_bongkar}
                                  onChange={(e) =>
                                    updateRincian(
                                      i,
                                      "lokasi_bongkar",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>

                              <div className="col-md-4">
                                <select
                                  className="form-select"
                                  value={r.armada_id}
                                  onChange={(e) =>
                                    updateRincian(
                                      i,
                                      "armada_id",
                                      e.target.value
                                    )
                                  }
                                  style={{
                                    backgroundColor: controlBg,
                                    color: controlText,
                                    borderColor: controlBorder,
                                  }}
                                >
                                  <option
                                    value=""
                                    style={{
                                      backgroundColor: optionBg,
                                      color: optionText,
                                    }}
                                  >
                                    -- Pilih Armada --
                                  </option>

                                  {armadas.map((a) => (
                                    <option
                                      key={a.id}
                                      value={a.id}
                                      style={{
                                        backgroundColor: optionBg,
                                        color: optionText,
                                      }}
                                    >
                                      {a.nama_truk} – {a.plat_nomor} ({a.status})
                                    </option>
                                  ))}
                                </select>
                              </div>

                              <div className="col-md-2 text-end">
                                {(form.rincian || []).length > 1 && (
                                  <button
                                    className="btn btn-sm btn-outline-danger"
                                    onClick={() => removeRincian(i)}
                                    type="button"
                                  >
                                    Hapus
                                  </button>
                                )}
                              </div>

                              <div className="col-md-3">
                                <input
                                  type="date"
                                  className="form-control"
                                  value={r.armada_start_date}
                                  onChange={(e) =>
                                    updateRincian(
                                      i,
                                      "armada_start_date",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>

                              <div className="col-md-3">
                                <input
                                  type="date"
                                  className="form-control"
                                  value={r.armada_end_date}
                                  onChange={(e) =>
                                    updateRincian(
                                      i,
                                      "armada_end_date",
                                      e.target.value
                                    )
                                  }
                                />
                              </div>

                              <div className="col-md-2">
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Tonase"
                                  value={r.tonase}
                                  onChange={(e) =>
                                    updateRincian(i, "tonase", e.target.value)
                                  }
                                />
                              </div>

                              <div className="col-md-2">
                                <input
                                  type="number"
                                  className="form-control"
                                  placeholder="Harga / Ton"
                                  value={r.harga}
                                  onChange={(e) =>
                                    updateRincian(i, "harga", e.target.value)
                                  }
                                />
                              </div>

                              <div className="col-md-2">
                                <input
                                  type="text"
                                  className="form-control"
                                  value={`Rp ${rowTotal.toLocaleString(
                                    "id-ID"
                                  )}`}
                                  readOnly
                                />
                              </div>
                            </div>
                          );
                        })}

                        <button
                          className="btn btn-sm btn-outline-primary mt-4"
                          onClick={addRincian}
                          type="button"
                        >
                          + Tambah Rincian
                        </button>
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-semibold">
                          Subtotal
                        </label>
                        <input
                          type="text"
                          className="form-control"
                          value={`Rp ${subtotal.toLocaleString("id-ID")}`}
                          readOnly
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-semibold">PPH (2%)</label>
                        <input
                          type="text"
                          className="form-control"
                          value={`Rp ${pph.toLocaleString("id-ID")}`}
                          readOnly
                        />
                      </div>

                      <div className="col-md-4">
                        <label className="form-label fw-semibold">
                          Total Bayar
                        </label>
                        <input
                          type="text"
                          className="form-control fw-bold"
                          style={{
                            backgroundColor: "#f8f9fa",
                            color: "black",
                            WebkitTextFillColor: "black",
                          }}
                          value={`Rp ${totalBayar.toLocaleString("id-ID")}`}
                          readOnly
                        />
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">Status</label>
                        <select
                          className="form-select"
                          value={form.status || "Unpaid"}
                          onChange={onChange("status")}
                          style={{
                            backgroundColor: controlBg,
                            color: controlText,
                            borderColor: controlBorder,
                          }}
                        >
                          {["Unpaid", "Paid", "Waiting"].map((s) => (
                            <option
                              key={s}
                              value={s}
                              style={{
                                backgroundColor: optionBg,
                                color: optionText,
                              }}
                            >
                              {s}
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="col-md-6">
                        <label className="form-label fw-semibold">
                          Diterima Oleh
                        </label>
                        <select
                          className="form-select"
                          value={form.diterima_oleh || "Admin"}
                          onChange={onChange("diterima_oleh")}
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
                              style={{
                                backgroundColor: optionBg,
                                color: optionText,
                              }}
                            >
                              {role}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                  </div>
                  {/* END BODY */}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}

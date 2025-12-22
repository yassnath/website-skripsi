"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
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


export default function ArmadaEditLayer({ id }) {
  const pageIn = useCvAntPageIn();

  const router = useRouter();

  const [form, setForm] = useState({
    nama_truk: "",
    plat_nomor: "",
    kapasitas: "",
    status: "Ready",
  });

  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState("");

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

  useEffect(() => {
    let mounted = true;

    const loadData = async () => {
      try {
        if (!id) {
          setErr("");
          showPopup("danger", "ID armada tidak ditemukan.", 0);
          return;
        }

        const armada = await api.get(`/armadas/${id}`);
        const inv = await api.get("/invoices");

        if (mounted) {
          setForm(armada || {});
          setInvoices(Array.isArray(inv) ? inv : []);
        }
      } catch (e) {
        const msg = e?.message || "Gagal memuat data armada";
        setErr(msg);
        showPopup("danger", msg, 0);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    loadData();
    return () => (mounted = false);
  }, [id]);

  const computeStatus = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const relatedInvoices = invoices.filter(
      (inv) => inv.armada_id == id && inv.armada_start_date && inv.armada_end_date
    );

    for (const inv of relatedInvoices) {
      const start = new Date(inv.armada_start_date);
      const end = new Date(inv.armada_end_date);

      start.setHours(0, 0, 0, 0);
      end.setHours(0, 0, 0, 0);

      if (today >= start && today <= end) return "Full";
    }

    return "Ready";
  };

  const autoStatus = computeStatus();

  useEffect(() => {
    setForm((prev) => ({ ...prev, status: autoStatus }));
  }, [autoStatus, invoices]);

  const onChange = (k) => (e) =>
    setForm((s) => ({ ...s, [k]: e.target.value }));

  const validate = () => {
    if (!form.nama_truk || !form.plat_nomor || !form.kapasitas) {
      setErr("");
      showPopup("danger", "Semua kolom wajib diisi!", 0);
      return false;
    }
    return true;
  };

  const onSave = async () => {
    if (!validate()) return;

    setSaving(true);
    setErr("");

    try {
      const payload = { ...form, status: autoStatus };
      await api.put(`/armadas/${id}`, payload);

      showPopup(
        "success",
        "Fleet updated successfully! Navigating to Fleet List Page...",
        3000
      );
      setTimeout(() => {
        router.push("/armada-list");
      }, 3000);
    } catch (e) {
      const msg = e?.message || "Gagal memperbarui armada";
      setErr(msg);
      showPopup("danger", msg, 0);
    } finally {
      setSaving(false);
    }
  };

  if (loading)
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

        <div className="card">
          <div className="card-body text-center py-4">Loading…</div>
        </div>

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

  return (
    <>
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

      <div className="card">
        <div className="card-header d-flex justify-content-end">
          <button
            onClick={onSave}
            disabled={saving}
            className="btn btn-sm btn-primary"
          >
            {saving ? "Saving..." : "Save"}
          </button>
        </div>

        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Nama Truk</label>
              <input
                className="form-control"
                value={form.nama_truk || ""}
                onChange={onChange("nama_truk")}
                placeholder="mis. Hino 300"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">Plat Nomor</label>
              <input
                className="form-control"
                value={form.plat_nomor || ""}
                onChange={onChange("plat_nomor")}
                placeholder="mis. L 1234 XX"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">
                Kapasitas (Tonase)
              </label>
              <input
                className="form-control"
                value={form.kapasitas || ""}
                onChange={onChange("kapasitas")}
                placeholder="mis. 10"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">Status</label>

              <select
                className="form-select"
                value={form.status || autoStatus}
                onChange={() => {}}
              >
                <option value="Ready">Ready</option>
                <option value="Full">Full</option>
              </select>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
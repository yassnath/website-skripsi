"use client";

import { Icon } from "@iconify/react/dist/iconify.js";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
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

export default function ArmadaAddLayer() {
  const pageIn = useCvAntPageIn();

  const router = useRouter();

  const [form, setForm] = useState({
    nama_truk: "",
    plat_nomor: "",
    kapasitas: "",
    status: "Ready",
  });

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

  const onChange = (k) => (e) => {
    let v = e.target.value;
    if (k === "kapasitas") v = v === "" ? "" : Number(v);
    setForm((s) => ({ ...s, [k]: v }));
  };

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
      await api.post("/armadas", form);

      showPopup(
        "success",
        "Fleet successfully added! Redirecting to Fleet List Page...",
        3000
      );
      setTimeout(() => {
        router.push("/armada-list");
      }, 3000);
    } catch (e) {
      console.error("Error saving armada:", e);
      const msg = e?.message || "Gagal menyimpan armada.";
      setErr(msg);
      showPopup("danger", msg, 0);
    } finally {
      setSaving(false);
    }
  };

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
        <div className="card-header">
          <div className="d-flex flex-wrap align-items-center justify-content-end gap-2">
            <button
              type="button"
              disabled={saving}
              onClick={onSave}
              className="btn btn-sm btn-primary"
            >
              {saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="card-body">
          <div className="row g-3">
            <div className="col-md-4">
              <label className="form-label fw-semibold">Nama Truk</label>
              <input
                value={form.nama_truk}
                onChange={onChange("nama_truk")}
                className="form-control"
                placeholder="mis. Hino 300"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">Plat Nomor</label>
              <input
                value={form.plat_nomor}
                onChange={onChange("plat_nomor")}
                className="form-control"
                placeholder="mis. L 1234 XX"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">Kapasitas (Tonase)</label>
              <input
                type="number"
                value={form.kapasitas}
                onChange={onChange("kapasitas")}
                className="form-control"
                placeholder="mis. 10"
              />
            </div>

            <div className="col-md-4">
              <label className="form-label fw-semibold">Status</label>

              <select
                value={form.status}
                onChange={onChange("status")}
                className="form-select"
                style={{
                  backgroundColor: controlBg,
                  color: controlText,
                  borderColor: controlBorder,
                }}
              >
                <option
                  value="Ready"
                  style={{ backgroundColor: optionBg, color: optionText }}
                >
                  Ready
                </option>
                <option
                  value="Full"
                  style={{ backgroundColor: optionBg, color: optionText }}
                >
                  Full
                </option>
              </select>
            </div>
          </div>
        </div>
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
}
"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

const unwrapList = (res) => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

const safeStr = (v, fallback = "-") =>
  v == null || String(v).trim() === "" ? fallback : String(v);

const parseNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

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

const getCssVar = (name, fallback) => {
  if (typeof window === "undefined") return fallback;
  const v = window
    .getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim();
  return v || fallback;
};

const hexToRgb = (hex) => {
  const h = String(hex || "").replace("#", "").trim();
  if (h.length === 3) {
    const r = parseInt(h[0] + h[0], 16);
    const g = parseInt(h[1] + h[1], 16);
    const b = parseInt(h[2] + h[2], 16);
    if ([r, g, b].some((x) => Number.isNaN(x))) return null;
    return { r, g, b };
  }
  if (h.length !== 6) return null;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if ([r, g, b].some((x) => Number.isNaN(x))) return null;
  return { r, g, b };
};

const rgbDist = (a, b) => {
  if (!a || !b) return 9999;
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

const hslToHex = (h, s, l) => {
  s /= 100;
  l /= 100;
  const k = (n) => (n + h / 30) % 12;
  const a = s * Math.min(l, 1 - l);
  const f = (n) =>
    l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  const to255 = (x) => Math.round(255 * x);
  const r = to255(f(0));
  const g = to255(f(8));
  const b = to255(f(4));
  const toHex = (x) => x.toString(16).padStart(2, "0");
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
};

const getBasePalette = () => {
  const fallbacks = {
    primary: "#487FFF",
    success: "#22C55E",
    warning: "#F59E0B",
    danger: "#EF4444",
    info: "#06B6D4",
    purple: "#8B5CF6",
    pink: "#EC4899",
    neutral: "#6B7280",
  };

  const primary = getCssVar("--primary-600", fallbacks.primary);
  const success = getCssVar("--success-600", fallbacks.success);
  const warning = getCssVar("--warning-600", fallbacks.warning);
  const danger = getCssVar("--danger-600", fallbacks.danger);
  const info = getCssVar("--info-600", fallbacks.info);
  const purple = getCssVar("--purple-600", fallbacks.purple);
  const pink = getCssVar("--pink-600", fallbacks.pink);
  const neutral =
    getCssVar("--neutral-600", "") ||
    getCssVar("--gray-600", "") ||
    getCssVar("--secondary-600", "") ||
    fallbacks.neutral;

  return {
    seed: [primary, success, warning, danger, info, purple, pink],
    neutral,
  };
};

const buildDistinctColors = (count) => {
  const { seed, neutral } = getBasePalette();
  if (count <= 0) return [];

  const out = [];
  const usedRgb = [];

  const pushColor = (hex) => {
    out.push(hex);
    usedRgb.push(hexToRgb(hex));
  };

  const isTooSimilar = (hex) => {
    const rgb = hexToRgb(hex);
    if (!rgb) return false;
    return usedRgb.some((u) => rgbDist(u, rgb) < 55);
  };

  for (let i = 0; i < seed.length && out.length < count; i++) {
    const c = seed[i];
    if (!isTooSimilar(c)) pushColor(c);
  }

  let i = 0;
  while (out.length < count && i < 500) {
    const hue = Math.round((360 * i) / Math.max(count, 12));
    const hex = hslToHex(hue, 78, 52);

    if (!isTooSimilar(hex)) {
      pushColor(hex);
    } else {
      if (!isTooSimilar(neutral)) {
        pushColor(neutral);
      } else {
        const shifted = hslToHex((hue + 137) % 360, 78, 52);
        if (!isTooSimilar(shifted)) pushColor(shifted);
      }
    }
    i++;
  }

  while (out.length < count) {
    const c = seed[out.length % seed.length];
    pushColor(c);
  }

  return out.slice(0, count);
};

const ArmadaOverview = () => {
  const [pageIn, setPageIn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setPageIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const [invoices, setInvoices] = useState([]);
  const [armadas, setArmadas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isLightMode, setIsLightMode] = useState(false);

  const loadData = async () => {
    try {
      const [invRes, armRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/armadas"),
      ]);

      setInvoices(unwrapList(invRes));
      setArmadas(unwrapList(armRes));
      setError("");
    } catch (e) {
      setError(e.message || "Gagal memuat data armada overview");
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    loadData();
    const interval = setInterval(loadData, 5000);
    return () => clearInterval(interval);
  }, []);

  const { series, options, totalArmada, renderHeight } = useMemo(() => {
    const armadaById = new Map();
    armadas.forEach((a) => {
      if (a?.id != null) {
        armadaById.set(String(a.id), {
          id: String(a.id),
          nama: safeStr(a?.nama_truk, "Armada"),
          plat: safeStr(a?.plat_nomor, "-"),
        });
      }
    });

    const usageCount = new Map();

    invoices.forEach((inv) => {
      const rincian = Array.isArray(inv?.rincian) ? inv.rincian : [];

      if (rincian.length > 0) {
        rincian.forEach((r) => {
          const id =
            r?.armada_id ??
            r?.armada?.id ??
            inv?.armada_id ??
            inv?.armada?.id ??
            null;
          if (id == null) return;

          const key = String(id);
          usageCount.set(key, (usageCount.get(key) || 0) + 1);
        });
      } else {
        const id = inv?.armada_id ?? inv?.armada?.id ?? null;
        if (id == null) return;
        const key = String(id);
        usageCount.set(key, (usageCount.get(key) || 0) + 1);
      }
    });

    const armadaMetaList = Array.from(armadaById.values());
    const totalArmada = armadaMetaList.length;

    const series = armadaMetaList.map((m) => parseNumber(usageCount.get(m.id)));
    const totalUsage = series.reduce((acc, n) => acc + (Number(n) || 0), 0);

    const centerTextColor = isLightMode ? "#000000" : "#ffffff";
    const colors = buildDistinctColors(armadaMetaList.length);

    const renderHeight = 290;

    const options = {
      colors,
      labels: armadaMetaList.map((m) => m.nama),
      legend: { show: false },
      chart: {
        type: "donut",
        height: 296,
        sparkline: { enabled: true },
        toolbar: { show: false },
      },
      stroke: { width: 0 },
      dataLabels: { enabled: false },

      tooltip: {
        custom: function ({ series, seriesIndex, w }) {
          const meta = w?.config?.customData?.[seriesIndex];
          const nama = safeStr(
            meta?.nama,
            w?.globals?.labels?.[seriesIndex] || "Armada"
          );
          const plat = safeStr(meta?.plat, "-");
          const count = series?.[seriesIndex] ?? 0;

          return `
            <div class="p-2" style="line-height:1.15;">
              <div style="font-weight:600; margin-bottom:1px;">${nama}</div>
              <div style="opacity:.85; font-size:12px; margin-bottom:2px;">Plat: ${plat}</div>
              <div style="font-weight:600;">Dipakai: ${count}x</div>
            </div>
          `;
        },
      },

      plotOptions: {
        pie: {
          donut: {
            size: "70%",
            labels: {
              show: true,
              name: {
                show: true,
                color: centerTextColor,
                fontSize: "14px",
                fontWeight: 600,
                offsetY: -4,
              },
              value: {
                show: true,
                color: centerTextColor,
                fontSize: "20px",
                fontWeight: 700,
                offsetY: 6,
                formatter: (val) => `${parseNumber(val)}x`,
              },
              total: {
                show: true,
                label: "Total Fleet Usage",
                color: centerTextColor,
                fontSize: "14px",
                fontWeight: 500,
                formatter: () => `${totalUsage || 0}x`,
              },
            },
          },
        },
      },

      customData: armadaMetaList,
    };

    return { series, options, totalArmada, renderHeight };
  }, [invoices, armadas, isLightMode]);

  return (
    <>
      <div className={`col-xxl-5 col-xl-12 page-in ${pageIn ? "is-in" : ""}`}>
        <div className="card h-100 radius-8 border-0 overflow-hidden">
          <div className="card-body p-24">
            <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between mb-3">
              <h6 className="fw-bold text-lg mb-0">Armada Overview</h6>

              <Link
                href="/armada-list"
                className="text-primary-600 hover-text-primary d-flex align-items-center gap-1"
              >
                View All
                <Icon icon="solar:alt-arrow-right-linear" className="icon" />
              </Link>
            </div>

            {error && <p className="text-danger text-sm mt-2 mb-0">{error}</p>}

            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <span className="text-secondary-light text-sm">
                  Loading fleet usage...
                </span>
              </div>
            ) : armadas.length === 0 ? (
              <div className="d-flex justify-content-center align-items-center py-5">
                <span className="text-secondary-light text-sm">
                  fleet data is empty.
                </span>
              </div>
            ) : (
              <>
                <div id="armadaOverview" className="apexcharts-tooltip-style-1">
                  <div className="cvant-donut-center-fix">
                    <ReactApexChart
                      key={isLightMode ? "light" : "dark"}
                      options={options}
                      series={series}
                      type="donut"
                      height={renderHeight}
                    />
                  </div>
                </div>

                <ul className="d-flex flex-wrap align-items-center justify-content-center mt-3 gap-2">
                  <li className="d-flex align-items-center gap-2">
                    <span className="text-secondary-light text-sm fw-normal">
                      Total Fleet: {totalArmada}
                    </span>
                  </li>
                </ul>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ✅ SATU style saja (global) agar tidak kena nested styled-jsx */}
      <style jsx global>{`
        }

        /* fix donut center labels */
        .cvant-donut-center-fix .apexcharts-datalabels,
        .cvant-donut-center-fix .apexcharts-datalabel,
        .cvant-donut-center-fix .apexcharts-datalabel-label,
        .cvant-donut-center-fix .apexcharts-datalabel-value {
          display: block !important;
          opacity: 1 !important;
          visibility: visible !important;
        }

        html[data-bs-theme="light"]
          .cvant-donut-center-fix
          .apexcharts-datalabel-label,
        html[data-bs-theme="light"]
          .cvant-donut-center-fix
          .apexcharts-datalabel-value,
        html[data-theme="light"]
          .cvant-donut-center-fix
          .apexcharts-datalabel-label,
        html[data-theme="light"]
          .cvant-donut-center-fix
          .apexcharts-datalabel-value {
          fill: #636872 !important;
          color: #636872 !important;
        }

        html[data-bs-theme="dark"]
          .cvant-donut-center-fix
          .apexcharts-datalabel-label,
        html[data-bs-theme="dark"]
          .cvant-donut-center-fix
          .apexcharts-datalabel-value,
        html[data-theme="dark"]
          .cvant-donut-center-fix
          .apexcharts-datalabel-label,
        html[data-theme="dark"]
          .cvant-donut-center-fix
          .apexcharts-datalabel-value {
          fill: #ffffff !important;
          color: #ffffff !important;
        }
      `}</style>
    </>
  );
};

export default ArmadaOverview;

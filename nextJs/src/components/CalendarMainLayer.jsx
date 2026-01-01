"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import listPlugin from "@fullcalendar/list"; // ✅ TAMBAH
import { api } from "@/lib/api";

export default function CalendarMainLayer() {
  // ✅ efek masuk (tanpa ubah style existing)
  const [pageIn, setPageIn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setPageIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);

  const calendarRef = useRef(null);
  const [calendarHeight, setCalendarHeight] = useState(null);

  const [currentRange, setCurrentRange] = useState({ start: "", end: "" });

  const [isLightMode, setIsLightMode] = useState(false);

  const tooltipRef = useRef(null);

  // ✅ MOBILE DETECTOR
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 991);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const getCssVar = (name, fallback) => {
    if (typeof window === "undefined") return fallback;
    const v = window
      .getComputedStyle(document.documentElement)
      .getPropertyValue(name)
      .trim();
    return v || fallback;
  };

  const isLightModeNow = () => {
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
    const updateHeight = () => {
      if (calendarRef.current) {
        setCalendarHeight(calendarRef.current.offsetHeight);
      }
    };
    updateHeight();
    window.addEventListener("resize", updateHeight);
    return () => window.removeEventListener("resize", updateHeight);
  }, [invoices, expenses]);

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

    if (/^\d{4}-\d{2}-\d{2}\s/.test(str)) {
      return str.split(" ")[0];
    }

    return "";
  };

  const toDisplayDDMMYYYY = (value) => {
    const norm = normalizeDate(value);
    if (!norm) return "-";
    const [y, m, d] = norm.split("-");
    return `${d}-${m}-${y}`;
  };

  useEffect(() => {
    const load = async () => {
      try {
        const [inv, exp] = await Promise.all([
          api.get("/invoices"),
          api.get("/expenses"),
        ]);

        setInvoices(Array.isArray(inv) ? inv : []);
        setExpenses(Array.isArray(exp) ? exp : []);
      } catch {
        setInvoices([]);
        setExpenses([]);
      }
    };

    load();
    const t = setInterval(load, 5000);
    return () => clearInterval(t);
  }, []);

  const armadaColors = ["#0d6efd", "#6610f2", "#20c997", "#fd7e14", "#6f42c1"];
  const getArmadaColor = (id) => armadaColors[id % armadaColors.length];

  const calendarEvents = useMemo(() => {
    const today = normalizeDate(new Date().toISOString());

    const incomeEvents =
      invoices?.map((inv) => ({
        id: `inv-${inv.id}`,
        type: "income",
        title: inv.no_invoice,
        date: normalizeDate(inv.tanggal),
        total: inv.total_bayar,
        textColor: "#0d6efd",
      })) || [];

    const expenseEvents =
      expenses?.map((exp) => ({
        id: `exp-${exp.id}`,
        type: "expense",
        title: exp.no_expense,
        date: normalizeDate(exp.tanggal),
        total: exp.total_pengeluaran,
        textColor: "#dc3545",
      })) || [];

    const armadaEvents =
      invoices
        ?.filter(
          (inv) =>
            inv.armada &&
            inv.armada_start_date &&
            inv.armada_end_date &&
            inv.armada_id
        )
        .map((inv) => {
          const startISO = normalizeDate(inv.armada_start_date);
          const endISO = normalizeDate(inv.armada_end_date);

          const [y, m, d] = endISO.split("-");
          const endExclusive = `${y}-${m}-${String(Number(d) + 1).padStart(
            2,
            "0"
          )}`;

          let bg = getArmadaColor(inv.armada_id);
          let border = bg;

          const success600 = getCssVar("--success-600", "#16a34a");
          const warning600 = getCssVar("--warning-600", "#f59e0b");
          let text = warning600;

          if (today >= startISO && today <= endISO) {
            bg = "#198754";
            border = "#198754";
            text = warning600;
          } else if (today > endISO) {
            bg = "white";
            border = "#cccccc";
            text = success600;
          }

          return {
            id: `arm-${inv.id}`,
            type: "armada",
            title: `${inv.armada.nama_truk} – ${inv.armada.plat_nomor}`,
            start: startISO,
            end: endExclusive,
            backgroundColor: bg,
            textColor: text,
            borderColor: border,
            startOriginal: startISO,
            endOriginal: endISO,
          };
        }) || [];

    return [...incomeEvents, ...expenseEvents, ...armadaEvents];
  }, [invoices, expenses]);

  const getIncomeDot = (s) =>
    s === "Paid"
      ? "bg-success-600"
      : s === "Waiting"
      ? "bg-info-600"
      : "bg-warning-600";

  const getExpenseDot = (s) =>
    s === "Paid"
      ? "bg-success-600"
      : s === "Approved"
      ? "bg-primary-600"
      : "bg-warning-600";

  const leftTransactions = useMemo(() => {
    const startISO = currentRange.start ? normalizeDate(currentRange.start) : "";
    const endISO = currentRange.end ? normalizeDate(currentRange.end) : "";

    const all = [...invoices, ...expenses]
      .map((item) => {
        const iso = normalizeDate(item.tanggal);
        const [y, m, d] = (iso || "").split("-");
        return {
          ...item,
          tanggal_iso: iso,
          tanggal_dd: iso ? `${d}-${m}-${y}` : "-",
          sort_time: iso ? Number(`${y}${m}${d}`) : 0,
          isIncome: item.no_invoice !== undefined,
        };
      })
      .filter((item) => {
        if (!startISO || !endISO) return true;
        return item.tanggal_iso >= startISO && item.tanggal_iso < endISO;
      })
      .sort((a, b) => b.sort_time - a.sort_time);

    return all;
  }, [invoices, expenses, currentRange]);

  const ensureTooltipEl = () => {
    if (typeof document === "undefined") return null;

    if (!tooltipRef.current) {
      const el = document.createElement("div");
      el.className =
        "apexcharts-tooltip apexcharts-active apexcharts-tooltip-style-1 cvant-fc-native-tooltip";
      el.style.position = "fixed";
      el.style.zIndex = "9999";
      el.style.pointerEvents = "none";
      el.style.display = "none";
      el.style.transform = "translate(10px, 10px)";
      tooltipRef.current = el;
      document.body.appendChild(el);
    }
    return tooltipRef.current;
  };

  const hideTooltip = () => {
    const el = tooltipRef.current;
    if (!el) return;
    el.style.display = "none";
  };

  const showTooltip = (html, x, y) => {
    const el = ensureTooltipEl();
    if (!el) return;
    el.innerHTML = html;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    el.style.display = "block";
  };

  const buildTooltipHtmlFromLines = (title, lines = []) => {
    const body = lines
      .filter(Boolean)
      .map(
        (t) =>
          `<div style="opacity:.85;font-size:12px;margin-bottom:3px;line-height:1.2;">${t}</div>`
      )
      .join("");

    return `
      <div class="cvant-tooltip-pad" style="line-height:1.2;">
        <div style="font-weight:600;margin-bottom:3px;">${title}</div>
        ${body}
      </div>
    `;
  };

  useEffect(() => {
    return () => {
      if (tooltipRef.current) {
        tooltipRef.current.remove();
        tooltipRef.current = null;
      }
    };
  }, []);

  const btnTextColor = isLightMode ? "#111827" : "#ffffff";

  return (
    <>
      {/* ✅ efek-in ditempel ke wrapper root */}
      <div className={`row gy-4 page-in ${pageIn ? "is-in" : ""}`}>
        <div className="col-xxl-3 col-lg-4">
          <div className="card h-100 p-0">
            <div
              className="card-body p-24"
              style={{
                maxHeight: calendarHeight ? `${calendarHeight}px` : "650px",
                overflowY: "auto",
                transition: "max-height .2s ease",
              }}
            >
              <h6 className="fw-semibold text-sm text-primary-light mb-12">
                All Transactions
              </h6>

              {leftTransactions.map((item) => {
                const isIncome = item.isIncome;

                return (
                  <div
                    key={`${isIncome ? "inv" : "exp"}-${item.id}`}
                    className="event-item d-flex align-items-center justify-content-between gap-4 pb-16 mb-16 border border-start-0 border-end-0 border-top-0"
                  >
                    <div>
                      <div className="d-flex align-items-center gap-10">
                        <span
                          className={`w-12-px h-12-px ${
                            isIncome
                              ? getIncomeDot(item.status)
                              : getExpenseDot(item.status)
                          } rounded-circle`}
                        />
                        <span className="text-secondary-light text-xs">
                          {item.tanggal_dd}
                        </span>
                      </div>

                      <span
                        className="fw-semibold d-block mt-2"
                        style={{ color: isIncome ? "#0d6efd" : "#dc3545" }}
                      >
                        {isIncome ? item.no_invoice : item.no_expense}
                      </span>

                      <span className="text-secondary-light text-xs d-block mt-2">
                        Total: Rp{" "}
                        {Number(
                          isIncome ? item.total_bayar : item.total_pengeluaran
                        ).toLocaleString("id-ID")}
                      </span>

                      <span className="text-secondary-light text-xs d-block mt-1">
                        Dicatat oleh:{" "}
                        {isIncome ? item.diterima_oleh : item.dicatat_oleh}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        (window.location.href = isIncome
                          ? `/invoice-preview?id=${item.id}`
                          : `/expense-preview?id=${item.id}`)
                      }
                      className="btn p-0 border-0 bg-transparent cvant-eye-btn"
                      aria-label="View"
                      type="button"
                    >
                      <Icon
                        icon="mdi:eye-outline"
                        className="text-neutral-600 text-xl cvant-eye-icon"
                      />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="col-xxl-9 col-lg-8">
          <div className="card h-100 p-0">
            <div
              className="card-body p-24"
              ref={calendarRef}
              style={{
                height: "100%",
                overflow: "visible",
              }}
            >
              <div
                className="apexcharts-tooltip-style-1"
                style={{
                  height: "100%",
                }}
              >
                <FullCalendar
                  plugins={[dayGridPlugin, listPlugin]} // ✅ TAMBAH listPlugin
                  initialView={isMobile ? "listMonth" : "dayGridMonth"} // ✅ MOBILE = LIST FULL TANGGAL
                  headerToolbar={{
                    left: "prev",
                    center: "title",
                    right: "next",
                  }}
                  events={calendarEvents}
                  displayEventTime={false}
                  eventDisplay="block"
                  height="auto"
                  contentHeight="auto"
                  expandRows={true}
                  datesSet={(arg) => {
                    setCurrentRange({
                      start: arg.startStr,
                      end: arg.endStr,
                    });
                  }}
                  eventDidMount={(info) => {
                    info.el.removeAttribute("title");

                    const type = info.event.extendedProps.type;

                    const makeLines = () => {
                      if (type === "income") {
                        return [
                          `Total: Rp ${Number(
                            info.event.extendedProps.total
                          ).toLocaleString("id-ID")}`,
                        ];
                      }
                      if (type === "expense") {
                        return [
                          `Total: Rp ${Number(
                            info.event.extendedProps.total
                          ).toLocaleString("id-ID")}`,
                        ];
                      }
                      if (type === "armada") {
                        return [
                          `${toDisplayDDMMYYYY(
                            info.event.extendedProps.startOriginal
                          )} → ${toDisplayDDMMYYYY(
                            info.event.extendedProps.endOriginal
                          )}`,
                        ];
                      }
                      return [];
                    };

                    const onMove = (e) => {
                      showTooltip(
                        buildTooltipHtmlFromLines(
                          info.event.title,
                          makeLines()
                        ),
                        e.clientX,
                        e.clientY
                      );
                    };

                    const onEnter = (e) => onMove(e);
                    const onLeave = () => hideTooltip();

                    info.el.addEventListener("mousemove", onMove);
                    info.el.addEventListener("mouseenter", onEnter);
                    info.el.addEventListener("mouseleave", onLeave);

                    return () => {
                      info.el.removeEventListener("mousemove", onMove);
                      info.el.removeEventListener("mouseenter", onEnter);
                      info.el.removeEventListener("mouseleave", onLeave);
                    };
                  }}
                  eventContent={(arg) => {
                    const type = arg.event.extendedProps.type;

                    // ✅ LIST VIEW (mobile) biarkan default, supaya "full tanggal" rapi
                    if (isMobile) return undefined;

                    if (type === "armada") {
                      return {
                        html: `
                          <div style="
                            width:100%;height:100%;
                            display:flex;justify-content:center;align-items:center;
                            font-size:0.78rem;font-weight:600;text-align:center;
                            color:${arg.event.textColor};
                          ">
                            ${arg.event.title}
                          </div>
                        `,
                      };
                    }

                    let color = "inherit";
                    if (type === "income") color = "#0d6efd";
                    if (type === "expense") color = "#dc3545";

                    return {
                      html: `
                        <div style="font-weight:600;font-size:0.83rem;color:${color}">
                          ${arg.event.title}
                        </div>
                      `,
                    };
                  }}
                />
              </div>

              <div style={{ clear: "both" }} />
            </div>
          </div>
        </div>
      </div>

      {/* ✅ CSS existing JANGAN DIUBAH */}
      <style jsx global>{`
        .cvant-eye-btn:hover .cvant-eye-icon {
          color: var(--primary-600, #487fff) !important;
        }

        .cvant-fc-native-tooltip {
          white-space: nowrap;
          max-width: 320px;

          border: 1px solid
            var(--neutral-300, rgba(255, 255, 255, 0.18)) !important;
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.18) !important;
          border-radius: 10px !important;
          overflow: hidden;
        }

        .cvant-fc-native-tooltip .cvant-tooltip-pad {
          padding: 12px 14px !important;
        }

        html[data-bs-theme="light"] .cvant-fc-native-tooltip,
        html[data-theme="light"] .cvant-fc-native-tooltip {
          background: #ffffff !important;
          color: #111827 !important;
          border-color: rgba(15, 23, 42, 0.14) !important;
        }

        html[data-bs-theme="dark"] .cvant-fc-native-tooltip,
        html[data-theme="dark"] .cvant-fc-native-tooltip {
          background: #0b1220 !important;
          color: #ffffff !important;
          border-color: rgba(255, 255, 255, 0.14) !important;
        }

        .fc .fc-button {
          background: transparent !important;
          background-color: transparent !important;
          box-shadow: none !important;
          border: 1px solid
            var(--neutral-300, rgba(255, 255, 255, 0.18)) !important;
          color: ${btnTextColor} !important;
        }

        .fc .fc-button:hover {
          background: var(--primary-600, #487fff) !important;
          border-color: var(--primary-600, #487fff) !important;
          color: #ffffff !important;
        }

        .fc .fc-button:focus,
        .fc .fc-button:active {
          background: transparent !important;
          box-shadow: none !important;
          outline: none !important;
        }

        .fc .fc-toolbar-title {
          color: ${btnTextColor} !important;
        }

        .fc .fc-scroller {
          overflow: visible !important;
          height: auto !important;
        }
        .fc .fc-view-harness {
          height: auto !important;
        }
        .fc .fc-daygrid-body {
          height: auto !important;
        }
        .fc .fc-scrollgrid-section-body > td {
          height: auto !important;
        }

        html[data-bs-theme="light"] .fc .fc-col-header-cell,
        html[data-theme="light"] .fc .fc-col-header-cell {
          background: #ffffff !important;
        }
        html[data-bs-theme="light"] .fc .fc-col-header-cell a,
        html[data-theme="light"] .fc .fc-col-header-cell a {
          color: #111827 !important;
        }

        html[data-bs-theme="dark"] .fc .fc-col-header-cell,
        html[data-theme="dark"] .fc .fc-col-header-cell {
          background: #000000 !important;
        }
        html[data-bs-theme="dark"] .fc .fc-col-header-cell a,
        html[data-theme="dark"] .fc .fc-col-header-cell a {
          color: #ffffff !important;
        }

        html[data-bs-theme="light"]
          .fc
          .fc-col-header-cell
          .fc-scrollgrid-sync-inner,
        html[data-theme="light"]
          .fc
          .fc-col-header-cell
          .fc-scrollgrid-sync-inner {
          background: #ffffff !important;
        }
        html[data-bs-theme="dark"]
          .fc
          .fc-col-header-cell
          .fc-scrollgrid-sync-inner,
        html[data-theme="dark"]
          .fc
          .fc-col-header-cell
          .fc-scrollgrid-sync-inner {
          background: #273142 !important;
        }

        /* ✅ tambahan kecil untuk list view mobile tapi tetap ikut style existing */
        .fc .fc-list-day-cushion {
          background: transparent !important;
        }
      `}</style>
    </>
  );
}

"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Icon } from "@iconify/react/dist/iconify.js";
import { api } from "@/lib/api";

// -----------------------------
// Helpers
// -----------------------------
const safeStr = (v, fallback = "-") =>
  v == null || String(v).trim() === "" ? fallback : String(v);

const unwrapList = (res) => {
  if (Array.isArray(res)) return res;
  if (res && Array.isArray(res.data)) return res.data;
  if (res && res.data && Array.isArray(res.data.data)) return res.data.data;
  return [];
};

// ✅ FIX: rincian bisa string JSON di hosting
const ensureArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;

  // kalau dari backend berupa string json
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  return [];
};

const parseDate = (val) => {
  if (!val) return null;
  if (val instanceof Date) return isNaN(val.getTime()) ? null : val;

  const s = String(val).trim();

  if (s.includes("T")) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    const dateOnly = s.split(" ")[0];
    const d = new Date(`${dateOnly}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("-");
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
    return isNaN(d.getTime()) ? null : d;
  }

  const d = new Date(s);
  return isNaN(d.getTime()) ? null : d;
};

const formatDateDMY = (val) => {
  const d = parseDate(val);
  if (!d) return "-";
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yyyy = d.getFullYear();
  return `${dd}-${mm}-${yyyy}`;
};

const toYMD = (val) => {
  const d = parseDate(val);
  if (!d) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const todayYMD = () => {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
};

const pickFirstDate = (obj, keys) => {
  for (const k of keys) {
    const d = parseDate(obj?.[k]);
    if (d) return obj?.[k];
  }
  return null;
};

// -----------------------------
// Component
// -----------------------------
const RecentActivity = () => {
  // ✅ efek masuk
  const [pageIn, setPageIn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setPageIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const [invoices, setInvoices] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [armadas, setArmadas] = useState([]);

  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState("");

  const fetchAll = async () => {
    try {
      const [invRes, expRes, armRes] = await Promise.all([
        api.get("/invoices"),
        api.get("/expenses"),
        api.get("/armadas"),
      ]);

      setInvoices(unwrapList(invRes));
      setExpenses(unwrapList(expRes));
      setArmadas(unwrapList(armRes));
      setErr("");
    } catch (e) {
      setErr(e.message || "Gagal memuat recent activity");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let mounted = true;

    const run = async () => {
      if (!mounted) return;
      await fetchAll();
    };

    run();
    const t = setInterval(run, 5000);

    return () => {
      mounted = false;
      clearInterval(t);
    };
  }, []);

  const getActorFromInvoice = (inv) =>
    safeStr(inv?.diterima_oleh || inv?.created_by || inv?.user?.role, "Admin");
  const getActorFromExpense = (exp) =>
    safeStr(exp?.diterima_oleh || exp?.created_by || exp?.user?.role, "Admin");
  const getActorFromArmada = (arm) =>
    safeStr(arm?.created_by || arm?.dibuat_oleh || arm?.user?.role, "Admin");

  const armadaById = useMemo(() => {
    const m = new Map();
    armadas.forEach((a) => {
      if (a?.id != null) m.set(String(a.id), a);
    });
    return m;
  }, [armadas]);

  const getTime = (obj, ...keys) => {
    for (const k of keys) {
      const d = parseDate(obj?.[k]);
      if (d) return d.getTime();
    }
    return 0;
  };

  const activity = useMemo(() => {
    const items = [];
    const today = todayYMD();

    const START_KEYS = [
      "armada_start_date",
      "tanggal_berangkat",
      "tgl_berangkat",
      "berangkat_tanggal",
      "start_date",
      "tanggal_mulai",
      "start",
    ];
    const END_KEYS = [
      "armada_end_date",
      "tanggal_sampai",
      "tgl_sampai",
      "tiba_tanggal",
      "end_date",
      "tanggal_selesai",
      "end",
    ];

    // ✅ INVOICE
    invoices.forEach((inv) => {
      const id = inv?.id;

      // ✅ FIX: gunakan tanggal input invoice (bukan created_at)
      const invoiceDate = inv?.tanggal || inv?.created_at;

      const time = getTime(inv, "tanggal", "created_at", "updated_at");
      const dateLabel = formatDateDMY(invoiceDate);

      items.push({
        key: `inc-create-${id ?? Math.random()}`,
        time,
        title: "Pembuatan Income Invoice",
        line1: safeStr(inv?.no_invoice, "-"),
        href: id != null ? `/invoice-preview?id=${id}` : null,
        actor: getActorFromInvoice(inv),
        dateLabel,
        line1Kind: "income-no",
      });

      // ✅ FIX: rincian di hosting bisa string → decode
      const rincian = ensureArray(inv?.rincian);

      const makeArmadaLine = (r) => {
        const rid = r?.armada_id ?? r?.armada?.id ?? inv?.armada_id;
        const arm = rid != null ? armadaById.get(String(rid)) : null;

        const nama =
          safeStr(arm?.nama_truk, safeStr(r?.armada?.nama_truk, "Armada"));
        const plat =
          safeStr(arm?.plat_nomor, safeStr(r?.armada?.plat_nomor, "-"));

        return `${nama} (${plat})`;
      };

      const resolveStart = (r) =>
        pickFirstDate(r, START_KEYS) ?? pickFirstDate(inv, START_KEYS);
      const resolveEnd = (r) =>
        pickFirstDate(r, END_KEYS) ?? pickFirstDate(inv, END_KEYS);

      const invoiceHref = id != null ? `/invoice-preview?id=${id}` : null;

      const pushDepartArrive = (armLine, startVal, endVal, uniqKey) => {
        const startYmd = toYMD(startVal);
        const endYmd = toYMD(endVal);

        if (startYmd) {
          const startTime = parseDate(startVal)?.getTime() || time;
          items.push({
            key: `arm-dep-${uniqKey}`,
            time: startYmd === today ? Date.now() : startTime,
            title: "Armada Berangkat",
            line1: armLine,
            href: invoiceHref,
            actor: null,
            dateLabel: formatDateDMY(startVal),
            line1Kind: "armada-depart",
          });
        }

        if (endYmd) {
          const endTime = parseDate(endVal)?.getTime() || time;
          items.push({
            key: `arm-arr-${uniqKey}`,
            time: endYmd === today ? Date.now() - 1 : endTime,
            title: "Armada Tiba",
            line1: armLine,
            href: invoiceHref,
            actor: null,
            dateLabel: formatDateDMY(endVal),
            line1Kind: "armada-arrive",
          });
        }
      };

      // ✅ FIX: jika rincian ada, maka depart/arrive harus muncul
      if (rincian.length > 0) {
        rincian.forEach((r, idx) => {
          const armLine = makeArmadaLine(r);

          pushDepartArrive(
            armLine,
            resolveStart(r),
            resolveEnd(r),
            `${id ?? "x"}-${idx}`
          );
        });
      } else {
        // fallback invoice lama
        const rid = inv?.armada_id ?? inv?.armada?.id;
        const arm = rid != null ? armadaById.get(String(rid)) : null;

        const nama = safeStr(
          arm?.nama_truk,
          safeStr(inv?.armada?.nama_truk, "Armada")
        );
        const plat = safeStr(
          arm?.plat_nomor,
          safeStr(inv?.armada?.plat_nomor, "-")
        );
        const armLine = `${nama} (${plat})`;

        pushDepartArrive(
          armLine,
          pickFirstDate(inv, START_KEYS),
          pickFirstDate(inv, END_KEYS),
          `${id ?? "old"}`
        );
      }
    });

    // ✅ EXPENSE
    expenses.forEach((exp) => {
      const id = exp?.id;
      const time = getTime(exp, "tanggal", "created_at", "updated_at");

      // ✅ FIX: gunakan tanggal input expense
      const dateLabel = formatDateDMY(exp?.tanggal || exp?.created_at);

      items.push({
        key: `exp-create-${id ?? Math.random()}`,
        time,
        title: "Pembuatan Expense",
        line1: safeStr(exp?.no_expense || exp?.no_invoice || exp?.kode, "-"),
        href: id != null ? `/expense-preview?id=${id}` : null,
        actor: getActorFromExpense(exp),
        dateLabel,
        line1Kind: "expense-no",
      });
    });

    // ✅ ARMADA
    armadas.forEach((arm) => {
      const id = arm?.id;
      const time = getTime(arm, "created_at", "updated_at");
      const dateLabel = formatDateDMY(arm?.created_at || arm?.updated_at);

      items.push({
        key: `arm-create-${id ?? Math.random()}`,
        time,
        title: "Penambahan armada",
        line1: `${safeStr(arm?.nama_truk, "Armada")} (${safeStr(
          arm?.plat_nomor,
          "-"
        )})`,
        href: `/armada-list`,
        actor: getActorFromArmada(arm),
        dateLabel,
        line1Kind: "armada-create",
      });
    });

    items.sort((a, b) => (b.time || 0) - (a.time || 0));
    return items.slice(0, 10);
  }, [invoices, expenses, armadas, armadaById]);

  const renderLine1 = (a) => {
    if (a.line1Kind === "expense-no") {
      return a.href ? (
        <Link href={a.href} className="text-danger">
          {a.line1}
        </Link>
      ) : (
        <span className="text-danger">{a.line1}</span>
      );
    }

    if (a.line1Kind === "armada-create") {
      return a.href ? (
        <Link href={a.href} className="text-success-600">
          {a.line1}
        </Link>
      ) : (
        <span className="text-success">{a.line1}</span>
      );
    }

    if (a.line1Kind === "armada-depart") {
      return a.href ? (
        <Link href={a.href} className="text-warning-600">
          {a.line1}
        </Link>
      ) : (
        <span className="text-warning-600">{a.line1}</span>
      );
    }

    if (a.line1Kind === "armada-arrive") {
      return a.href ? (
        <Link href={a.href} className="text-success-600">
          {a.line1}
        </Link>
      ) : (
        <span className="text-success-600">{a.line1}</span>
      );
    }

    return a.href ? (
      <Link href={a.href} className="text-primary-600">
        {a.line1}
      </Link>
    ) : (
      <span>{a.line1}</span>
    );
  };

  const dividerColor = "var(--border-color, rgba(0,0,0,0.12))";

  return (
    <>
      <div
        className={`col-xxl-4 col-xl-12 page-in ${pageIn ? "is-in" : ""}`}
      >
        <div className="card h-100">
          <div className="card-body p-24">
            <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between mb-16">
              <h6 className="mb-2 fw-bold text-lg mb-0">Recent Activity</h6>

              <Link
                href="/calendar"
                className="text-primary-600 hover-text-primary d-flex align-items-center gap-1"
              >
                View All
                <Icon icon="solar:alt-arrow-right-linear" className="icon" />
              </Link>
            </div>

            {err && <p className="text-danger text-sm mt-2 mb-0">{err}</p>}

            {loading ? (
              <div className="d-flex justify-content-center align-items-center py-4 mt-12">
                <span className="text-secondary-light text-sm">
                  Loading activity...
                </span>
              </div>
            ) : activity.length === 0 ? (
              <div className="d-flex justify-content-center align-items-center py-4 mt-12">
                <span className="text-secondary-light text-sm">
                  Tidak ada aktivitas.
                </span>
              </div>
            ) : (
              <div
                className="table-responsive scroll-sm mt-12 pt-2"
                style={{
                  maxHeight: "388px",
                  paddingRight: "14px",
                }}
              >
                <ul className="list-unstyled mb-0 d-flex flex-column">
                  {activity.map((a, idx) => {
                    const isLast = idx === activity.length - 1;
                    return (
                      <li
                        key={a.key}
                        style={{
                          borderBottom: isLast
                            ? "none"
                            : `1px solid ${dividerColor}`,
                          paddingBottom: isLast ? 0 : "6.9px",
                          marginBottom: isLast ? 0 : "6.9px",
                        }}
                      >
                        <div className="d-flex align-items-start justify-content-between gap-12">
                          <span className="fw-medium text-md">{a.title}</span>
                          <div className="text-end">
                            <span className="text-secondary-light text-sm">
                              {a.dateLabel}
                            </span>
                          </div>
                        </div>

                        <div className="fw-medium text-md">{renderLine1(a)}</div>

                        {a.actor ? (
                          <div className="text-secondary-light text-sm">
                            oleh:{" "}
                            <span className="text-primary-light">{a.actor}</span>
                          </div>
                        ) : null}
                      </li>
                    );
                  })}
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
};

export default RecentActivity;

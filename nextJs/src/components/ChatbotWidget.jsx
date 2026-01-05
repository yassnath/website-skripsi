"use client";

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { api } from "@/lib/api";

const defaultGreeting = {
  role: "assistant",
  content:
    "Halo! Saya adalah Asisten CV ANT. Saya akan membantu anda.",
};

const ARMADA_USAGE_CACHE_MS = 30000;
const INVOICE_EXPENSE_CACHE_MS = 30000;

const normalizeKey = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");

const tokenize = (value) =>
  String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 1);

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

const formatRupiah = (num) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(num || 0);

const formatDatesInText = (value) => {
  if (value == null) return "";
  return String(value).replace(
    /\b(\d{4})-(\d{2})-(\d{2})\b/g,
    "$3-$2-$1"
  );
};

const extractYears = (value) => {
  const text = String(value || "");
  const lower = text.toLowerCase();
  const matches = text.match(/\b(19|20)\d{2}\b/g) || [];
  const years = [];
  const pushYear = (year) => {
    const y = String(year);
    if (!years.includes(y)) years.push(y);
  };

  matches.forEach(pushYear);

  const currentYear = new Date().getFullYear();
  if (lower.includes("tahun lalu") || lower.includes("tahun sebelumnya")) {
    pushYear(currentYear - 1);
  }
  if (lower.includes("tahun ini") || lower.includes("tahun sekarang")) {
    pushYear(currentYear);
  }

  return years;
};

const sortByTanggalDesc = (list) =>
  [...(Array.isArray(list) ? list : [])].sort((a, b) =>
    String(b?.tanggal_raw || "").localeCompare(String(a?.tanggal_raw || ""))
  );

const safeText = (value, fallback = "-") => {
  if (value == null || String(value).trim() === "") return fallback;
  return String(value);
};

const pickLargestByTotal = (list) => {
  let best = null;

  (Array.isArray(list) ? list : []).forEach((item) => {
    if (!item) return;
    const total = Number(item.total) || 0;
    const bestTotal = Number(best?.total) || 0;

    if (!best || total > bestTotal) {
      best = item;
      return;
    }

    if (total === bestTotal) {
      const currentDate = item.tanggal_raw || "";
      const bestDate = best?.tanggal_raw || "";
      if (currentDate && currentDate > bestDate) {
        best = item;
      }
    }
  });

  return best;
};

const buildUsageCountById = (invoices) => {
  const map = new Map();

  (Array.isArray(invoices) ? invoices : []).forEach((inv) => {
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
        map.set(key, (map.get(key) || 0) + 1);
      });
    } else {
      const id = inv?.armada_id ?? inv?.armada?.id ?? null;
      if (id == null) return;

      const key = String(id);
      map.set(key, (map.get(key) || 0) + 1);
    }
  });

  return map;
};

const formatArmadaLabel = (armada) => {
  const name = armada?.nama_truk || "Armada";
  const plate = armada?.plat_nomor ? ` (${armada.plat_nomor})` : "";
  return `${name}${plate}`;
};

const formatArmadaStatus = (value) => {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "ready") return "Ready";
  if (normalized === "full") return "Full";
  if (normalized.includes("ready")) return "Ready";
  return "Full";
};

const formatArmadaCapacity = (value) => {
  if (value == null || String(value).trim() === "") return "-";
  return String(value);
};

const sortArmadasByUsage = (list, order = "desc") => {
  const sorted = [...(Array.isArray(list) ? list : [])];
  sorted.sort((a, b) => {
    const diff = (a?.__usedCount || 0) - (b?.__usedCount || 0);
    if (diff !== 0) return order === "asc" ? diff : -diff;
    return String(a?.nama_truk || "").localeCompare(String(b?.nama_truk || ""));
  });
  return sorted;
};

const buildArmadaListReply = ({
  list,
  order = "desc",
  title,
  includeTotal = false,
}) => {
  if (!list || list.length === 0) return "Belum ada data armada.";
  const sorted = sortArmadasByUsage(list, order);
  const lines = sorted.map((armada, idx) => {
    const nama = safeText(armada?.nama_truk, "Armada");
    const plat = safeText(armada?.plat_nomor);
    const kapasitasLabel = formatArmadaCapacity(armada?.kapasitas);
    const statusLabel = formatArmadaStatus(armada?.status);
    const usage = armada?.__usedCount || 0;
    return `${idx + 1}. ${nama} (${plat}) | Kapasitas (Tonase): ${kapasitasLabel} | Status: ${statusLabel} | Penggunaan: ${usage}x`;
  });
  const header = title ? `${title}\n` : "";
  const totalUsage = includeTotal
    ? sorted.reduce((sum, armada) => sum + (armada?.__usedCount || 0), 0)
    : 0;
  const totalLine = includeTotal
    ? `Total penggunaan armada tercatat ${totalUsage}x.\n`
    : "";
  return `${header}${totalLine}${lines.join("\n")}`;
};

const formatArmadaUsageLine = (armada) => {
  const kapasitasLabel = formatArmadaCapacity(armada?.kapasitas);
  const statusLabel = formatArmadaStatus(armada?.status);
  const usage = armada?.__usedCount || 0;
  return `${formatArmadaLabel(
    armada
  )} | Kapasitas (Tonase): ${kapasitasLabel} | Status: ${statusLabel} | Penggunaan: ${usage}x`;
};

const formatTransactionLine = (item) => {
  const typeLabel = safeText(item?.type, "Income");
  const no = safeText(item?.no);
  const nama = safeText(item?.nama);
  const tanggal = safeText(item?.tanggal_display);
  const total = formatRupiah(item?.total);
  const status = safeText(item?.status);
  const recordedLabel = typeLabel === "Expense" ? "Dicatat oleh" : "Diterima oleh";
  const recordedBy = safeText(item?.recorded_by);

  return `${typeLabel} | Nomor: ${no} | Nama: ${nama} | Tanggal: ${tanggal} | Total: ${total} | Status: ${status} | ${recordedLabel}: ${recordedBy}`;
};

const ARMADA_START_KEYS = [
  "armada_start_date",
  "tanggal_berangkat",
  "tgl_berangkat",
  "berangkat_tanggal",
  "start_date",
  "tanggal_mulai",
  "start",
];
const ARMADA_END_KEYS = [
  "armada_end_date",
  "tanggal_sampai",
  "tgl_sampai",
  "tiba_tanggal",
  "end_date",
  "tanggal_selesai",
  "end",
];

const ensureArray = (val) => {
  if (!val) return [];
  if (Array.isArray(val)) return val;
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

const pickFirstDate = (obj, keys) => {
  for (const key of keys) {
    const norm = normalizeDate(obj?.[key]);
    if (norm) return norm;
  }
  return "";
};

const resolveArmadaLabel = (row, invoice, armadaById) => {
  const directName =
    row?.armada?.nama_truk ||
    invoice?.armada?.nama_truk ||
    "";
  const directPlate =
    row?.armada?.plat_nomor ||
    invoice?.armada?.plat_nomor ||
    "";
  if (directName || directPlate) {
    const name = safeText(directName, "Armada");
    const plate = safeText(directPlate, "-");
    return { label: `${name} (${plate})`, id: row?.armada_id ?? row?.armada?.id ?? invoice?.armada_id ?? invoice?.armada?.id ?? null };
  }

  const id =
    row?.armada_id ??
    row?.armada?.id ??
    invoice?.armada_id ??
    invoice?.armada?.id ??
    null;
  if (id != null && armadaById.has(String(id))) {
    const arm = armadaById.get(String(id));
    const name = safeText(arm?.nama_truk, "Armada");
    const plate = safeText(arm?.plat_nomor, "-");
    return { label: `${name} (${plate})`, id };
  }

  return { label: "Armada (-)", id };
};

const buildArmadaScheduleItems = (invoices, armadas) => {
  const armadaById = new Map();
  (Array.isArray(armadas) ? armadas : []).forEach((armada) => {
    if (armada?.id != null) {
      armadaById.set(String(armada.id), armada);
    }
  });

  const items = [];
  (Array.isArray(invoices) ? invoices : []).forEach((inv) => {
    const invoiceInfo = {
      type: "Income",
      no: inv?.no_invoice,
      nama: inv?.nama_pelanggan,
      tanggal_display: toDisplay(inv?.tanggal),
      total: inv?.total_bayar,
      status: inv?.status,
      recorded_by: inv?.diterima_oleh || "-",
    };

    const rincian = ensureArray(inv?.rincian);
    const rows = rincian.length > 0 ? rincian : [inv];

    rows.forEach((row) => {
      const startRaw =
        pickFirstDate(row, ARMADA_START_KEYS) ||
        pickFirstDate(inv, ARMADA_START_KEYS);
      const endRaw =
        pickFirstDate(row, ARMADA_END_KEYS) ||
        pickFirstDate(inv, ARMADA_END_KEYS);
      const armadaInfo = resolveArmadaLabel(row, inv, armadaById);

      if (startRaw) {
        items.push({
          kind: "departure",
          date_raw: startRaw,
          date_display: toDisplay(startRaw),
          armada_label: armadaInfo.label,
          armada_id: armadaInfo.id,
          invoice: invoiceInfo,
        });
      }

      if (endRaw) {
        items.push({
          kind: "arrival",
          date_raw: endRaw,
          date_display: toDisplay(endRaw),
          armada_label: armadaInfo.label,
          armada_id: armadaInfo.id,
          invoice: invoiceInfo,
        });
      }
    });
  });

  return items;
};

const buildInvoiceSummaryList = (invoices) =>
  (Array.isArray(invoices) ? invoices : []).map((inv) => ({
    type: "Income",
    no: inv?.no_invoice,
    nama: inv?.nama_pelanggan,
    tanggal_raw: normalizeDate(inv?.tanggal),
    tanggal_display: toDisplay(inv?.tanggal),
    total: inv?.total_bayar,
    status: inv?.status,
    recorded_by: inv?.diterima_oleh || "-",
  }));

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([defaultGreeting]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const usageCacheRef = useRef({ data: null, fetchedAt: 0 });
  const invoiceExpenseCacheRef = useRef({ data: null, fetchedAt: 0 });

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [open, messages, loading]);

  const getArmadaUsageData = async () => {
    const now = Date.now();
    const cached = usageCacheRef.current;

    if (cached?.data && now - cached.fetchedAt < ARMADA_USAGE_CACHE_MS) {
      return cached.data;
    }

    const [armadas, invoices] = await Promise.all([
      api.get("/armadas"),
      api.get("/invoices"),
    ]);

    const invoicesList = Array.isArray(invoices) ? invoices : [];
    const usageCountById = buildUsageCountById(invoicesList);
    const list = (Array.isArray(armadas) ? armadas : []).map((armada) => ({
      ...armada,
      __usedCount:
        armada?.id != null ? usageCountById.get(String(armada.id)) || 0 : 0,
    }));

    list.sort((a, b) => {
      const diff = (b.__usedCount || 0) - (a.__usedCount || 0);
      if (diff !== 0) return diff;
      return String(a.nama_truk || "").localeCompare(String(b.nama_truk || ""));
    });

    const data = { armadas: list, usageCountById, invoices: invoicesList };
    usageCacheRef.current = { data, fetchedAt: now };
    return data;
  };

  const getInvoiceExpenseData = async () => {
    const now = Date.now();
    const cached = invoiceExpenseCacheRef.current;

    if (cached?.data && now - cached.fetchedAt < INVOICE_EXPENSE_CACHE_MS) {
      return cached.data;
    }

    const [invoices, expenses] = await Promise.all([
      api.get("/invoices"),
      api.get("/expenses"),
    ]);

    const incomeList = Array.isArray(invoices)
      ? invoices.map((i) => ({
          ...i,
          type: "Income",
          no: i.no_invoice,
          tanggal_raw: normalizeDate(i.tanggal),
          tanggal_display: toDisplay(i.tanggal),
          total: i.total_bayar,
          nama: i.nama_pelanggan,
          status: i.status,
          recorded_by: i.diterima_oleh || "-",
        }))
      : [];

    const expenseList = Array.isArray(expenses)
      ? expenses.map((e) => ({
          ...e,
          type: "Expense",
          no: e.no_expense,
          tanggal_raw: normalizeDate(e.tanggal),
          tanggal_display: toDisplay(e.tanggal),
          total: e.total_pengeluaran,
          nama: "-",
          status: e.status,
          recorded_by: e.dicatat_oleh || "Admin",
        }))
      : [];

    const data = { incomeList, expenseList };
    invoiceExpenseCacheRef.current = { data, fetchedAt: now };
    return data;
  };

  const buildArmadaUsageReply = async (text) => {
    const lower = text.toLowerCase();
    const hasArmadaKeyword =
      lower.includes("armada") ||
      lower.includes("truk") ||
      lower.includes("truck") ||
      lower.includes("fleet");
    const invoiceExpenseHints = [
      "invoice",
      "expense",
      "transaksi",
      "income",
      "pemasukan",
      "pengeluaran",
      "biaya",
    ];
    const hasInvoiceExpenseHint =
      invoiceExpenseHints.some((keyword) => lower.includes(keyword)) ||
      /\b(?:inc|exp)[-\s_]*\d{4}\b/i.test(lower);
    const recentUserMentions = messages
      .filter((item) => item.role === "user")
      .slice(-3)
      .some((item) => {
        const msg = String(item?.content || "").toLowerCase();
        return (
          msg.includes("armada") ||
          msg.includes("truk") ||
          msg.includes("truck") ||
          msg.includes("fleet")
        );
      });
    const hasArmadaContext =
      hasArmadaKeyword || (recentUserMentions && !hasInvoiceExpenseHint);

    const usageKeywords = [
      "digunakan",
      "dipakai",
      "penggunaan",
      "pemakaian",
      "terpakai",
      "frekuensi",
      "usage",
      "used",
    ];

    const detailKeywords = [
      "detail",
      "info",
      "informasi",
      "status",
      "kapasitas",
      "ready",
      "full",
    ];
    const listKeywords = [
      "daftar",
      "list",
      "data",
      "semua",
      "semuanya",
      "seluruh",
      "tampilkan",
      "lihat",
      "apa saja",
    ];
    const leastKeywords = [
      "paling sedikit",
      "terkecil",
      "paling kecil",
      "paling jarang",
      "minimum",
      "min",
      "least",
    ];
    const departKeywords = [
      "berangkat",
      "keberangkatan",
      "jadwal berangkat",
      "jadwal keberangkatan",
      "departure",
      "start",
      "mulai",
    ];
    const arriveKeywords = [
      "tiba",
      "sampai",
      "kedatangan",
      "arrival",
      "end",
      "selesai",
    ];
    const scheduleKeywords = [...departKeywords, ...arriveKeywords, "jadwal"];

    const isUsageQuery =
      hasArmadaContext &&
      usageKeywords.some((keyword) => lower.includes(keyword));
    const isCountQuery =
      hasArmadaContext &&
      (lower.includes("berapa kali") || lower.includes("berapa x"));
    const isTopQuery =
      hasArmadaContext &&
      (lower.includes("paling banyak") ||
        lower.includes("paling sering") ||
        lower.includes("terbanyak") ||
        lower.includes("tersering") ||
        lower.includes("top"));
    const isDetailQuery =
      hasArmadaContext &&
      detailKeywords.some((keyword) => lower.includes(keyword));
    const isListQuery =
      hasArmadaContext && listKeywords.some((keyword) => lower.includes(keyword));
    const isLeastQuery =
      hasArmadaContext &&
      leastKeywords.some((keyword) => lower.includes(keyword));
    const isScheduleQuery =
      hasArmadaContext &&
      scheduleKeywords.some((keyword) => lower.includes(keyword));
    const wantsDepart = departKeywords.some((keyword) => lower.includes(keyword));
    const wantsArrive = arriveKeywords.some((keyword) => lower.includes(keyword));
    const years = extractYears(text);
    const hasYear = years.length > 0;

    if (!hasArmadaContext) {
      return null;
    }

    try {
      const { armadas, invoices } = await getArmadaUsageData();
      if (!armadas.length) return "Belum ada data armada.";

      const textKey = normalizeKey(text);
      const plateMatch = armadas.find((armada) => {
        const plateKey = normalizeKey(armada?.plat_nomor);
        return plateKey && textKey.includes(plateKey);
      });

      let matches = [];
      if (plateMatch) {
        matches = [plateMatch];
      } else {
        const nameMatches = armadas.filter((armada) => {
          const nameKey = normalizeKey(armada?.nama_truk);
          if (nameKey && textKey.includes(nameKey)) return true;

          const tokens = tokenize(armada?.nama_truk);
          if (!tokens.length) return false;

          const hits = tokens.filter((token) => lower.includes(token));
          return hits.length >= Math.min(2, tokens.length);
        });

        if (nameMatches.length > 0) matches = nameMatches;
      }

      const orderForList = isLeastQuery ? "asc" : "desc";

      if (isScheduleQuery) {
        const scheduleItems = buildArmadaScheduleItems(invoices, armadas);
        let scoped = scheduleItems;

        if (matches.length > 0) {
          const matchIds = matches
            .map((m) => (m?.id != null ? String(m.id) : null))
            .filter(Boolean);
          const matchKeys = matches.map((m) =>
            normalizeKey(formatArmadaLabel(m))
          );

          scoped = scoped.filter((item) => {
            const itemId = item?.armada_id != null ? String(item.armada_id) : "";
            if (itemId && matchIds.includes(itemId)) return true;
            const itemKey = normalizeKey(item?.armada_label || "");
            return matchKeys.some((key) => key && itemKey.includes(key));
          });
        }

        if (hasYear) {
          scoped = scoped.filter((item) =>
            years.some((year) =>
              String(item?.date_raw || "").startsWith(`${year}-`)
            )
          );
        }

        if (wantsDepart && !wantsArrive) {
          scoped = scoped.filter((item) => item.kind === "departure");
        } else if (wantsArrive && !wantsDepart) {
          scoped = scoped.filter((item) => item.kind === "arrival");
        }

        if (!scoped.length) {
          const kindLabel =
            wantsDepart && !wantsArrive
              ? "keberangkatan"
              : wantsArrive && !wantsDepart
              ? "kedatangan"
              : "keberangkatan/kedatangan";
          const yearText = hasYear ? ` pada tahun ${years.join(", ")}` : "";
          const armadaText =
            matches.length === 1
              ? ` untuk ${formatArmadaLabel(matches[0])}`
              : "";
          const invoiceSummary = buildInvoiceSummaryList(invoices);
          const invoiceScoped = hasYear
            ? invoiceSummary.filter((item) =>
                years.some((year) =>
                  String(item?.tanggal_raw || "").startsWith(`${year}-`)
                )
              )
            : invoiceSummary;
          const sortedInvoice = sortByTanggalDesc(invoiceScoped);
          if (sortedInvoice.length > 0) {
            const lines = sortedInvoice.map(
              (item, idx) => `${idx + 1}. ${formatTransactionLine(item)}`
            );
            return `Data ${kindLabel} armada${armadaText}${yearText} tidak ditemukan. Berikut transaksi invoice${yearText} (${sortedInvoice.length} data):\n${lines.join(
              "\n"
            )}`;
          }
          return `Tidak ada data ${kindLabel} armada${armadaText}${yearText}.`;
        }

        const scheduleAsc =
          lower.includes("paling awal") || lower.includes("terawal");
        const sorted = [...scoped].sort((a, b) =>
          String(a?.date_raw || "").localeCompare(String(b?.date_raw || ""))
        );
        if (!scheduleAsc) sorted.reverse();

        const kindLabel =
          wantsDepart && !wantsArrive
            ? "keberangkatan"
            : wantsArrive && !wantsDepart
            ? "kedatangan"
            : "keberangkatan & kedatangan";
        const yearText = hasYear ? ` tahun ${years.join(", ")}` : "";
        const armadaText =
          matches.length === 1
            ? ` untuk ${formatArmadaLabel(matches[0])}`
            : "";
        const header = `Jadwal ${kindLabel} armada${armadaText}${yearText} (${sorted.length} data):`;
        const lines = sorted.map((item, idx) => {
          const kind = item.kind === "departure" ? "Berangkat" : "Tiba";
          const invoiceLine = formatTransactionLine(item.invoice);
          return `${idx + 1}. ${kind}: ${item.date_display} | Armada: ${
            item.armada_label
          } | ${invoiceLine}`;
        });

        return `${header}\n${lines.join("\n")}`;
      }

      if (isDetailQuery) {
        if (matches.length === 1) {
          const armada = matches[0];
          const statusLabel = formatArmadaStatus(armada?.status);
          const kapasitasLabel = formatArmadaCapacity(armada?.kapasitas);
          return `Detail armada:\n- Nama Truk: ${safeText(
            armada?.nama_truk,
            "Armada"
          )}\n- Plat Nomor: ${safeText(
            armada?.plat_nomor
          )}\n- Kapasitas (Tonase): ${kapasitasLabel}\n- Status: ${statusLabel}\n- Penggunaan: ${
            armada.__usedCount || 0
          }x`;
        }

        const title = matches.length
          ? "Beberapa armada cocok. Daftar lengkap armada:"
          : "Daftar armada:";
        return buildArmadaListReply({
          list: armadas,
          order: orderForList,
          title,
          includeTotal: true,
        });
      }

      if (!isUsageQuery && !isCountQuery && !isTopQuery && isListQuery) {
        const title = isLeastQuery
          ? "Urutan penggunaan armada dari yang paling sedikit:"
          : "Daftar armada:";
        return buildArmadaListReply({
          list: armadas,
          order: orderForList,
          title,
          includeTotal: true,
        });
      }

      if (!isUsageQuery && !isCountQuery && !isTopQuery && !isDetailQuery) {
        const title = isLeastQuery
          ? "Urutan penggunaan armada dari yang paling sedikit:"
          : "Daftar armada:";
        return buildArmadaListReply({
          list: armadas,
          order: orderForList,
          title,
          includeTotal: true,
        });
      }

      if (!isTopQuery && !isLeastQuery && matches.length === 1) {
        const armada = matches[0];
        return `Armada ${formatArmadaLabel(armada)} digunakan ${
          armada.__usedCount || 0
        }x berdasarkan data invoice.`;
      }

      if (!isTopQuery && !isLeastQuery && matches.length > 1) {
        const title = isLeastQuery
          ? "Beberapa armada cocok. Urutan penggunaan dari yang paling sedikit:"
          : "Beberapa armada cocok. Daftar lengkap armada:";
        return buildArmadaListReply({
          list: armadas,
          order: orderForList,
          title,
          includeTotal: true,
        });
      }

      const baseListForExtreme = matches.length > 0 ? matches : armadas;
      const sortedByUsage = sortArmadasByUsage(
        baseListForExtreme,
        isLeastQuery ? "asc" : "desc"
      );
      const top = sortedByUsage[0];

      if (isTopQuery) {
        return `Armada paling sering digunakan: ${formatArmadaUsageLine(top)}.`;
      }

      if (isLeastQuery) {
        return `Armada paling sedikit digunakan: ${formatArmadaUsageLine(top)}.`;
      }

      return buildArmadaListReply({
        list: armadas,
        order: "desc",
        title: "Ringkasan penggunaan armada (urut terbanyak):",
        includeTotal: true,
      });
    } catch (err) {
      return "Maaf, saya belum bisa mengambil data penggunaan armada saat ini.";
    }
  };

  const formatIncomeDetail = (item, title) => {
    const lines = [
      `${title}:`,
      `- No. Invoice: ${safeText(item?.no)}`,
      `- Nama Pelanggan: ${safeText(item?.nama)}`,
      `- Tanggal: ${safeText(item?.tanggal_display)}`,
      `- Status: ${safeText(item?.status)}`,
      `- Total Bayar: ${formatRupiah(item?.total)}`,
    ];
    const receivedBy = safeText(item?.recorded_by, "");
    if (receivedBy) lines.push(`- Diterima oleh: ${receivedBy}`);
    return lines.join("\n");
  };

  const formatExpenseDetail = (item, title) => {
    const lines = [
      `${title}:`,
      `- No. Expense: ${safeText(item?.no)}`,
      `- Tanggal: ${safeText(item?.tanggal_display)}`,
      `- Status: ${safeText(item?.status)}`,
      `- Total Pengeluaran: ${formatRupiah(item?.total)}`,
    ];
    const recordedBy = safeText(item?.recorded_by, "");
    if (recordedBy) lines.push(`- Dicatat oleh: ${recordedBy}`);
    return lines.join("\n");
  };

  const buildInvoiceExpenseReply = async (text) => {
    const lower = text.toLowerCase();
    const textKey = normalizeKey(text);
    const years = extractYears(text);
    const hasYear = years.length > 0;
    const yearLabel = hasYear ? years.join(", ") : "";

    const incomeKeywords = [
      "income",
      "pemasukan",
      "pendapatan",
      "invoice",
    ];
    const expenseKeywords = ["expense", "pengeluaran", "biaya", "cost"];
    const transactionKeywords = ["transaksi", "transaction"];
    const detailKeywords = [
      "detail",
      "rincian",
      "info",
      "informasi",
      "cek",
      "lihat",
      "status",
    ];
    const biggestKeywords = [
      "terbesar",
      "paling besar",
      "tertinggi",
      "biggest",
      "largest",
      "max",
      "maksimal",
      "top",
    ];
    const totalKeywords = ["total", "jumlah", "akumulasi", "sum"];
    const numberPattern = /\b(?:inc|exp)[-\s_]*\d{4}[-\s_]*\d{3,}\b/i;

    const hasIncome = incomeKeywords.some((keyword) => lower.includes(keyword));
    const hasExpense = expenseKeywords.some((keyword) =>
      lower.includes(keyword)
    );
    const hasTransaction = transactionKeywords.some((keyword) =>
      lower.includes(keyword)
    );
    const wantsDetail = detailKeywords.some((keyword) =>
      lower.includes(keyword)
    );
    const wantsBiggest = biggestKeywords.some((keyword) =>
      lower.includes(keyword)
    );
    const wantsTotal = totalKeywords.some((keyword) => lower.includes(keyword));
    const hasNumberPattern = numberPattern.test(lower);

    if (
      !hasIncome &&
      !hasExpense &&
      !hasTransaction &&
      !hasNumberPattern &&
      !hasYear
    ) {
      return null;
    }

    if (
      !wantsDetail &&
      !wantsBiggest &&
      !wantsTotal &&
      !hasNumberPattern &&
      !hasYear
    ) {
      return null;
    }

    try {
      const { incomeList, expenseList } = await getInvoiceExpenseData();
      const hasAny = incomeList.length > 0 || expenseList.length > 0;
      if (!hasAny) return "Belum ada data income atau expense.";

      const matchByNumber = (list) =>
        (Array.isArray(list) ? list : []).find((item) => {
          const key = normalizeKey(item?.no);
          return key && textKey.includes(key);
        });

      const matchedIncome = matchByNumber(incomeList);
      const matchedExpense = matchByNumber(expenseList);

      if (matchedIncome || matchedExpense) {
        if (matchedExpense && !matchedIncome) {
          return formatExpenseDetail(
            matchedExpense,
            "Detail Transaksi Expense"
          );
        }
        if (matchedIncome && !matchedExpense) {
          return formatIncomeDetail(matchedIncome, "Detail Transaksi Income");
        }

        if (matchedExpense && !hasIncome) {
          return formatExpenseDetail(
            matchedExpense,
            "Detail Transaksi Expense"
          );
        }

        return formatIncomeDetail(matchedIncome, "Detail Transaksi Income");
      }

      const filterByYears = (list) => {
        if (!hasYear) return list;
        return (Array.isArray(list) ? list : []).filter((item) =>
          years.some((year) =>
            String(item?.tanggal_raw || "").startsWith(`${year}-`)
          )
        );
      };

      const scopedIncome = filterByYears(incomeList);
      const scopedExpense = filterByYears(expenseList);

      if (hasNumberPattern) {
        return "Nomor invoice/expense tersebut tidak ditemukan.";
      }

      if (wantsDetail && !wantsBiggest && !wantsTotal) {
        if (hasIncome && !hasExpense) {
          return "Sebutkan nomor invoice untuk menampilkan detailnya.";
        }

        if (hasExpense && !hasIncome) {
          return "Sebutkan nomor expense untuk menampilkan detailnya.";
        }

        return "Sebutkan nomor invoice atau expense untuk menampilkan detailnya.";
      }

      if (wantsBiggest) {
        const wantsBoth =
          (hasIncome && hasExpense) || (!hasIncome && !hasExpense);

        const topIncome = pickLargestByTotal(scopedIncome);
        const topExpense = pickLargestByTotal(scopedExpense);
        const incomeTitle = hasYear
          ? `Transaksi Income Terbesar tahun ${yearLabel}`
          : "Transaksi Income Terbesar";
        const expenseTitle = hasYear
          ? `Transaksi Expense Terbesar tahun ${yearLabel}`
          : "Transaksi Expense Terbesar";

        if (wantsBoth) {
          const chunks = [];
          if (topIncome) {
            chunks.push(formatIncomeDetail(topIncome, incomeTitle));
          } else {
            chunks.push(
              hasYear
                ? `Transaksi Income Terbesar tahun ${yearLabel}: tidak ada data.`
                : "Transaksi Income Terbesar: tidak ada data."
            );
          }

          if (topExpense) {
            chunks.push(formatExpenseDetail(topExpense, expenseTitle));
          } else {
            chunks.push(
              hasYear
                ? `Transaksi Expense Terbesar tahun ${yearLabel}: tidak ada data.`
                : "Transaksi Expense Terbesar: tidak ada data."
            );
          }

          return chunks.join("\n\n");
        }

        if (hasIncome) {
          if (!topIncome) {
            return hasYear
              ? `Belum ada data income tahun ${yearLabel}.`
              : "Belum ada data income.";
          }
          return formatIncomeDetail(topIncome, incomeTitle);
        }

        if (hasExpense) {
          if (!topExpense) {
            return hasYear
              ? `Belum ada data expense tahun ${yearLabel}.`
              : "Belum ada data expense.";
          }
          return formatExpenseDetail(topExpense, expenseTitle);
        }
      }

      if (wantsTotal) {
        const sumTotals = (list) =>
          (Array.isArray(list) ? list : []).reduce(
            (sum, item) => sum + (Number(item?.total) || 0),
            0
          );

        const totalIncome = sumTotals(scopedIncome);
        const totalExpense = sumTotals(scopedExpense);

        if (hasIncome && !hasExpense) {
          return hasYear
            ? `Total income tahun ${yearLabel}: ${formatRupiah(totalIncome)}`
            : `Total income saat ini: ${formatRupiah(totalIncome)}`;
        }

        if (hasExpense && !hasIncome) {
          return hasYear
            ? `Total expense tahun ${yearLabel}: ${formatRupiah(totalExpense)}`
            : `Total expense saat ini: ${formatRupiah(totalExpense)}`;
        }

        if (hasYear) {
          return `Total income tahun ${yearLabel}: ${formatRupiah(
            totalIncome
          )}\nTotal expense tahun ${yearLabel}: ${formatRupiah(totalExpense)}`;
        }

        return `Total income: ${formatRupiah(
          totalIncome
        )}\nTotal expense: ${formatRupiah(totalExpense)}`;
      }

      if (hasYear) {
        const buildListSection = (list, label) => {
          if (!list.length) {
            return `Tidak ada transaksi ${label} pada tahun ${yearLabel}.`;
          }

          const sorted = sortByTanggalDesc(list);
          const lines = sorted.map(
            (item, idx) => `${idx + 1}. ${formatTransactionLine(item)}`
          );

          return `Transaksi ${label} tahun ${yearLabel} (${list.length} data):\n${lines.join(
            "\n"
          )}`;
        };

        const wantsIncomeOnly = hasIncome && !hasExpense;
        const wantsExpenseOnly = hasExpense && !hasIncome;

        if (wantsIncomeOnly) {
          return buildListSection(scopedIncome, "income");
        }

        if (wantsExpenseOnly) {
          return buildListSection(scopedExpense, "expense");
        }

        const combined = sortByTanggalDesc([
          ...scopedIncome,
          ...scopedExpense,
        ]);

        if (!combined.length) {
          return `Tidak ada transaksi income maupun expense pada tahun ${yearLabel}.`;
        }

        const combinedLines = combined.map(
          (item, idx) => `${idx + 1}. ${formatTransactionLine(item)}`
        );
        return `Transaksi tahun ${yearLabel} (${combined.length} data):\n${combinedLines.join(
          "\n"
        )}`;
      }
    } catch (err) {
      return "Maaf, saya belum bisa mengambil data invoice/expense saat ini.";
    }

    return null;
  };

  const sendMessage = async (event) => {
    event?.preventDefault();
    const text = input.trim();
    if (!text || loading) return;

    const history = messages
      .filter((item) => item.role === "user" || item.role === "assistant")
      .slice(-8);

    const userMessage = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const localReply = await buildArmadaUsageReply(text);
      if (localReply) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: formatDatesInText(localReply),
          },
        ]);
        return;
      }

      const invoiceReply = await buildInvoiceExpenseReply(text);
      if (invoiceReply) {
        setMessages((prev) => [
          ...prev,
          { role: "assistant", content: formatDatesInText(invoiceReply) },
        ]);
        return;
      }

      const res = await api.post("/chat", {
        message: text,
        history,
      });

      const reply =
        res?.reply ||
        "Maaf, AI belum bisa memberikan jawaban. Coba ulangi lagi.";

      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: formatDatesInText(reply) },
      ]);
    } catch (err) {
      const fallback =
        err?.message ||
        "Maaf, ada kendala saat menghubungi AI. Coba beberapa saat lagi.";
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: formatDatesInText(fallback) },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const clearChat = () => {
    setMessages([defaultGreeting]);
  };

  return (
    <div className={`cvant-chatbot ${open ? "open" : ""}`}>
      <button
        type="button"
        className="cvant-chatbot__toggle"
        onClick={() => setOpen((prev) => !prev)}
        aria-label={open ? "Tutup chatbot" : "Buka chatbot"}
      >
        <Icon
          icon={open ? "solar:close-circle-bold" : "fluent:chat-24-filled"}
        />
      </button>

      {open && (
        <div className="cvant-chatbot__panel">
          <div className="cvant-chatbot__header">
            <div>
              <div className="cvant-chatbot__title">Asisten CV ANT</div>
              <div className="cvant-chatbot__subtitle">Chat Bot</div>
            </div>
            <button
              type="button"
              className="cvant-chatbot__clear"
              onClick={clearChat}
            >
              Reset Chat
            </button>
          </div>

          <div className="cvant-chatbot__messages">
            {messages.map((item, index) => (
              <div
                key={`${item.role}-${index}`}
                className={`cvant-chatbot__bubble ${item.role}`}
              >
                {item.content}
              </div>
            ))}

            {loading && (
              <div className="cvant-chatbot__bubble assistant">
                Sedang mengetik...
              </div>
            )}
            <div ref={endRef} />
          </div>

          <form className="cvant-chatbot__input" onSubmit={sendMessage}>
            <textarea
              rows={2}
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Tanya tentang invoice, expense, armada..."
              aria-label="Tulis pesan"
            />
            <button type="submit" disabled={!input.trim() || loading}>
              <Icon icon="tabler:send" />
            </button>
          </form>
        </div>
      )}

      <style jsx>{`
        .cvant-chatbot {
          position: fixed;
          right: 24px;
          bottom: 24px;
          z-index: 1050;
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;
        }

        .cvant-chatbot__toggle {
          width: 54px;
          height: 54px;
          border-radius: 999px;
          background: linear-gradient(
            90deg,
            rgba(91, 140, 255, 0.94),
            rgba(168, 85, 247, 0.92)
          );
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 12px 28px rgba(17, 24, 39, 0.25);
          cursor: pointer;
        }

        .cvant-chatbot__toggle :global(svg) {
          width: 24px;
          height: 24px;
        }

        .cvant-chatbot__panel {
          width: 360px;
          max-height: 520px;
          display: flex;
          flex-direction: column;
          background: var(--white);
          color: var(--text-primary-light);
          border: 1px solid var(--border-color);
          border-radius: 16px;
          overflow: hidden;
          box-shadow: 0 18px 40px rgba(17, 24, 39, 0.18);
        }

        .cvant-chatbot__header {
          padding: 12px 16px;
          background: linear-gradient(
            90deg,
            rgba(91, 140, 255, 0.94),
            rgba(168, 85, 247, 0.92)
          );
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: space-between;
        }

        .cvant-chatbot__title {
          font-weight: 600;
          font-size: 14px;
        }

        .cvant-chatbot__subtitle {
          font-size: 12px;
          opacity: 0.85;
          margin-top: 2px;
        }

        .cvant-chatbot__clear {
          padding: 4px 8px;
          border-radius: 8px;
          background: rgba(255, 255, 255, 0.18);
          color: #fff;
          font-size: 12px;
          cursor: pointer;
        }

        .cvant-chatbot__messages {
          padding: 14px;
          display: flex;
          flex-direction: column;
          gap: 10px;
          overflow-y: auto;
          background: var(--bg-color);
          flex: 1;
        }

        .cvant-chatbot__bubble {
          max-width: 80%;
          padding: 10px 12px;
          border-radius: 12px;
          font-size: 13px;
          line-height: 1.5;
          background: var(--white);
          color: var(--text-primary-light);
          box-shadow: 0 6px 16px rgba(17, 24, 39, 0.08);
          align-self: flex-start;
          white-space: pre-wrap;
        }

        .cvant-chatbot__bubble.user {
          align-self: flex-end;
          background: var(--primary-600);
          color: #fff;
        }

        .cvant-chatbot__input {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 12px;
          border-top: 1px solid var(--border-color);
          background: var(--white);
        }

        .cvant-chatbot__input textarea {
          flex: 1;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--bg-color);
          color: var(--text-primary-light);
          font-size: 13px;
          resize: none;
          height: 52px;
          line-height: 1.4;
          overflow-y: auto;
        }

        .cvant-chatbot__input button {
          width: 38px;
          height: 38px;
          border-radius: 10px;
          background: var(--primary-600);
          color: #fff;
          display: inline-flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
        }

        .cvant-chatbot__input button:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .cvant-chatbot__input :global(svg) {
          width: 18px;
          height: 18px;
        }

        @media (max-width: 576px) {
          .cvant-chatbot {
            right: 16px;
            bottom: 16px;
          }

          .cvant-chatbot__panel {
            width: min(92vw, 360px);
            max-height: 65vh;
          }
        }
      `}</style>
    </div>
  );
};

export default ChatbotWidget;

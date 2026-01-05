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

    const usageCountById = buildUsageCountById(invoices);
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

    const data = { armadas: list, usageCountById };
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
    const hasArmadaContext = hasArmadaKeyword || recentUserMentions;

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

    if (!hasArmadaContext) {
      return null;
    }

    try {
      const { armadas } = await getArmadaUsageData();
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

      const usedList = armadas.filter((armada) => (armada.__usedCount || 0) > 0);

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

        if (matches.length > 1) {
          const lines = matches
            .slice(0, 5)
            .map(
              (armada, idx) => {
                const statusLabel = formatArmadaStatus(armada?.status);
                const kapasitasLabel = formatArmadaCapacity(armada?.kapasitas);
                return `${idx + 1}. ${formatArmadaLabel(
                  armada
                )} | Kapasitas (Tonase): ${kapasitasLabel} | Status: ${statusLabel} | Penggunaan: ${
                  armada.__usedCount || 0
                }x`;
              }
            )
            .join("\n");
          const tail =
            matches.length > 5
              ? `\nDan ${matches.length - 5} lainnya. Sebutkan nama/plat yang tepat.`
              : "\nSebutkan nama/plat yang tepat untuk detail.";
          return `Saya menemukan beberapa armada yang cocok:\n${lines}${tail}`;
        }

        return "Sebutkan nama/plat armada untuk menampilkan detailnya.";
      }

      if (!isUsageQuery && !isCountQuery && !isTopQuery && isListQuery) {
        const maxItems = 8;
        const lines = armadas
          .slice(0, maxItems)
          .map((armada, idx) => {
            const nama = safeText(armada?.nama_truk, "Armada");
            const plat = safeText(armada?.plat_nomor);
            const kapasitasLabel = formatArmadaCapacity(armada?.kapasitas);
            const statusLabel = formatArmadaStatus(armada?.status);
            const usage = armada.__usedCount || 0;
            return `${idx + 1}. ${nama} (${plat}) | Kapasitas (Tonase): ${kapasitasLabel} | Status: ${statusLabel} | Penggunaan: ${usage}x`;
          })
          .join("\n");
        const tail =
          armadas.length > maxItems
            ? `\nDan ${armadas.length - maxItems} lainnya.`
            : "";
        return `Daftar armada:\n${lines}${tail}`;
      }

      if (!isUsageQuery && !isCountQuery && !isTopQuery && !isDetailQuery) {
        const maxItems = 8;
        const lines = armadas
          .slice(0, maxItems)
          .map((armada, idx) => {
            const nama = safeText(armada?.nama_truk, "Armada");
            const plat = safeText(armada?.plat_nomor);
            const kapasitasLabel = formatArmadaCapacity(armada?.kapasitas);
            const statusLabel = formatArmadaStatus(armada?.status);
            const usage = armada.__usedCount || 0;
            return `${idx + 1}. ${nama} (${plat}) | Kapasitas (Tonase): ${kapasitasLabel} | Status: ${statusLabel} | Penggunaan: ${usage}x`;
          })
          .join("\n");
        const tail =
          armadas.length > maxItems
            ? `\nDan ${armadas.length - maxItems} lainnya.`
            : "";
        return `Daftar armada:\n${lines}${tail}`;
      }

      if (!usedList.length) {
        return "Belum ada data penggunaan armada pada invoice.";
      }

      if (matches.length === 1) {
        const armada = matches[0];
        return `Armada ${formatArmadaLabel(armada)} digunakan ${
          armada.__usedCount || 0
        }x berdasarkan data invoice.`;
      }

      if (matches.length > 1) {
        const lines = matches
          .slice(0, 5)
          .map(
            (armada, idx) =>
              `${idx + 1}. ${formatArmadaLabel(armada)} - ${
                armada.__usedCount || 0
              }x`
          )
          .join("\n");
        const tail =
          matches.length > 5
            ? `\nDan ${matches.length - 5} lainnya. Sebutkan nama/plat yang tepat.`
            : "\nSebutkan nama/plat yang tepat untuk detail.";
        return `Saya menemukan beberapa armada yang cocok:\n${lines}${tail}`;
      }

      const topList = usedList.slice(0, 5);
      const lines = topList
        .map(
          (armada, idx) =>
            `${idx + 1}. ${formatArmadaLabel(armada)} - ${
              armada.__usedCount || 0
            }x`
        )
        .join("\n");
      const top = topList[0];

      if (isTopQuery) {
        return `Armada paling sering digunakan: ${formatArmadaLabel(top)} (${
          top.__usedCount || 0
        }x).\nTop penggunaan saat ini:\n${lines}`;
      }

      const totalUsage = usedList.reduce(
        (sum, armada) => sum + (armada.__usedCount || 0),
        0
      );
      const totalLine =
        totalUsage > 0
          ? `Total penggunaan armada tercatat ${totalUsage}x.\n`
          : "";

      return `${totalLine}Ringkasan penggunaan armada tertinggi:\n${lines}\nSebutkan nama/plat jika ingin detail armada tertentu.`;
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
          const maxItems = 6;
          const lines = sorted.slice(0, maxItems).map((item, idx) => {
            const no = safeText(item?.no);
            const nama = safeText(item?.nama);
            const tanggal = safeText(item?.tanggal_display);
            const total = formatRupiah(item?.total);
            const status = safeText(item?.status);

            return `${idx + 1}. ${no} | ${nama} | ${tanggal} | ${total} | ${status}`;
          });

          const tail =
            list.length > maxItems
              ? `\nDan ${list.length - maxItems} lainnya.`
              : "";

          return `Transaksi ${label} tahun ${yearLabel} (${list.length} data):\n${lines.join(
            "\n"
          )}${tail}`;
        };

        const wantsIncomeOnly = hasIncome && !hasExpense;
        const wantsExpenseOnly = hasExpense && !hasIncome;

        if (wantsIncomeOnly) {
          return buildListSection(scopedIncome, "income");
        }

        if (wantsExpenseOnly) {
          return buildListSection(scopedExpense, "expense");
        }

        if (!scopedIncome.length && !scopedExpense.length) {
          return `Tidak ada transaksi income maupun expense pada tahun ${yearLabel}.`;
        }

        const sections = [];
        sections.push(buildListSection(scopedIncome, "income"));
        sections.push(buildListSection(scopedExpense, "expense"));
        return sections.join("\n\n");
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
            <input
              type="text"
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

        .cvant-chatbot__input input {
          flex: 1;
          padding: 8px 10px;
          border-radius: 10px;
          border: 1px solid var(--border-color);
          background: var(--bg-color);
          color: var(--text-primary-light);
          font-size: 13px;
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

"use client";

import React, { useEffect, useMemo, useState } from "react";
import { Icon } from "@iconify/react";
import { api } from "@/lib/api";

const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** PARSE dd-mm-YYYY or YYYY-MM-DD or ISO */
const parseTanggal = (str) => {
  if (!str) return null;

  // ISO: 2025-11-20T17:00:00Z
  if (str.includes("T")) {
    const dateOnly = str.split("T")[0];
    return new Date(`${dateOnly}T00:00:00`);
  }

  // dd-mm-yyyy
  if (/^\d{2}-\d{2}-\d{4}$/.test(str)) {
    const [dd, mm, yyyy] = str.split("-");
    return new Date(`${yyyy}-${mm}-${dd}T00:00:00`);
  }

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return new Date(`${str}T00:00:00`);
  }

  return null;
};

const formatRupiah = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(n || 0);

const UnitCountOne = () => {
  // ✅ efek masuk (tanpa ubah style existing)
  const [pageIn, setPageIn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setPageIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const [items, setItems] = useState([]); // unified invoices + expenses
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        setLoading(true);

        const [invoices, expenses] = await Promise.all([
          api.get("/invoices"),
          api.get("/expenses"),
        ]);

        // ✅ Income: pakai total_bayar (sudah terpotong PPH) agar sama dengan InvoiceListLayer.jsx
        // fallback aman kalau field belum ada: hitung dari tonase*harga - 2%
        const incomeList = (Array.isArray(invoices) ? invoices : []).map(
          (i) => {
            const tb = Number(i.total_bayar);
            const hasTotalBayar = Number.isFinite(tb) && tb > 0;

            const ton = Math.round(parseFloat(i.tonase) || 0);
            const harga = Math.round(parseFloat(i.harga) || 0);
            const subtotal = ton * harga;
            const pph = Math.round(subtotal * 0.02);
            const fallbackTotalBayar = subtotal - pph;

            return {
              id: i.id,
              type: "Income",
              tanggal: i.tanggal,
              total: hasTotalBayar ? tb : Number(fallbackTotalBayar || 0),
              nama: i.nama_pelanggan || "",
            };
          }
        );

        // Format Expense dari InvoiceListLayer.jsx
        const expenseList = (Array.isArray(expenses) ? expenses : []).map(
          (e) => ({
            id: e.id,
            type: "Expense",
            tanggal: e.tanggal,
            total: Number(e.total_pengeluaran || 0),
            nama: "-", // expense tidak memiliki nama customer
          })
        );

        if (!active) return;

        setItems([...incomeList, ...expenseList]);
      } finally {
        if (active) setLoading(false);
      }
    })();

    return () => (active = false);
  }, []);

  // === Hitung 30 hari terakhir ===
  const { totalCustomers, totalIncome, totalExpense } = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getTime() - 30 * MS_PER_DAY);

    const last30days = items.filter((item) => {
      const d = parseTanggal(item.tanggal);
      return d && d >= start && d <= now;
    });

    // ==== CUSTOMERS ====
    const incomeOnly = last30days.filter((i) => i.type === "Income");

    // User REQUEST: nama customer kembar tetap dihitung
    const totalCust = incomeOnly.length;

    // ==== TOTAL INCOME ====
    const totalInc = incomeOnly.reduce((sum, i) => sum + (Number(i.total) || 0), 0);

    // ==== TOTAL EXPENSE ====
    const expenseOnly = last30days.filter((i) => i.type === "Expense");
    const totalExp = expenseOnly.reduce((sum, e) => sum + (Number(e.total) || 0), 0);

    return {
      totalCustomers: totalCust,
      totalIncome: totalInc,
      totalExpense: totalExp,
    };
  }, [items]);

  return (
    <>
      <div
        className={`row row-cols-xxxl-3 row-cols-lg-3 row-cols-sm-2 row-cols-1 gy-4 page-in ${
          pageIn ? "is-in" : ""
        }`}
      >
        {/* CUSTOMERS */}
        <div className="col">
          <div className="card shadow-none border bg-gradient-start-1 h-100">
            <div className="card-body p-20">
              <div className="d-flex justify-content-between align-items-center gap-3">
                <div>
                  <p className="fw-medium text-primary-light mb-1">
                    Total Customers
                  </p>
                  <h6 className="mb-0">{loading ? "-" : totalCustomers}</h6>
                </div>
                <div className="w-50-px h-50-px bg-cyan rounded-circle d-flex justify-content-center align-items-center">
                  <Icon
                    icon="gridicons:multiple-users"
                    className="text-white text-2xl"
                  />
                </div>
              </div>
              <p className="fw-medium text-sm text-primary-light mt-12 mb-0">
                Last 30 days customers
              </p>
            </div>
          </div>
        </div>

        {/* INCOME */}
        <div className="col">
          <div className="card shadow-none border bg-gradient-start-4 h-100">
            <div className="card-body p-20">
              <div className="d-flex justify-content-between align-items-center gap-3">
                <div>
                  <p className="fw-medium text-primary-light mb-1">Total Income</p>
                  <h6 className="mb-0">
                    {loading ? "-" : formatRupiah(totalIncome)}
                  </h6>
                </div>
                <div className="w-50-px h-50-px bg-success-main rounded-circle d-flex justify-content-center align-items-center">
                  <Icon icon="solar:wallet-bold" className="text-white text-2xl" />
                </div>
              </div>
              <p className="fw-medium text-sm text-primary-light mt-12 mb-0">
                Last 30 days income
              </p>
            </div>
          </div>
        </div>

        {/* EXPENSE */}
        <div className="col">
          <div className="card shadow-none border bg-gradient-start-5 h-100">
            <div className="card-body p-20">
              <div className="d-flex justify-content-between align-items-center gap-3">
                <div>
                  <p className="fw-medium text-primary-light mb-1">
                    Total Expense
                  </p>
                  <h6 className="mb-0">
                    {loading ? "-" : formatRupiah(totalExpense)}
                  </h6>
                </div>
                <div className="w-50-px h-50-px bg-red rounded-circle d-flex justify-content-center align-items-center">
                  <Icon
                    icon="fa6-solid:file-invoice-dollar"
                    className="text-white text-2xl"
                  />
                </div>
              </div>
              <p className="fw-medium text-sm text-primary-light mt-12 mb-0">
                Last 30 days expense
              </p>
            </div>
          </div>
        </div>
      </div>

      <style jsx>{`
        .page-in {
          opacity: 0;
          transform: translateY(10px);
          transition: opacity 450ms ease, transform 450ms ease;
          will-change: opacity, transform;
        }
        .page-in.is-in {
          opacity: 1;
          transform: translateY(0);
        }
        @media (prefers-reduced-motion: reduce) {
          .page-in,
          .page-in.is-in {
            transition: none !important;
            transform: none !important;
            opacity: 1 !important;
          }
        }
      `}</style>
    </>
  );
};

export default UnitCountOne;

"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

/**
 * ✅ PARSE tanggal menjadi Date UTC supaya tidak geser tahun
 * Support:
 * - ISO: 2025-12-31T17:00:00Z
 * - yyyy-mm-dd
 * - dd-mm-yyyy
 */
const parseTanggalUTC = (str) => {
  if (!str) return null;
  const s = String(str).trim();

  // ISO DateTime
  if (s.includes("T")) {
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  }

  // dd-mm-yyyy
  if (/^\d{2}-\d{2}-\d{4}$/.test(s)) {
    const [dd, mm, yyyy] = s.split("-");
    const d = new Date(`${yyyy}-${mm}-${dd}T00:00:00Z`);
    return isNaN(d.getTime()) ? null : d;
  }

  // yyyy-mm-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) {
    const d = new Date(`${s}T00:00:00Z`); // ✅ pakai Z biar UTC
    return isNaN(d.getTime()) ? null : d;
  }

  return null;
};

const IncomeVsExpense = () => {
  // ✅ efek masuk
  const [pageIn, setPageIn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setPageIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const [series, setSeries] = useState([
    { name: "Income", data: [] },
    { name: "Expense", data: [] },
  ]);

  const options = useMemo(() => {
    return {
      chart: { type: "area", toolbar: { show: false }, height: 300 },
      dataLabels: { enabled: false },
      stroke: { curve: "smooth", width: 3 },
      xaxis: {
        categories: [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "Mei",
          "Jun",
          "Jul",
          "Agu",
          "Sep",
          "Okt",
          "Nov",
          "Des",
        ],
        labels: { style: { colors: "#9AA4BF" } },
      },
      yaxis: {
        labels: {
          formatter: (val) => {
            if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(1)}jt`;
            return `Rp ${val}`;
          },
          style: { colors: "#9AA4BF" },
        },
      },
      tooltip: {
        y: { formatter: (val) => `Rp ${val.toLocaleString("id-ID")}` },
      },
      colors: ["#4E79FF", "#FFB300"],
      fill: {
        type: "gradient",
        gradient: { opacityFrom: 0.4, opacityTo: 0 },
      },
      legend: { show: false },
    };
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, expRes] = await Promise.all([
          api.get("/invoices"),
          api.get("/expenses"),
        ]);

        const invoicesRaw = Array.isArray(invRes) ? invRes : [];
        const expensesRaw = Array.isArray(expRes) ? expRes : [];

        const currentYearUTC = new Date().getUTCFullYear(); // ✅ pakai UTC

        const incomeMonthly = Array(12).fill(0);
        const expenseMonthly = Array(12).fill(0);

        invoicesRaw.forEach((i) => {
          const d = parseTanggalUTC(i.tanggal);
          if (!d) return;

          const year = d.getUTCFullYear(); // ✅ pakai UTC
          if (year !== currentYearUTC) return;

          const monthIndex = d.getUTCMonth(); // ✅ pakai UTC
          incomeMonthly[monthIndex] += Number(i.total_biaya || 0);
        });

        expensesRaw.forEach((e) => {
          const d = parseTanggalUTC(e.tanggal);
          if (!d) return;

          const year = d.getUTCFullYear(); // ✅ pakai UTC
          if (year !== currentYearUTC) return;

          const monthIndex = d.getUTCMonth(); // ✅ pakai UTC
          expenseMonthly[monthIndex] += Number(e.total_pengeluaran || 0);
        });

        setSeries([
          { name: "Income", data: incomeMonthly },
          { name: "Expense", data: expenseMonthly },
        ]);
      } catch (error) {
        console.error("Chart Fetch Error:", error);
      }
    };

    load();
  }, []);

  return (
    <>
      <div className={`col-xxl-7 col-xl-12 page-in ${pageIn ? "is-in" : ""}`}>
        <div className="card h-100">
          <div className="card-body p-24 mb-8">
            <div className="d-flex align-items-center flex-wrap gap-2 justify-content-between">
              <h6 className="mb-2 fw-bold text-lg mb-0">Income Vs Expense</h6>
            </div>

            <ul className="d-flex flex-wrap align-items-center justify-content-center my-3 gap-24">
              <li className="d-flex flex-column gap-1">
                <div className="d-flex align-items-center gap-2">
                  <span className="w-8-px h-8-px rounded-pill bg-primary-600" />
                  <span className="text-secondary-light text-lg fw-semibold">
                    Income
                  </span>
                </div>
              </li>

              <li className="d-flex flex-column gap-1">
                <div className="d-flex align-items-center gap-2">
                  <span className="w-8-px h-8-px rounded-pill bg-warning-600" />
                  <span className="text-secondary-light text-lg fw-semibold">
                    Expense
                  </span>
                </div>
              </li>
            </ul>

            <div id="incomeExpense" className="apexcharts-tooltip-style-1">
              <ReactApexChart
                options={options}
                series={series}
                type="area"
                height={278}
                width={"100%"}
              />
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default IncomeVsExpense;

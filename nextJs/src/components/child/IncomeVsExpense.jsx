"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { api } from "@/lib/api";

const ReactApexChart = dynamic(() => import("react-apexcharts"), {
  ssr: false,
});

/** ✅ PARSE tanggal: dd-mm-yyyy | yyyy-mm-dd | ISO | Date object */
const parseTanggal = (value) => {
  if (!value) return null;

  // ✅ kalau sudah Date object
  if (value instanceof Date && !isNaN(value.getTime())) {
    return value;
  }

  const str = String(value).trim();

  // ISO / full datetime
  if (str.includes("T")) {
    const d = str.split("T")[0];
    return new Date(`${d}T00:00:00`);
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

const IncomeVsExpense = () => {
  const [pageIn, setPageIn] = useState(false);
  useEffect(() => {
    const t = requestAnimationFrame(() => setPageIn(true));
    return () => cancelAnimationFrame(t);
  }, []);

  const [series, setSeries] = useState([
    { name: "Income", data: [] },
    { name: "Expense", data: [] },
  ]);

  const options = useMemo(
    () => ({
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
            return `Rp ${val.toLocaleString("id-ID")}`;
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
    }),
    []
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [invRes, expRes] = await Promise.all([
          api.get("/invoices"),
          api.get("/expenses"),
        ]);

        // ✅ FIX: handle response axios
        const invoicesRaw = Array.isArray(invRes?.data)
          ? invRes.data
          : Array.isArray(invRes)
          ? invRes
          : [];

        const expensesRaw = Array.isArray(expRes?.data)
          ? expRes.data
          : Array.isArray(expRes)
          ? expRes
          : [];

        // ✅ Debug optional (hapus kalau sudah aman)
        console.log("Invoices Raw:", invoicesRaw);
        console.log("Expenses Raw:", expensesRaw);

        const incomeList = invoicesRaw.map((i) => ({
          type: "Income",
          tanggal: i.tanggal,
          total: Number(i.total_biaya || 0),
        }));

        const expenseList = expensesRaw.map((e) => ({
          type: "Expense",
          tanggal: e.tanggal,
          total: Number(e.total_pengeluaran || 0),
        }));

        const combined = [...incomeList, ...expenseList];

        const currentYear = new Date().getFullYear(); // ✅ otomatis ikut tahun sekarang (2026)

        const incomeMonthly = Array(12).fill(0);
        const expenseMonthly = Array(12).fill(0);

        combined.forEach((item) => {
          const d = parseTanggal(item.tanggal);
          if (!d) return;

          if (d.getFullYear() !== currentYear) return;

          const monthIndex = d.getMonth();
          if (isNaN(monthIndex)) return;

          if (item.type === "Income") {
            incomeMonthly[monthIndex] += item.total;
          } else {
            expenseMonthly[monthIndex] += item.total;
          }
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

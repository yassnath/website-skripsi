"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

export default function FirstRowAmount() {
  const [total, setTotal] = useState(0);
  useEffect(() => {
    api.get("/api/invoices/first-row-amount").then(d => setTotal(Number(d.total_biaya || 0)));
  }, []);
  return <span>{total.toLocaleString("id-ID")}</span>;
}

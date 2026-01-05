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

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([defaultGreeting]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);
  const usageCacheRef = useRef({ data: null, fetchedAt: 0 });

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

  const buildArmadaUsageReply = async (text) => {
    const lower = text.toLowerCase();
    const hasArmada =
      lower.includes("armada") ||
      lower.includes("truk") ||
      lower.includes("truck") ||
      lower.includes("fleet");

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

    const isUsageQuery =
      hasArmada && usageKeywords.some((keyword) => lower.includes(keyword));
    const isCountQuery =
      hasArmada &&
      (lower.includes("berapa kali") || lower.includes("berapa x"));
    const isTopQuery =
      hasArmada &&
      (lower.includes("paling banyak") ||
        lower.includes("paling sering") ||
        lower.includes("terbanyak") ||
        lower.includes("tersering") ||
        lower.includes("top"));

    if (!isUsageQuery && !isCountQuery && !isTopQuery) return null;

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
        setMessages((prev) => [...prev, { role: "assistant", content: localReply }]);
        return;
      }

      const res = await api.post("/chat", {
        message: text,
        history,
      });

      const reply =
        res?.reply ||
        "Maaf, AI belum bisa memberikan jawaban. Coba ulangi lagi.";

      setMessages((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (err) {
      const fallback =
        err?.message ||
        "Maaf, ada kendala saat menghubungi AI. Coba beberapa saat lagi.";
      setMessages((prev) => [...prev, { role: "assistant", content: fallback }]);
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

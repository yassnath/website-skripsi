"use client";

import React, { useEffect, useRef, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { api } from "@/lib/api";

const defaultGreeting = {
  role: "assistant",
  content:
    "Halo! Saya Asisten CV ANT. Saya bisa bantu info invoice, expense, armada, dan laporan. Tanyakan apa saja ya.",
};

const ChatbotWidget = () => {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([defaultGreeting]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endRef = useRef(null);

  useEffect(() => {
    if (!open) return;
    endRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [open, messages, loading]);

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
              <div className="cvant-chatbot__subtitle">Cerebras AI</div>
            </div>
            <button
              type="button"
              className="cvant-chatbot__clear"
              onClick={clearChat}
            >
              Reset
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

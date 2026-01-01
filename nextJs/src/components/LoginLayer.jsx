"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Icon } from "@iconify/react/dist/iconify.js";
import Link from "next/link";
import { api } from "@/lib/api";

const LoginLayer = () => {
  const router = useRouter();
  const [form, setForm] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const [popup, setPopup] = useState({
    show: false,
    type: "success",
    message: "",
  });

  useEffect(() => {
    const originalBody = document.body.style.overflow;
    const originalHtml = document.documentElement.style.overflow;

    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalBody;
      document.documentElement.style.overflow = originalHtml;
    };
  }, []);

  const onChange = (field) => (e) => {
    setPopup((p) => ({ ...p, show: false }));
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
  };

  const showPopup = (type, message, autoCloseMs = 0) => {
    setPopup({ show: true, type, message });

    if (showPopup._t) window.clearTimeout(showPopup._t);

    if (autoCloseMs > 0) {
      showPopup._t = window.setTimeout(() => {
        setPopup((p) => ({ ...p, show: false }));
      }, autoCloseMs);
    }
  };

  const sanitizeLoginError = (rawMsg) => {
    const msg = (rawMsg || "").toLowerCase();

    if (
      msg.includes("username") &&
      msg.includes("password") &&
      msg.includes("tidak sesuai")
    ) {
      return "Login failed. Please check your username and password!";
    }

    return rawMsg || "Login failed. Please check your username and password!";
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setPopup((p) => ({ ...p, show: false }));

    const u = (form.username || "").trim();
    const p = (form.password || "").trim();

    if (!u && !p) {
      showPopup("danger", "Please enter username & password first!", 0);
      return;
    }
    if (!u) {
      showPopup("danger", "Username is still empty, please fill it first!", 0);
      return;
    }
    if (!p) {
      showPopup("danger", "Password is still empty, please fill it first!", 0);
      return;
    }

    setLoading(true);

    try {
      // ✅ LOGIN KE API
      const res = await api.post("/login", {
        username: u,
        password: p,
      });

      const { token, user } = res || {};

      if (!token || !user) {
        throw new Error("Login failed. Please check your username and password!");
      }

      // ✅ SIMPAN KE LOCALSTORAGE
      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role || "");
      localStorage.setItem("username", user.username || "");

      /**
       * ✅ SET COOKIE untuk Middleware Next.js
       * - Pakai max-age supaya cookie tetap ada
       * - Secure hanya untuk https
       */
      const isHttps = window.location.protocol === "https:";
      document.cookie = [
        `token=${token}`,
        "path=/",
        "SameSite=Lax",
        "max-age=86400", // 1 hari
        isHttps ? "Secure" : "",
      ]
        .filter(Boolean)
        .join("; ");

      // ✅ FEEDBACK CEPAT (tidak perlu 5 detik)
      showPopup("success", "Login successful! Redirecting to dashboard...", 3000);

      // ✅ PENTING: router.replace + refresh supaya state langsung kebaca
      setTimeout(() => {
        router.replace("/"); // atau "/dashboard"
        router.refresh();    // ✅ biar middleware + page reload state auth
      }, 1000);

    } catch (e2) {
      const msg = sanitizeLoginError(
        e2?.message || "Login failed. Please check your username and password!"
      );
      showPopup("danger", msg, 0);
    } finally {
      setLoading(false);
    }
  };

  const popupAccent = popup.type === "success" ? "#22c55e" : "#ef4444";

  return (
    <>
      {/* ✅ FUTURISTIC UI (GLOBAL) */}
      <style jsx global>{`
        :root {
          --cv-bg: #0f1623;
          --cv-panel: #1b2431;
          --cv-panel2: #273142;
          --cv-text: #e5e7eb;
          --cv-muted: #94a3b8;

          --cv-blue: #5b8cff;
          --cv-purple: #a855f7;
          --cv-cyan: #22d3ee;

          --cv-glow: rgba(91, 140, 255, 0.22);
          --cv-glow2: rgba(168, 85, 247, 0.16);
          --cv-glow3: rgba(34, 211, 238, 0.12);
        }

        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        .cvant-animate-in {
          opacity: 0;
          transform: translateY(14px);
          animation: cvantFadeUp 0.75s ease forwards;
        }

        .cvant-animate-left {
          opacity: 0;
          transform: translateX(-18px);
          animation: cvantFadeLeft 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)
            forwards;
        }

        .cvant-animate-right {
          opacity: 0;
          transform: translateX(18px);
          animation: cvantFadeRight 0.9s cubic-bezier(0.2, 0.8, 0.2, 1)
            forwards;
        }

        .cvant-delay-1 {
          animation-delay: 0.06s;
        }
        .cvant-delay-2 {
          animation-delay: 0.12s;
        }
        .cvant-delay-3 {
          animation-delay: 0.18s;
        }
        .cvant-delay-4 {
          animation-delay: 0.24s;
        }
        .cvant-delay-5 {
          animation-delay: 0.3s;
        }
        .cvant-delay-6 {
          animation-delay: 0.36s;
        }
        .cvant-delay-7 {
          animation-delay: 0.42s;
        }
        .cvant-delay-8 {
          animation-delay: 0.48s;
        }

        @keyframes cvantFadeUp {
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes cvantFadeLeft {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes cvantFadeRight {
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes cvantPopupIn {
          from {
            opacity: 0;
            transform: scale(0.985) translateY(10px);
            filter: blur(0.5px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
            filter: blur(0px);
          }
        }
        .cvant-popup-panel {
          animation: cvantPopupIn 0.22s ease-out forwards;
        }

        .cvant-btn-pop {
          transition: transform 0.12s ease, filter 0.12s ease,
            box-shadow 0.2s ease;
        }
        .cvant-btn-pop:active {
          transform: translateY(1px) scale(0.99);
        }
        .cvant-btn-pop:hover {
          filter: brightness(1.05);
          box-shadow: 0 10px 24px rgba(0, 0, 0, 0.25);
        }

        .cvant-focus-ring:focus {
          box-shadow: 0 0 0 3px rgba(91, 140, 255, 0.25) !important;
          border-color: rgba(91, 140, 255, 0.75) !important;
        }

        .cvant-auth-bg {
          position: relative;
          overflow: hidden;
          background: radial-gradient(
              1200px 600px at 20% 20%,
              rgba(91, 140, 255, 0.18),
              transparent 55%
            ),
            radial-gradient(
              900px 520px at 85% 30%,
              rgba(168, 85, 247, 0.14),
              transparent 55%
            ),
            radial-gradient(
              700px 520px at 60% 90%,
              rgba(34, 211, 238, 0.1),
              transparent 55%
            ),
            linear-gradient(180deg, #0f1623 0%, #0b1220 100%);
        }

        .cvant-blob {
          position: absolute;
          border-radius: 999px;
          filter: blur(18px);
          opacity: 0.9;
          animation: cvantFloat 10s ease-in-out infinite;
          pointer-events: none;
          mix-blend-mode: screen;
        }

        .cvant-blob.b1 {
          width: 320px;
          height: 320px;
          left: -90px;
          top: 80px;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(91, 140, 255, 0.9),
            transparent 60%
          );
          animation-duration: 12s;
        }

        .cvant-blob.b2 {
          width: 360px;
          height: 360px;
          right: -120px;
          top: 140px;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(168, 85, 247, 0.85),
            transparent 60%
          );
          animation-duration: 14s;
        }

        .cvant-blob.b3 {
          width: 260px;
          height: 260px;
          left: 35%;
          bottom: -90px;
          background: radial-gradient(
            circle at 30% 30%,
            rgba(34, 211, 238, 0.8),
            transparent 60%
          );
          animation-duration: 16s;
        }

        @keyframes cvantFloat {
          0% {
            transform: translate3d(0, 0, 0) scale(1);
          }
          50% {
            transform: translate3d(0, -22px, 0) scale(1.03);
          }
          100% {
            transform: translate3d(0, 0, 0) scale(1);
          }
        }

        .cvant-glass {
          background: linear-gradient(
            180deg,
            rgba(39, 49, 66, 0.78) 0%,
            rgba(27, 36, 49, 0.72) 100%
          );
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 25px 60px rgba(0, 0, 0, 0.45);
          backdrop-filter: blur(10px);
          -webkit-backdrop-filter: blur(10px);
          border-radius: 18px;
          position: relative;
          overflow: hidden;
        }

        .cvant-glass::before {
          content: "";
          position: absolute;
          inset: -2px;
          background: radial-gradient(
              900px 120px at 20% 0%,
              rgba(91, 140, 255, 0.18),
              transparent 55%
            ),
            radial-gradient(
              900px 120px at 80% 0%,
              rgba(168, 85, 247, 0.16),
              transparent 55%
            );
          pointer-events: none;
        }

        .cvant-left-panel {
          position: relative;
        }
        .cvant-left-panel::after {
          content: "";
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            rgba(15, 22, 35, 0.55) 0%,
            rgba(15, 22, 35, 0.1) 70%,
            transparent 100%
          );
          pointer-events: none;
        }
      `}</style>

      {/* POPUP */}
      {popup.show && (
        <div
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center"
          style={{
            zIndex: 9999,
            background: "rgba(0,0,0,0.55)",
            padding: "16px",
          }}
          onClick={() => setPopup((p) => ({ ...p, show: false }))}
        >
          <div
            className="radius-12 shadow-sm p-24 cvant-popup-panel"
            style={{
              width: "100%",
              maxWidth: "600px",
              backgroundColor: "#1b2431",
              border: `2px solid ${popupAccent}`,
              boxShadow: "0 22px 55px rgba(0,0,0,0.55)",
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="d-flex align-items-start justify-content-between gap-2">
              <div className="d-flex align-items-start gap-12">
                <span style={{ marginTop: "2px" }}>
                  <Icon
                    icon={
                      popup.type === "success"
                        ? "solar:check-circle-linear"
                        : "solar:danger-triangle-linear"
                    }
                    style={{
                      fontSize: "28px",
                      color: popupAccent,
                    }}
                  />
                </span>

                <div>
                  <h5 className="mb-8 fw-bold" style={{ color: "#ffffff" }}>
                    {popup.type === "success" ? "Login Success" : "Login Failed"}
                  </h5>
                  <p
                    className="mb-0"
                    style={{ color: "#cbd5e1", fontSize: "15px" }}
                  >
                    {popup.message}
                  </p>
                </div>
              </div>

              <button
                type="button"
                className="btn p-0 cvant-btn-pop"
                aria-label="Close"
                onClick={() => setPopup((p) => ({ ...p, show: false }))}
                style={{
                  border: "none",
                  background: "transparent",
                  lineHeight: 1,
                }}
              >
                <Icon
                  icon="solar:close-circle-linear"
                  style={{ fontSize: 24, color: "#94a3b8" }}
                />
              </button>
            </div>

            <div className="d-flex justify-content-end mt-20">
              <button
                type="button"
                className={`btn btn-${
                  popup.type === "success" ? "primary" : "danger"
                } radius-12 px-16 cvant-btn-pop`}
                onClick={() => setPopup((p) => ({ ...p, show: false }))}
                style={{
                  border: `2px solid ${popupAccent}`,
                }}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PAGE */}
      <section
        className="auth bg-base d-flex flex-wrap cvant-auth-bg"
        style={{ height: "100vh" }}
      >
        <div className="cvant-blob b1" />
        <div className="cvant-blob b2" />
        <div className="cvant-blob b3" />

        <div
          className="auth-left d-lg-block d-none cvant-animate-left cvant-left-panel"
          style={{ height: "100%" }}
        >
          <div className="d-flex align-items-center flex-column h-100 justify-content-center">
            <img
              src="/assets/images/big-icon.webp"
              alt=""
              style={{
                filter: "drop-shadow(0 18px 24px rgba(0,0,0,0.35))",
              }}
            />
          </div>
        </div>

        <div
          className="auth-right py-32 px-24 d-flex flex-column justify-content-center cvant-animate-right"
          style={{ backgroundColor: "transparent", height: "100%" }}
        >
          <div
            className="max-w-464-px mx-auto w-100 cvant-glass"
            style={{ padding: "28px" }}
          >
            <div>
              <Link
                href="/"
                className="mb-24 max-w-290-px d-inline-block cvant-animate-in cvant-delay-1"
              >
                <img
                  src="/assets/images/logo.webp"
                  alt=""
                  style={{
                    filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.35))",
                  }}
                />
              </Link>

              <h4 className="mb-10 text-white cvant-animate-in cvant-delay-2">
                Login to your Account
              </h4>
              <p className="mb-26 text-neutral-500 text-lg cvant-animate-in cvant-delay-3">
                Welcome back! please enter your username and password
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="icon-field mb-16 cvant-animate-in cvant-delay-4">
                <span className="icon top-50 translate-middle-y">
                  <Icon icon="solar:user-linear" />
                </span>
                <input
                  type="text"
                  className="form-control h-56-px bg-neutral-50 radius-12 cvant-focus-ring"
                  placeholder="Username"
                  value={form.username}
                  onChange={onChange("username")}
                  autoComplete="username"
                />
              </div>

              <div className="position-relative mb-18 cvant-animate-in cvant-delay-5">
                <div className="icon-field">
                  <span className="icon top-50 translate-middle-y">
                    <Icon icon="solar:lock-password-outline" />
                  </span>

                  <input
                    type={showPassword ? "text" : "password"}
                    className="form-control h-56-px bg-neutral-50 radius-12 cvant-focus-ring"
                    id="your-password"
                    placeholder="Password"
                    value={form.password}
                    onChange={onChange("password")}
                    autoComplete="current-password"
                    style={{ paddingRight: "44px" }}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                    className="btn p-0 position-absolute top-50 translate-middle-y cvant-btn-pop"
                    style={{
                      right: "14px",
                      border: "none",
                      background: "transparent",
                      lineHeight: 1,
                    }}
                  >
                    <Icon
                      icon={
                        showPassword
                          ? "solar:eye-closed-linear"
                          : "solar:eye-linear"
                      }
                      style={{ fontSize: "20px", color: "#6b7280" }}
                    />
                  </button>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-5 cvant-animate-in cvant-delay-6 cvant-btn-pop"
                disabled={loading}
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(91,140,255,0.35), 0 18px 36px rgba(0,0,0,0.35), 0 0 18px rgba(91,140,255,0.14)",
                }}
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="mt-3 text-center text-m cvant-animate-in cvant-delay-7">
                <p className="mb-0 text-neutral-400">
                  Forgot Password?{" "}
                  <Link
                    href="https://wa.me//+6285771753354"
                    className="text-primary-600 fw-semibold"
                  >
                    Click here!
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </section>
    </>
  );
};

export default LoginLayer;

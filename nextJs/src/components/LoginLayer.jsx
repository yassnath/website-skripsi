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
      const res = await api.post("/login", {
        username: u,
        password: p,
      });

      const { token, user } = res || {};

      if (!token || !user) {
        throw new Error("Login failed. Please check your username and password!");
      }

      localStorage.setItem("token", token);
      localStorage.setItem("user", JSON.stringify(user));
      localStorage.setItem("role", user.role || "");
      localStorage.setItem("username", user.username || "");

      const isHttps = window.location.protocol === "https:";
      document.cookie = [
        `token=${token}`,
        "path=/",
        "SameSite=Lax",
        "max-age=86400",
        isHttps ? "Secure" : "",
      ]
        .filter(Boolean)
        .join("; ");

      showPopup("success", "Login successful! Redirecting to dashboard...", 3000);

      setTimeout(() => {
        router.replace("/");
        router.refresh();
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
        }

        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ==============================
           ✅ CENTER HEADER + GLOW
           ============================== */

        .cvant-header-center {
          width: 100% !important;
          text-align: center !important;
        }

        .cvant-logo-wrap {
          width: 100% !important;
          display: flex !important;
          justify-content: center !important;
        }

        .cvant-logo-glow {
          filter: drop-shadow(0 10px 14px rgba(0, 0, 0, 0.35))
            drop-shadow(0 0 18px rgba(91, 140, 255, 0.2))
            drop-shadow(0 0 12px rgba(168, 85, 247, 0.16));
        }

        .cvant-title-glow {
          text-shadow: 0 0 18px rgba(91, 140, 255, 0.18),
            0 0 10px rgba(168, 85, 247, 0.14);
        }

        /* ==============================
           ✅ INPUT ICON CENTER FIX
           ============================== */

        .cvant-field {
          position: relative !important;
          width: 100% !important;
        }

        .cvant-icon-wrap {
          position: absolute !important;
          left: 16px !important;
          top: 0 !important;
          height: 56px !important;
          width: 28px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          z-index: 5 !important;
          pointer-events: none !important;
        }

        .cvant-input {
          height: 56px !important;
          padding-left: 52px !important;
        }

        .cvant-input::placeholder {
          color: rgba(100, 116, 139, 0.95) !important;
          opacity: 1 !important;
        }

        .cvant-eye-btn {
          position: absolute !important;
          right: 10px !important;
          top: 0 !important;
          height: 56px !important;
          width: 44px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border: none !important;
          background: transparent !important;
          padding: 0 !important;
          z-index: 6 !important;
        }

        /* ==============================
           ✅ FUTURISTIC BG + GLASS PANEL
           + PARTICLE STARFIELD
           ============================== */

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

        /* ⭐ STARFIELD LAYER */
        .cvant-auth-bg::before {
          content: "";
          position: absolute;
          inset: 0;
          pointer-events: none;
          background:
            radial-gradient(1px 1px at 10% 20%, rgba(255,255,255,0.35), transparent 55%),
            radial-gradient(1px 1px at 35% 12%, rgba(255,255,255,0.26), transparent 55%),
            radial-gradient(1px 1px at 65% 18%, rgba(255,255,255,0.2), transparent 55%),
            radial-gradient(1px 1px at 90% 30%, rgba(255,255,255,0.25), transparent 55%),
            radial-gradient(1px 1px at 15% 55%, rgba(255,255,255,0.18), transparent 55%),
            radial-gradient(1px 1px at 40% 70%, rgba(255,255,255,0.18), transparent 55%),
            radial-gradient(1px 1px at 75% 72%, rgba(255,255,255,0.22), transparent 55%),
            radial-gradient(1px 1px at 88% 88%, rgba(255,255,255,0.14), transparent 55%),
            radial-gradient(1px 1px at 22% 88%, rgba(255,255,255,0.18), transparent 55%),
            radial-gradient(2px 2px at 55% 40%, rgba(91,140,255,0.14), transparent 70%),
            radial-gradient(2px 2px at 78% 55%, rgba(168,85,247,0.12), transparent 70%),
            radial-gradient(2px 2px at 28% 35%, rgba(34,211,238,0.10), transparent 70%);
          opacity: 0.85;
          animation: cvantTwinkle 6.5s ease-in-out infinite;
        }

        /* ✨ TWINKLE */
        @keyframes cvantTwinkle {
          0%, 100% { opacity: 0.65; filter: blur(0px); }
          50% { opacity: 0.95; filter: blur(0.2px); }
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

        /* ==============================
           ✅ LOGIN BUTTON NEON GLOW
           ============================== */

        .cvant-login-btn {
          position: relative !important;
          overflow: hidden !important;
          border: none !important;
          background: linear-gradient(
            90deg,
            rgba(91, 140, 255, 1),
            rgba(168, 85, 247, 1)
          ) !important;
          transition: transform 0.15s ease, box-shadow 0.2s ease,
            filter 0.2s ease !important;
          box-shadow: 0 0 0 1px rgba(91, 140, 255, 0.35),
            0 16px 34px rgba(0, 0, 0, 0.4),
            0 0 16px rgba(91, 140, 255, 0.2) !important;
        }

        .cvant-login-btn::before {
          content: "";
          position: absolute;
          inset: -2px;
          background: radial-gradient(
              400px 140px at 20% 30%,
              rgba(255, 255, 255, 0.22),
              transparent 60%
            ),
            radial-gradient(
              500px 160px at 80% 60%,
              rgba(34, 211, 238, 0.18),
              transparent 62%
            );
          opacity: 0.7;
          transition: opacity 0.25s ease;
          pointer-events: none;
        }

        .cvant-login-btn:hover {
          filter: brightness(1.04);
          box-shadow: 0 0 0 1px rgba(168, 85, 247, 0.45),
            0 20px 46px rgba(0, 0, 0, 0.46),
            0 0 22px rgba(91, 140, 255, 0.26),
            0 0 16px rgba(168, 85, 247, 0.18) !important;
          transform: translateY(-1px);
        }

        .cvant-login-btn:hover::before {
          opacity: 1;
        }

        .cvant-login-btn:active {
          transform: translateY(0px) scale(0.99);
        }

        /* ==============================
           ✅ LEFT BIG ICON (DESKTOP) AURA BOOST
           ============================== */

        .cvant-big-icon-wrap {
          position: relative;
          display: inline-block;
          padding: 34px;
        }

        /* OUTER AURA BLOOM */
        .cvant-big-icon-wrap::before {
          content: "";
          position: absolute;
          inset: -12%;
          border-radius: 999px;
          background: radial-gradient(
              circle at 30% 30%,
              rgba(91, 140, 255, 0.18),
              transparent 60%
            ),
            radial-gradient(
              circle at 70% 50%,
              rgba(168, 85, 247, 0.14),
              transparent 62%
            ),
            radial-gradient(
              circle at 60% 80%,
              rgba(34, 211, 238, 0.12),
              transparent 65%
            );
          filter: blur(10px);
          opacity: 1;
          pointer-events: none;
        }

        /* RING OUTLINE */
        .cvant-big-icon-wrap .cvant-icon-ring {
          position: absolute;
          inset: 6px;
          border-radius: 999px;
          border: 1px solid rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 1px rgba(91, 140, 255, 0.18),
            0 0 18px rgba(91, 140, 255, 0.12),
            0 0 14px rgba(34, 211, 238, 0.10);
          pointer-events: none;
        }

        /* ORBIT GLOW */
        .cvant-big-icon-wrap .cvant-orbit {
          position: absolute;
          inset: -10px;
          border-radius: 999px;
          border: 1px dashed rgba(255, 255, 255, 0.06);
          pointer-events: none;
          animation: cvantOrbitSpin 12s linear infinite;
        }

        .cvant-big-icon-wrap .cvant-orbit::after {
          content: "";
          position: absolute;
          top: 50%;
          left: -6px;
          width: 12px;
          height: 12px;
          border-radius: 999px;
          background: radial-gradient(circle, rgba(34,211,238,0.9), rgba(34,211,238,0));
          box-shadow: 0 0 18px rgba(34,211,238,0.55),
            0 0 12px rgba(91,140,255,0.35);
          transform: translateY(-50%);
        }

        @keyframes cvantOrbitSpin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        .cvant-big-icon {
          position: relative;
          z-index: 2;
          filter: drop-shadow(0 18px 24px rgba(0, 0, 0, 0.35))
            drop-shadow(0 0 18px rgba(34, 211, 238, 0.14))
            drop-shadow(0 0 22px rgba(91, 140, 255, 0.18));
        }

        /* shimmer overlay */
        .cvant-big-icon-wrap::after {
          content: "";
          position: absolute;
          inset: -10%;
          background: linear-gradient(
            120deg,
            transparent 20%,
            rgba(91, 140, 255, 0.16) 45%,
            rgba(34, 211, 238, 0.12) 55%,
            transparent 80%
          );
          transform: translateX(-130%);
          animation: cvantShimmer 6.5s ease-in-out infinite;
          pointer-events: none;
          mix-blend-mode: screen;
          border-radius: 18px;
          z-index: 1;
        }

        @keyframes cvantShimmer {
          0% {
            transform: translateX(-130%);
            opacity: 0.4;
          }
          35% {
            opacity: 0.7;
          }
          60% {
            opacity: 0.55;
          }
          100% {
            transform: translateX(130%);
            opacity: 0.4;
          }
        }

        /* ✅ MOBILE ONLY */
        @media (max-width: 991.98px) {
          .cvant-glass {
            padding: 22px !important;
            border-radius: 16px !important;
          }

          .cvant-mobile-title {
            font-size: 20px !important;
            line-height: 1.25 !important;
            margin-top: 10px !important;
          }

          .cvant-mobile-desc {
            font-size: 14px !important;
            line-height: 1.45 !important;
            margin-bottom: 18px !important;
          }

          .cvant-icon-wrap {
            height: 52px !important;
          }

          .cvant-input {
            height: 52px !important;
          }

          .cvant-eye-btn {
            height: 52px !important;
          }
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
            className="radius-12 shadow-sm p-24"
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
                className="btn p-0"
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
                } radius-12 px-16`}
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
        {/* DESKTOP LEFT */}
        <div className="auth-left d-lg-block d-none" style={{ height: "100%" }}>
          <div className="d-flex align-items-center flex-column h-100 justify-content-center">
            <div className="cvant-big-icon-wrap">
              <div className="cvant-orbit" />
              <div className="cvant-icon-ring" />

              <img
                src="/assets/images/big-icon.webp"
                alt=""
                className="cvant-big-icon"
              />
            </div>
          </div>
        </div>

        {/* RIGHT */}
        <div
          className="auth-right py-32 px-24 d-flex flex-column justify-content-center"
          style={{ backgroundColor: "transparent", height: "100%" }}
        >
          <div
            className="max-w-464-px mx-auto w-100 cvant-glass"
            style={{ padding: "28px" }}
          >
            {/* ✅ HEADER MUST CENTER */}
            <div className="cvant-header-center">
              <div className="cvant-logo-wrap mb-24">
                <Link href="/" className="d-inline-flex">
                  <img
                    src="/assets/images/logo.webp"
                    alt=""
                    className="cvant-logo-glow"
                    style={{ maxWidth: "290px", height: "auto" }}
                  />
                </Link>
              </div>

              <h4 className="mb-10 text-white cvant-mobile-title cvant-title-glow">
                Login to your Account
              </h4>

              <p className="mb-26 text-neutral-500 text-lg cvant-mobile-desc">
                Welcome back! please enter your username and password
              </p>
            </div>

            <form onSubmit={handleSubmit}>
              {/* USERNAME */}
              <div className="cvant-field mb-16">
                <span className="cvant-icon-wrap">
                  <Icon icon="solar:user-linear" fontSize={20} />
                </span>
                <input
                  type="text"
                  className="form-control bg-neutral-50 radius-12 cvant-input"
                  placeholder="Username"
                  value={form.username}
                  onChange={onChange("username")}
                  autoComplete="username"
                />
              </div>

              {/* PASSWORD */}
              <div className="cvant-field mb-18">
                <span className="cvant-icon-wrap">
                  <Icon icon="solar:lock-password-outline" fontSize={20} />
                </span>

                <input
                  type={showPassword ? "text" : "password"}
                  className="form-control bg-neutral-50 radius-12 cvant-input"
                  placeholder="Password"
                  value={form.password}
                  onChange={onChange("password")}
                  autoComplete="current-password"
                  style={{ paddingRight: "58px" }}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  className="cvant-eye-btn"
                >
                  <Icon
                    icon={
                      showPassword
                        ? "solar:eye-closed-linear"
                        : "solar:eye-linear"
                    }
                    fontSize={20}
                    style={{ color: "#6b7280" }}
                  />
                </button>
              </div>

              {/* ✅ LOGIN BUTTON */}
              <button
                type="submit"
                className="btn text-sm btn-sm px-12 py-16 w-100 radius-12 mt-5 cvant-login-btn"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>

              <div className="mt-3 text-center text-m">
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

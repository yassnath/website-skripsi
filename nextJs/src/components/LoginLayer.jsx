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
        }

        * {
          -webkit-font-smoothing: antialiased;
          -moz-osx-font-smoothing: grayscale;
        }

        /* ==============================
           ✅ INPUT ICON HARD CENTER FIX
           ============================== */

        .cvant-field {
          position: relative !important;
          width: 100% !important;
        }

        /* Icon kiri -> true center */
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

        .cvant-icon-wrap svg {
          display: block !important;
        }

        /* Input -> padding kiri fix */
        .cvant-input {
          height: 56px !important;
          padding-left: 52px !important;
        }

        /* Placeholder lebih halus dan cocok dark panel */
        .cvant-input::placeholder {
          color: rgba(100, 116, 139, 0.95) !important;
          opacity: 1 !important;
        }

        /* tombol eye -> true center */
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

        .cvant-eye-btn svg {
          display: block !important;
        }

        /* ==============================
           ✅ FUTURISTIC BG + GLASS PANEL
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

        /* ✅ MOBILE ONLY (rapih, center text) */
        @media (max-width: 991.98px) {
          .cvant-glass {
            padding: 22px !important;
            border-radius: 16px !important;
          }

          .cvant-mobile-center {
            text-align: center !important;
          }

          .cvant-mobile-title {
            font-size: 20px !important;
            line-height: 1.25 !important;
            margin-top: 8px !important;
          }

          .cvant-mobile-desc {
            font-size: 14px !important;
            line-height: 1.4 !important;
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
        <div
          className="auth-left d-lg-block d-none"
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

        {/* RIGHT */}
        <div
          className="auth-right py-32 px-24 d-flex flex-column justify-content-center"
          style={{ backgroundColor: "transparent", height: "100%" }}
        >
          <div
            className="max-w-464-px mx-auto w-100 cvant-glass"
            style={{ padding: "28px" }}
          >
            <div className="cvant-mobile-center">
              <Link href="/" className="mb-24 max-w-290-px d-inline-block">
                <img
                  src="/assets/images/logo.webp"
                  alt=""
                  style={{
                    filter: "drop-shadow(0 10px 14px rgba(0,0,0,0.35))",
                  }}
                />
              </Link>

              <h4 className="mb-10 text-white cvant-mobile-title">
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

              <button
                type="submit"
                className="btn btn-primary text-sm btn-sm px-12 py-16 w-100 radius-12 mt-5"
                disabled={loading}
                style={{
                  boxShadow:
                    "0 0 0 1px rgba(91,140,255,0.35), 0 18px 36px rgba(0,0,0,0.35), 0 0 18px rgba(91,140,255,0.14)",
                }}
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

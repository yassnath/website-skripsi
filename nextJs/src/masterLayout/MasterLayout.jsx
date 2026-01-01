"use client";
import React, { useEffect, useState } from "react";
import { Icon } from "@iconify/react/dist/iconify.js";
import { usePathname } from "next/navigation";
import ThemeToggleButton from "../helper/ThemeToggleButton";
import Link from "next/link";

const MasterLayout = ({ children }) => {
  let pathname = usePathname();
  let [sidebarActive, seSidebarActive] = useState(false);
  let [mobileMenu, setMobileMenu] = useState(false);
  const location = usePathname();
  const [profileName, setProfileName] = useState("User");
  const [profileRole, setProfileRole] = useState("Admin");
  const [profileImage, setProfileImage] = useState("/assets/images/icon.webp");

  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedRole = localStorage.getItem("role");
      const storedUsername = localStorage.getItem("username");

      if (storedRole === "owner") {
        setProfileName("Bezallael Antok");
        setProfileRole("Owner");
        setProfileImage("/assets/images/pp-owner.webp");
      } else if (storedRole === "admin") {
        setProfileName("Andi");
        setProfileRole("Admin");
        setProfileImage("/assets/images/pp-admin.webp");
      } else {
        setProfileName(storedUsername || "User");
        setProfileRole("User");
        setProfileImage("/assets/images/icon.webp");
      }
    }
  }, []);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("role");
      localStorage.removeItem("username");
    }

    document.cookie =
      "token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 UTC; SameSite=Lax;";

    window.location.href = "/login";
  };

  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleDropdownClick = (event) => {
      event.preventDefault();
      const clickedLink = event.currentTarget;
      const clickedDropdown = clickedLink.closest(".dropdown");

      if (!clickedDropdown) return;

      const isActive = clickedDropdown.classList.contains("open");

      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        dropdown.classList.remove("open");
        const submenu = dropdown.querySelector(".sidebar-submenu");
        if (submenu) submenu.style.maxHeight = "0px";
      });

      if (!isActive) {
        clickedDropdown.classList.add("open");
        const submenu = clickedDropdown.querySelector(".sidebar-submenu");
        if (submenu) submenu.style.maxHeight = `${submenu.scrollHeight}px`;
      }
    };

    const dropdownTriggers = document.querySelectorAll(
      ".sidebar-menu .dropdown > a, .sidebar-menu .dropdown > Link"
    );

    dropdownTriggers.forEach((trigger) => {
      trigger.addEventListener("click", handleDropdownClick);
    });

    const openActiveDropdown = () => {
      const allDropdowns = document.querySelectorAll(".sidebar-menu .dropdown");
      allDropdowns.forEach((dropdown) => {
        const submenuLinks = dropdown.querySelectorAll(".sidebar-submenu li a");
        submenuLinks.forEach((link) => {
          if (
            link.getAttribute("href") === location ||
            link.getAttribute("to") === location
          ) {
            dropdown.classList.add("open");
            const submenu = dropdown.querySelector(".sidebar-submenu");
            if (submenu) submenu.style.maxHeight = `${submenu.scrollHeight}px`;
          }
        });
      });
    };

    openActiveDropdown();

    return () => {
      dropdownTriggers.forEach((trigger) => {
        trigger.removeEventListener("click", handleDropdownClick);
      });
    };
  }, [location.pathname]);

  const sidebarControl = () => seSidebarActive(!sidebarActive);
  const mobileMenuControl = () => setMobileMenu(!mobileMenu);

  return (
    <>
      <section className={mobileMenu ? "overlay active" : "overlay "}>
        <aside
          className={
            sidebarActive
              ? "sidebar active "
              : mobileMenu
              ? "sidebar sidebar-open"
              : "sidebar"
          }
        >
          <button
            onClick={mobileMenuControl}
            type="button"
            className="sidebar-close-btn"
          >
            <Icon icon="radix-icons:cross-2" />
          </button>

          <div>
            <Link
              href="/"
              className="sidebar-logo"
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <img
                src="/assets/images/logo.webp"
                alt="site logo"
                className="light-logo"
              />
              <img
                src="/assets/images/logo-light.webp"
                alt="site logo"
                className="dark-logo"
              />
              <img
                src="/assets/images/logo-icon.webp"
                alt="site logo"
                className="logo-icon"
              />
            </Link>
          </div>

          <div className="sidebar-menu-area">
            <ul className="sidebar-menu" id="sidebar-menu">
              <li>
                <Link href="/" className={pathname === "/" ? "active-page" : ""}>
                  <Icon
                    icon="solar:home-smile-angle-outline"
                    className="menu-icon"
                  />
                  <span>Dashboard</span>
                </Link>
              </li>

              <li className="sidebar-menu-group-title">Application</li>

              <li className="dropdown">
                <Link href="#">
                  <Icon icon="hugeicons:invoice-03" className="menu-icon" />
                  <span>Invoice</span>
                </Link>
                <ul className="sidebar-submenu">
                  <li>
                    <Link
                      href="/invoice-list"
                      className={
                        pathname === "/invoice-list" ? "active-page" : ""
                      }
                    >
                      <i className="ri-circle-fill circle-icon text-primary-600 w-auto" />{" "}
                      List
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/invoice-add"
                      className={pathname === "/invoice-add" ? "active-page" : ""}
                    >
                      <i className="ri-circle-fill circle-icon text-info-main w-auto" />{" "}
                      Add Income
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/invoice-expense"
                      className={
                        pathname === "/invoice-expense" ? "active-page" : ""
                      }
                    >
                      <i className="ri-circle-fill circle-icon text-warning-main w-auto" />{" "}
                      Add Expense
                    </Link>
                  </li>
                </ul>
              </li>

              <li style={{ marginTop: "-10px" }}>
                <Link
                  href="/calendar"
                  className={pathname === "/calendar" ? "active-page" : ""}
                >
                  <Icon
                    icon="material-symbols:calendar-month-outline"
                    className="menu-icon"
                  />
                  <span>Calendar</span>
                </Link>
              </li>

              <li className="dropdown">
                <Link href="#">
                  <Icon icon="mdi:truck-outline" className="menu-icon" />
                  <span>Fleet</span>
                </Link>
                <ul className="sidebar-submenu">
                  <li>
                    <Link
                      href="/armada-list"
                      className={
                        pathname === "/armada-list" ? "active-page" : ""
                      }
                    >
                      <i className="ri-circle-fill circle-icon text-primary-600 w-auto" />{" "}
                      List
                    </Link>
                  </li>
                  <li>
                    <Link
                      href="/armada-add"
                      className={pathname === "/armada-add" ? "active-page" : ""}
                    >
                      <i className="ri-circle-fill circle-icon text-warning-main w-auto" />{" "}
                      Add New
                    </Link>
                  </li>
                </ul>
              </li>
            </ul>
          </div>
        </aside>

        <main
          className={sidebarActive ? "dashboard-main active" : "dashboard-main"}
        >
          <div className="navbar-header">
            <div className="row align-items-center justify-content-between">
              <div className="col-auto">
                <div className="d-flex flex-wrap align-items-center gap-4">
                  <button
                    type="button"
                    className="sidebar-toggle"
                    onClick={sidebarControl}
                  >
                    {sidebarActive ? (
                      <Icon
                        icon="iconoir:arrow-right"
                        className="icon text-2xl non-active"
                      />
                    ) : (
                      <Icon
                        icon="heroicons:bars-3-solid"
                        className="icon text-2xl non-active"
                      />
                    )}
                  </button>

                  <button
                    onClick={mobileMenuControl}
                    type="button"
                    className="sidebar-mobile-toggle"
                  >
                    <Icon icon="heroicons:bars-3-solid" className="icon" />
                  </button>

                  <form className="navbar-search">
                    <input type="text" placeholder="Search" />
                    <Icon icon="ion:search-outline" className="icon" />
                  </form>
                </div>
              </div>

              <div className="col-auto">
                <div className="d-flex flex-wrap align-items-center gap-3">
                  <ThemeToggleButton />

                  <div className="dropdown">
                    <button
                      className="d-flex justify-content-center align-items-center rounded-circle"
                      type="button"
                      data-bs-toggle="dropdown"
                    >
                      <img
                        src={profileImage}
                        alt="image_user"
                        className="w-40-px h-40-px object-fit-cover rounded-circle"
                      />
                    </button>

                    <div className="dropdown-menu to-top dropdown-menu-sm">
                      <div className="py-12 px-16 radius-8 bg-primary-50 mb-16 d-flex align-items-center justify-content-between gap-2">
                        <div>
                          <h6 className="text-lg text-primary-light fw-semibold mb-2">
                            {profileName}
                          </h6>
                          <span className="text-secondary-light fw-medium text-sm">
                            {profileRole}
                          </span>
                        </div>

                        <button type="button" className="hover-text-danger">
                          <Icon
                            icon="radix-icons:cross-1"
                            className="icon text-xl"
                          />
                        </button>
                      </div>

                      <ul className="to-top-list">
                        <li>
                          <button
                            className="dropdown-item text-black px-0 py-8 hover-bg-transparent hover-text-danger d-flex align-items-center gap-3"
                            onClick={handleLogout}
                          >
                            <Icon icon="lucide:power" className="icon text-xl" />{" "}
                            Log Out
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="dashboard-main-body">{children}</div>

          <footer className="d-footer">
            <div className="row align-items-center justify-content-between">
              <div className="col-auto">
                <p className="mb-0">© 2025 CV ANT. All Rights Reserved.</p>
              </div>
            </div>
          </footer>
        </main>
      </section>

      {/* ✅ SIDEBAR SPACING + NEON ACTIVE/HOVER */}
      <style jsx global>{`
        /* ==============================
           ✅ SPACING MENU (SAMA SEPERTI PUNYAMU)
           ============================== */
        .sidebar-menu > li:not(.sidebar-menu-group-title) {
          margin-bottom: 8px !important;
        }

        .sidebar-menu-group-title {
          margin: 14px 0 10px !important;
          padding-top: 6px;
        }

        .sidebar-menu > li.dropdown {
          margin-bottom: 10px !important;
        }

        .sidebar-submenu > li {
          margin-bottom: 6px !important;
        }

        .sidebar-submenu > li:last-child {
          margin-bottom: 0 !important;
        }

        .sidebar-menu a,
        .sidebar-submenu a {
          display: flex;
          align-items: center;
          padding-top: 10px !important;
          padding-bottom: 10px !important;
          border-radius: 12px !important;
          position: relative;
          overflow: hidden;
          transition: all 0.2s ease !important;
        }

        .sidebar-menu > li[style*="marginTop: -10px"],
        .sidebar-menu > li[style*="margin-top: -10px"] {
          margin-bottom: 10px !important;
        }

        .sidebar-menu a.active-page,
        .sidebar-submenu a.active-page {
          margin-bottom: 2px !important;
        }

        @media (max-width: 991px) {
          .sidebar-menu > li:not(.sidebar-menu-group-title) {
            margin-bottom: 10px !important;
          }
          .sidebar-submenu > li {
            margin-bottom: 8px !important;
          }
        }

        /* ==============================
           ✅ NEON GRADIENT + GLOW MENU UTAMA
           ============================== */
        .sidebar-menu > li > a::before {
          content: "";
          position: absolute;
          inset: -2px;
          background: linear-gradient(
            90deg,
            rgba(91, 140, 255, 1),
            rgba(168, 85, 247, 1)
          );
          opacity: 0;
          transition: opacity 0.25s ease;
          border-radius: 14px;
          z-index: 0;
        }

        .sidebar-menu > li > a::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
              500px 120px at 20% 30%,
              rgba(255, 255, 255, 0.18),
              transparent 60%
            ),
            radial-gradient(
              600px 160px at 80% 70%,
              rgba(34, 211, 238, 0.16),
              transparent 62%
            );
          opacity: 0;
          transition: opacity 0.25s ease;
          z-index: 0;
          border-radius: 14px;
        }

        .sidebar-menu > li > a:hover::before,
        .sidebar-menu > li > a.active-page::before {
          opacity: 1;
        }

        .sidebar-menu > li > a:hover::after,
        .sidebar-menu > li > a.active-page::after {
          opacity: 1;
        }

        .sidebar-menu > li > a:hover,
        .sidebar-menu > li > a.active-page {
          color: #ffffff !important;
          box-shadow: 0 0 0 1px rgba(91, 140, 255, 0.35),
            0 14px 30px rgba(0, 0, 0, 0.35),
            0 0 18px rgba(91, 140, 255, 0.18),
            0 0 14px rgba(168, 85, 247, 0.14) !important;
          transform: translateY(-1px);
        }

        .sidebar-menu > li > a:hover .menu-icon,
        .sidebar-menu > li > a.active-page .menu-icon {
          color: #ffffff !important;
          filter: drop-shadow(0 0 10px rgba(91, 140, 255, 0.35));
        }

        .sidebar-menu > li > a > * {
          position: relative;
          z-index: 2;
        }

        /* ==============================
           ✅ SUBMENU HOVER ACTIVE (LEBIH SOFT + BEDA WARNA)
           ============================== */

        .sidebar-submenu > li > a::before {
          content: "";
          position: absolute;
          inset: -2px;
          background: linear-gradient(
            90deg,
            rgba(34, 211, 238, 0.85),
            rgba(91, 140, 255, 0.85)
          );
          opacity: 0;
          transition: opacity 0.25s ease;
          border-radius: 12px;
          z-index: 0;
        }

        .sidebar-submenu > li > a::after {
          content: "";
          position: absolute;
          inset: 0;
          background: radial-gradient(
            450px 100px at 20% 40%,
            rgba(255, 255, 255, 0.12),
            transparent 60%
          );
          opacity: 0;
          transition: opacity 0.25s ease;
          z-index: 0;
          border-radius: 12px;
        }

        .sidebar-submenu > li > a:hover::before,
        .sidebar-submenu > li > a.active-page::before {
          opacity: 1;
        }

        .sidebar-submenu > li > a:hover::after,
        .sidebar-submenu > li > a.active-page::after {
          opacity: 1;
        }

        .sidebar-submenu > li > a:hover,
        .sidebar-submenu > li > a.active-page {
          color: #ffffff !important;
          box-shadow: 0 0 0 1px rgba(34, 211, 238, 0.22),
            0 10px 18px rgba(0, 0, 0, 0.22),
            0 0 14px rgba(34, 211, 238, 0.14) !important;
        }

        .sidebar-submenu > li > a > * {
          position: relative;
          z-index: 2;
        }
      `}</style>
    </>
  );
};

export default MasterLayout;

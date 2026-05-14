"use client";

/**
 * Navbar — Primary site navigation.
 *
 * Client Component: requires `usePathname()` for active-link
 * detection, `useState` for mobile menu toggle, and `useEffect`
 * for scroll-responsive shadow.
 *
 * Admin link intentionally omitted (out of scope until Phase 2).
 */

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  FileText,
  Info,
  Mail,
  Menu,
  X,
  LayoutDashboard,
  LogIn,
  UserPlus,
  Settings,
  LogOut,
  ChevronUp,
  ChevronDown,
} from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { logoutAction } from "@/app/actions/auth";
import { LogoutConfirmModal } from "./LogoutConfirmModal";

import { ChpLogo } from "@/components/ui/ChpLogo";

/* ═══════════════════════════════════════════════════════
   Navigation link definitions
   ═══════════════════════════════════════════════════════ */

const NAV_LINKS = [
  { href: "/", label: "Home", icon: Home },
  { href: "/tests", label: "Assessments", icon: FileText },
  { href: "/about", label: "About CHP", icon: Info },
  { href: "/contact", label: "Contact Us", icon: Mail },
] as const;

/* ═══════════════════════════════════════════════════════
   Component
   ═══════════════════════════════════════════════════════ */

export function Navbar({
  isAuthenticated = false,
  variant = "default",
  userName,
  userEmail,
}: {
  isAuthenticated?: boolean;
  variant?: "default" | "dashboard";
  userName?: string | null;
  userEmail?: string | null;
}) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [logoutModalOpen, setLogoutModalOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  /* ── Scroll detection — apply shadow after 20px ── */
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    onScroll(); // initial check
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ── Lock body scroll when mobile menu is open ── */
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileOpen]);

  /* ── Close dropdown on click outside ── */
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const closeMobileMenu = useCallback(() => setMobileOpen(false), []);

  // Compute display name for the dropdown
  const displayLabel = userName || userEmail?.split("@")[0] || "user";
  const displayEmail = userEmail || "";

  /** Check if a nav link is the current active route */
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <header
      className="sticky top-0 z-50 w-full transition-shadow duration-300"
      style={{
        backgroundColor: scrolled ? "rgba(255, 255, 255, 0.94)" : "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(16px)",
        WebkitBackdropFilter: "blur(16px)",
        borderBottom: "1px solid var(--border-subtle, #E2DCF0)",
        boxShadow: scrolled ? "var(--shadow-navbar, 0 1px 12px rgba(107, 92, 160, 0.08))" : "none",
      }}
    >
      <nav className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* ── Brand ── */}
        <Link
          href="/"
          className="flex items-center gap-2.5 transition-opacity hover:opacity-80"
          aria-label="Center for Health Psychology — Home"
        >
          <ChpLogo size={36} />
          <div className="flex flex-col">
            <span
              className="hidden font-heading text-[15px] font-bold leading-tight sm:inline"
              style={{ color: "var(--text-heading, #1A202C)" }}
            >
              Center for Health Psychology
            </span>
            <span
              className="font-heading text-[15px] font-bold leading-tight sm:hidden"
              style={{ color: "var(--text-heading, #1A202C)" }}
            >
              CHP
            </span>
            <span
              className="hidden text-[10px] font-medium tracking-wider sm:inline"
              style={{ color: "var(--text-muted, #718096)" }}
            >
              Digital Assessment Platform
            </span>
          </div>
        </Link>

        {/* ── Desktop Navigation ── */}
        {variant === "default" && (
          <ul className="hidden items-center gap-1 md:flex">
            {NAV_LINKS.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <li key={href}>
                  <Link
                    href={href}
                    aria-current={active ? "page" : undefined}
                    className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200"
                    style={{
                      color: active
                        ? "var(--brand-primary-dark, #6B5CA0)"
                        : "var(--text-body, #4A5568)",
                      backgroundColor: active
                        ? "var(--brand-primary-light, #EDE9F8)"
                        : "transparent",
                      fontWeight: active ? 600 : 500,
                    }}
                  >
                    <Icon size={15} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                    {label}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}

        {/* ── Desktop Auth Items ── */}
        <div className="hidden items-center gap-1 md:flex">
          {isAuthenticated ? (
            <>
              {variant === "default" && (
                <Link
                  href="/dashboard"
                  aria-current={isActive("/dashboard") ? "page" : undefined}
                  className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200"
                  style={{
                    color: isActive("/dashboard")
                      ? "var(--brand-primary-dark, #6B5CA0)"
                      : "var(--text-body, #4A5568)",
                    backgroundColor: isActive("/dashboard")
                      ? "var(--brand-primary-light, #EDE9F8)"
                      : "transparent",
                    fontWeight: isActive("/dashboard") ? 600 : 500,
                  }}
                >
                  <LayoutDashboard
                    size={15}
                    strokeWidth={isActive("/dashboard") ? 2.5 : 2}
                    aria-hidden="true"
                  />
                  Dashboard
                </Link>
              )}
              {variant === "default" && (
                /* Simple logout button for public pages */
                <button
                  type="button"
                  onClick={() => setLogoutModalOpen(true)}
                  className="inline-flex cursor-pointer items-center gap-1.5 rounded-lg border-none bg-transparent px-3 py-2 text-[13px] font-medium transition-all duration-200"
                  style={{ color: "var(--text-body, #4A5568)" }}
                >
                  <LogOut size={15} strokeWidth={2} aria-hidden="true" />
                  Keluar
                </button>
              )}
              {variant === "dashboard" && (
                /* User dropdown for dashboard pages */
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => setUserDropdownOpen((prev) => !prev)}
                    className="inline-flex cursor-pointer items-center gap-2 rounded-lg border-none px-3 py-1.5 transition-all duration-200"
                    style={{
                      backgroundColor: userDropdownOpen
                        ? "var(--brand-primary-light, #EDE9F8)"
                        : "transparent",
                    }}
                    aria-expanded={userDropdownOpen}
                    aria-haspopup="true"
                  >
                    {/* Name + email */}
                    <div className="text-left">
                      <p className="m-0 text-[13px] font-semibold leading-tight text-foreground">
                        {displayLabel}
                      </p>
                      {displayEmail && (
                        <p className="m-0 text-[11px] leading-tight text-muted-foreground">
                          {displayEmail}
                        </p>
                      )}
                    </div>
                    {/* Chevron */}
                    {userDropdownOpen ? (
                      <ChevronUp size={14} className="text-muted-foreground" />
                    ) : (
                      <ChevronDown size={14} className="text-muted-foreground" />
                    )}
                  </button>

                  {/* Dropdown menu */}
                  <AnimatePresence>
                    {userDropdownOpen && (
                      <motion.div
                        initial={{ opacity: 0, y: -4, scale: 0.97 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: -4, scale: 0.97 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 top-full z-50 mt-2 w-52 overflow-hidden rounded-xl border bg-card"
                        style={{
                          borderColor: "var(--border-subtle, #E2DCF0)",
                          boxShadow:
                            "0 8px 30px rgba(107, 92, 160, 0.12), 0 2px 8px rgba(0,0,0,0.06)",
                        }}
                      >
                        <Link
                          href="/dashboard/profile"
                          onClick={() => setUserDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-foreground no-underline transition-colors hover:bg-secondary/50"
                        >
                          <Settings size={16} style={{ color: "var(--brand-primary, #9B8EC4)" }} />
                          Update Profile
                        </Link>
                        <div
                          className="mx-3 h-px"
                          style={{ backgroundColor: "var(--border-subtle, #E2DCF0)" }}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            setUserDropdownOpen(false);
                            setLogoutModalOpen(true);
                          }}
                          className="flex w-full cursor-pointer items-center gap-3 border-none bg-transparent px-4 py-3 text-left text-sm font-medium transition-colors hover:bg-secondary/50"
                          style={{ color: "#E53E3E" }}
                        >
                          <LogOut size={16} />
                          Logout
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200"
                style={{
                  color: "var(--text-body, #4A5568)",
                }}
              >
                <LogIn size={15} strokeWidth={2} aria-hidden="true" />
                Masuk
              </Link>
              <Link
                href="/signup"
                className="inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-semibold text-white transition-all duration-200"
                style={{
                  backgroundColor: "var(--brand-primary, #9B8EC4)",
                  borderRadius: "10px",
                }}
              >
                <UserPlus size={15} strokeWidth={2} aria-hidden="true" />
                Daftar
              </Link>
            </>
          )}
        </div>

        {/* ── Mobile Hamburger ── */}
        <button
          type="button"
          onClick={() => setMobileOpen((prev) => !prev)}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg transition-colors md:hidden"
          style={{
            color: "var(--text-body, #4A5568)",
            backgroundColor: mobileOpen ? "var(--brand-primary-light, #EDE9F8)" : "transparent",
          }}
          aria-expanded={mobileOpen}
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
        >
          {mobileOpen ? <X size={20} aria-hidden="true" /> : <Menu size={20} aria-hidden="true" />}
        </button>
      </nav>

      {/* ── Mobile Menu (AnimatePresence drawer) ── */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
            className="overflow-hidden md:hidden"
            style={{
              borderTop: "1px solid var(--border-subtle, #E2DCF0)",
              backgroundColor: "rgba(255, 255, 255, 0.98)",
            }}
          >
            {variant === "default" && (
              <ul className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
                {NAV_LINKS.map(({ href, label, icon: Icon }) => {
                  const active = isActive(href);
                  return (
                    <li key={href}>
                      <Link
                        href={href}
                        onClick={closeMobileMenu}
                        aria-current={active ? "page" : undefined}
                        className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all"
                        style={{
                          color: active
                            ? "var(--brand-primary-dark, #6B5CA0)"
                            : "var(--text-body, #4A5568)",
                          backgroundColor: active
                            ? "var(--brand-primary-light, #EDE9F8)"
                            : "transparent",
                          fontWeight: active ? 600 : 500,
                        }}
                      >
                        <Icon size={18} strokeWidth={active ? 2.5 : 2} aria-hidden="true" />
                        {label}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}

            {/* ── Mobile Auth Items ── */}
            <div
              className="border-t px-4 py-3"
              style={{ borderColor: "var(--border-subtle, #E2DCF0)" }}
            >
              {isAuthenticated ? (
                <div className="flex flex-col gap-1">
                  {variant === "default" && (
                    <Link
                      href="/dashboard"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all"
                      style={{
                        color: isActive("/dashboard")
                          ? "var(--brand-primary-dark, #6B5CA0)"
                          : "var(--text-body, #4A5568)",
                        backgroundColor: isActive("/dashboard")
                          ? "var(--brand-primary-light, #EDE9F8)"
                          : "transparent",
                        fontWeight: isActive("/dashboard") ? 600 : 500,
                      }}
                    >
                      <LayoutDashboard
                        size={18}
                        strokeWidth={isActive("/dashboard") ? 2.5 : 2}
                        aria-hidden="true"
                      />
                      Dashboard
                    </Link>
                  )}
                  {/* Update Profile — dashboard only */}
                  {variant === "dashboard" && (
                    <Link
                      href="/dashboard/profile"
                      onClick={closeMobileMenu}
                      className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium text-foreground no-underline transition-all"
                    >
                      <Settings size={18} style={{ color: "var(--brand-primary, #9B8EC4)" }} />
                      Update Profile
                    </Link>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      closeMobileMenu();
                      setLogoutModalOpen(true);
                    }}
                    className="flex w-full cursor-pointer items-center gap-3 rounded-lg border-none bg-transparent px-3 py-3 text-left text-sm font-medium transition-all"
                    style={{ color: "#E53E3E" }}
                  >
                    <LogOut size={18} />
                    Logout
                  </button>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  <Link
                    href="/login"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-medium transition-all"
                    style={{ color: "var(--text-body, #4A5568)" }}
                  >
                    <LogIn size={18} strokeWidth={2} aria-hidden="true" />
                    Masuk
                  </Link>
                  <Link
                    href="/signup"
                    onClick={closeMobileMenu}
                    className="flex items-center gap-3 rounded-lg px-3 py-3 text-sm font-semibold transition-all"
                    style={{
                      color: "var(--brand-primary-dark, #6B5CA0)",
                      backgroundColor: "var(--brand-primary-light, #EDE9F8)",
                    }}
                  >
                    <UserPlus size={18} strokeWidth={2} aria-hidden="true" />
                    Daftar
                  </Link>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <LogoutConfirmModal
        isOpen={logoutModalOpen}
        onClose={() => setLogoutModalOpen(false)}
        onConfirm={async () => {
          await logoutAction();
        }}
      />
    </header>
  );
}

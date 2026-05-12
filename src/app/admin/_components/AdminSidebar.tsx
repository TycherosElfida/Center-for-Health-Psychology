"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { useState, useRef, useEffect } from "react";
import {
  LayoutDashboard,
  ClipboardList,
  BarChart2,
  LogOut,
  ShieldCheck,
  ChevronDown,
  FileBarChart,
  Monitor,
  Send,
  BookOpen,
  History,
  UserCog,
  User,
  Home,
} from "lucide-react";

const TEAL = "#9B8EC4";
const TEAL_DARK = "#6B5CA0";
const WHITE = "#FFFFFF";
const DARK_TEXT = "#1A202C";
const MID_TEXT = "#4A5568";
const BORDER_LIGHT = "#E2DCF0";
const SIDEBAR_BG = "#1E1830";

/* ── Top-level nav items (non-results) ── */
const topNav = [{ icon: LayoutDashboard, label: "Dashboard", path: "/admin/dashboard" }];

/* ── Results dropdown children ── */
const resultsChildren = [
  {
    icon: ClipboardList,
    label: "SRQ-29 Results",
    path: "/admin/results?tab=srq29",
  },
  {
    icon: BarChart2,
    label: "PSS-10 Results",
    path: "/admin/results?tab=pss10",
  },
  {
    icon: Monitor,
    label: "GPIUS-2 Results",
    path: "/admin/results?tab=gpius2",
  },
  {
    icon: ShieldCheck,
    label: "SRS Results",
    path: "/admin/results?tab=srs",
  },
];

/* ── Bottom management nav items ── */
const managementNav = [
  {
    icon: BookOpen,
    label: "Assessments",
    path: "/admin/assessments",
  },
  {
    icon: Send,
    label: "Report Requests",
    path: "/admin/reports",
  },
  {
    icon: History,
    label: "Audit Log",
    path: "/admin/audit",
  },
];

/* ── Reusable sidebar link ── */
function SidebarLink({
  to,
  icon: Icon,
  label,
  indent,
  badge,
}: {
  to: string;
  icon: React.ElementType;
  label: string;
  indent?: boolean;
  badge?: number;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  let isActive = false;
  if (to === "/admin/dashboard") {
    isActive = pathname === to;
  } else {
    const [pathPart, queryPart] = to.split("?");
    if (queryPart) {
      const urlSearchParams = new URLSearchParams(queryPart);
      let queryMatches = true;
      for (const [key, value] of urlSearchParams.entries()) {
        // Fallback to "srq29" if the tab query is missing, as it's the default
        const actualValue =
          searchParams?.get(key) || (key === "tab" && !searchParams?.has("tab") ? "srq29" : null);
        if (actualValue !== value) {
          queryMatches = false;
          break;
        }
      }
      isActive = pathname === pathPart && queryMatches;
    } else {
      isActive = pathname?.startsWith(to ?? "");
    }
  }

  return (
    <Link
      href={to}
      className="flex items-center gap-3 rounded-xl mb-0.5 no-underline"
      style={{
        padding: indent ? "7px 12px 7px 38px" : "10px 12px",
        background: isActive ? `linear-gradient(90deg, ${TEAL}28, ${TEAL}10)` : "transparent",
        borderLeft: isActive ? `3px solid ${TEAL}` : "3px solid transparent",
        color: isActive ? WHITE : "rgba(255,255,255,0.5)",
        fontWeight: isActive ? 600 : 400,
        fontSize: indent ? 12.5 : 13,
        transition: "all 0.15s",
        position: "relative" as const,
      }}
    >
      {!indent && <Icon size={15} color={isActive ? TEAL : "rgba(255,255,255,0.45)"} />}
      <span className="flex-1">{label}</span>
      {badge !== undefined && badge > 0 && (
        <span
          style={{
            position: "absolute",
            top: 4,
            right: 8,
            minWidth: 18,
            height: 18,
            padding: "0 5px",
            borderRadius: 9,
            background: "#E53E3E",
            color: WHITE,
            fontSize: 10,
            fontWeight: 700,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            boxShadow: "0 2px 8px rgba(229,62,62,0.45)",
            fontFamily: "'Inter', sans-serif",
            lineHeight: 1,
            animation: "badgePop 0.3s cubic-bezier(0.34,1.56,0.64,1)",
          }}
        >
          {badge > 99 ? "99+" : badge}
        </span>
      )}
    </Link>
  );
}

/* ── Sidebar user menu ── */
function UserMenu({ adminName, onLogoutClick }: { adminName: string; onLogoutClick: () => void }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  const displayName = adminName || "Admin";
  const displayEmail = "admin@chp.ac.id"; // Placeholder email if not in session data
  const initials = (displayName.match(/\b\w/g) || ["A"]).slice(0, 2).join("").toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapRef} style={{ position: "relative" }}>
      <button
        onClick={() => setOpen((s) => !s)}
        className="w-full flex items-center gap-2.5 rounded-xl outline-none"
        style={{
          padding: "8px 10px",
          background: open ? "rgba(255,255,255,0.06)" : "transparent",
          border: "none",
          cursor: "pointer",
          color: WHITE,
          transition: "all 0.15s",
          textAlign: "left",
        }}
        onMouseEnter={(e) => {
          if (!open) e.currentTarget.style.background = "rgba(255,255,255,0.04)";
        }}
        onMouseLeave={(e) => {
          if (!open) e.currentTarget.style.background = "transparent";
        }}
      >
        <span
          className="flex items-center justify-center rounded-full flex-shrink-0"
          style={{
            width: 30,
            height: 30,
            background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`,
            color: WHITE,
            fontFamily: "'DM Sans', sans-serif",
            fontWeight: 700,
            fontSize: 11,
            boxShadow: `0 2px 8px ${TEAL}55`,
          }}
        >
          {initials}
        </span>
        <span className="flex-1 min-w-0">
          <span
            style={{
              display: "block",
              fontSize: 12.5,
              fontWeight: 600,
              color: "rgba(255,255,255,0.9)",
              lineHeight: 1.2,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayName}
          </span>
          <span
            style={{
              display: "block",
              fontSize: 10.5,
              color: "rgba(255,255,255,0.4)",
              lineHeight: 1.2,
              marginTop: 1,
              overflow: "hidden",
              textOverflow: "ellipsis",
              whiteSpace: "nowrap",
            }}
          >
            {displayEmail}
          </span>
        </span>
        <ChevronDown
          size={13}
          color="rgba(255,255,255,0.5)"
          style={{
            transform: open ? "rotate(180deg)" : "rotate(0deg)",
            transition: "transform 0.2s",
            flexShrink: 0,
          }}
        />
      </button>

      {open && (
        <div
          style={{
            position: "absolute",
            bottom: "calc(100% + 6px)",
            left: 0,
            right: 0,
            background: "#2A2342",
            border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: 12,
            padding: 6,
            boxShadow: "0 10px 30px rgba(0,0,0,0.4), 0 0 0 1px rgba(0,0,0,0.2)",
            zIndex: 40,
            animation: "userMenuIn 0.15s ease-out",
          }}
        >
          <MenuItem
            icon={User}
            label="My Profile"
            onClick={() => {
              setOpen(false);
              router.push("/admin/profile");
            }}
          />
          <MenuItem
            icon={Home}
            label="Homepage"
            onClick={() => {
              setOpen(false);
              router.push("/");
            }}
          />
          <div
            style={{
              height: 1,
              background: "rgba(255,255,255,0.08)",
              margin: "4px 2px",
            }}
          />
          <MenuItem
            icon={LogOut}
            label="Log Out"
            danger
            onClick={() => {
              setOpen(false);
              onLogoutClick();
            }}
          />
        </div>
      )}
      <style>{`
        @keyframes userMenuIn {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}

function MenuItem({
  icon: Icon,
  label,
  onClick,
  danger,
}: {
  icon: React.ElementType;
  label: string;
  onClick: () => void;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2.5 rounded-lg"
      style={{
        padding: "8px 10px",
        background: "transparent",
        border: "none",
        cursor: "pointer",
        color: danger ? "#F8A4B5" : "rgba(255,255,255,0.85)",
        fontSize: 12.5,
        fontWeight: 500,
        textAlign: "left",
        transition: "background 0.12s",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = danger
          ? "rgba(212,24,61,0.18)"
          : "rgba(255,255,255,0.06)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <Icon size={14} color={danger ? "#F8A4B5" : "rgba(255,255,255,0.7)"} />
      {label}
    </button>
  );
}

export function AdminSidebar({
  adminName = "Admin",
  adminRole,
}: {
  adminName?: string;
  adminRole?: string;
}) {
  const pathname = usePathname();
  const [showLogoutModal, setShowLogoutModal] = useState(false);

  const logoutMutation = trpc.admin.logout.useMutation({
    onSuccess() {
      // Full reload ensures the cleared cookie is respected (ADR-7)
      window.location.href = "/admin/login";
    },
  });

  /* Auto-expand if any result child route is active */
  const isAnyResultActive = pathname.startsWith("/admin/results");
  const [resultsOpen, setResultsOpen] = useState(isAnyResultActive);

  /* Keep dropdown open when navigating to a result page */
  useEffect(() => {
    if (isAnyResultActive && !resultsOpen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setResultsOpen(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAnyResultActive]);

  /* Measure the dropdown content height for smooth animation. */
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [contentHeight, setContentHeight] = useState(0);

  useEffect(() => {
    if (dropdownRef.current) {
      const h = dropdownRef.current.scrollHeight;
      if (h > 0) setContentHeight(h);
    }
  }, [resultsOpen]);

  // Combine management nav with conditional accounts if super_admin
  const fullManagementNav = [...managementNav];
  if (adminRole === "super_admin") {
    fullManagementNav.push({
      icon: UserCog,
      label: "Account Management",
      path: "/admin/accounts",
    });
  }

  return (
    <>
      <aside
        className="flex flex-col sticky top-0 h-screen"
        style={{
          width: 232,
          background: SIDEBAR_BG,
          flexShrink: 0,
        }}
      >
        {/* Logo */}
        <div
          className="flex items-center gap-2.5 px-5 py-5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.07)" }}
        >
          <div className="flex-shrink-0 w-[36px] h-[36px] rounded-lg overflow-hidden flex items-center justify-center bg-white">
            <Image
              src="/logo_chp_v2.png"
              alt="CHP Logo"
              width={32}
              height={32}
              style={{ objectFit: "contain" }}
            />
          </div>
          <div>
            <div
              style={{
                fontFamily: "'DM Sans', sans-serif",
                fontWeight: 700,
                fontSize: 13,
                color: WHITE,
                lineHeight: 1.2,
              }}
            >
              CHP Admin
            </div>
            <div
              style={{
                fontFamily: "'Inter', sans-serif",
                fontSize: 10,
                color: "rgba(255,255,255,0.4)",
              }}
            >
              Management Portal
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 px-3 overflow-y-auto">
          {/* Section: General */}
          <div
            className="px-2 mb-2"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 9,
              fontWeight: 700,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            General
          </div>

          {topNav.map((item) => (
            <SidebarLink key={item.path} to={item.path} icon={item.icon} label={item.label} />
          ))}

          {/* ─── Results dropdown ─── */}
          <div className="mt-1 mb-0.5">
            <button
              onClick={() => setResultsOpen((prev) => !prev)}
              className="w-full flex items-center gap-3 rounded-xl"
              style={{
                padding: "10px 12px",
                background: isAnyResultActive
                  ? `linear-gradient(90deg, ${TEAL}18, ${TEAL}06)`
                  : "transparent",
                borderTop: "none",
                borderRight: "none",
                borderBottom: "none",
                borderLeft: isAnyResultActive ? `3px solid ${TEAL}70` : "3px solid transparent",
                color: isAnyResultActive || resultsOpen ? WHITE : "rgba(255,255,255,0.5)",
                fontWeight: isAnyResultActive ? 600 : 400,
                fontSize: 13,
                cursor: "pointer",
                transition: "all 0.15s",
              }}
            >
              <FileBarChart
                size={15}
                color={
                  isAnyResultActive
                    ? TEAL
                    : resultsOpen
                      ? "rgba(255,255,255,0.6)"
                      : "rgba(255,255,255,0.45)"
                }
              />
              <span className="flex-1 text-left">Results</span>

              {/* Badge showing count */}
              <span
                className="flex items-center justify-center rounded-full"
                style={{
                  width: 18,
                  height: 18,
                  fontSize: 10,
                  fontWeight: 700,
                  background: isAnyResultActive ? `${TEAL}30` : "rgba(255,255,255,0.08)",
                  color: isAnyResultActive ? TEAL : "rgba(255,255,255,0.4)",
                  marginRight: 2,
                }}
              >
                {resultsChildren.length}
              </span>

              {/* Chevron */}
              <ChevronDown
                size={14}
                color={isAnyResultActive ? TEAL : "rgba(255,255,255,0.35)"}
                style={{
                  transition: "transform 0.25s cubic-bezier(0.4,0,0.2,1)",
                  transform: resultsOpen ? "rotate(180deg)" : "rotate(0deg)",
                  flexShrink: 0,
                }}
              />
            </button>

            {/* Dropdown content with animated height */}
            <div
              style={{
                overflow: "hidden",
                maxHeight: resultsOpen ? contentHeight + 16 : 0,
                opacity: resultsOpen ? 1 : 0,
                transition: "max-height 0.3s cubic-bezier(0.4,0,0.2,1), opacity 0.25s ease",
              }}
            >
              <div ref={dropdownRef} className="pt-1 pb-1">
                {/* Subtle left connector line */}
                <div className="relative">
                  <div
                    className="absolute"
                    style={{
                      left: 22,
                      top: 0,
                      bottom: 0,
                      width: 1,
                      background: `rgba(255,255,255,0.06)`,
                      borderRadius: 1,
                    }}
                  />
                  {resultsChildren.map((child) => (
                    <SidebarLink
                      key={child.path}
                      to={child.path}
                      icon={child.icon}
                      label={child.label}
                      indent
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Section: Management */}
          <div
            className="px-2 mt-4 mb-2"
            style={{
              fontFamily: "'Inter', sans-serif",
              fontSize: 9,
              fontWeight: 700,
              color: "rgba(255,255,255,0.3)",
              textTransform: "uppercase",
              letterSpacing: "0.12em",
            }}
          >
            Management
          </div>

          {fullManagementNav.map((item) => (
            <SidebarLink key={item.path} to={item.path} icon={item.icon} label={item.label} />
          ))}
        </nav>

        {/* Bottom */}
        <div className="px-3 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.07)" }}>
          <UserMenu adminName={adminName} onLogoutClick={() => setShowLogoutModal(true)} />
        </div>
      </aside>

      {/* Logout Confirmation Modal */}
      {showLogoutModal && (
        <div
          className="fixed inset-0 z-[100] flex items-center justify-center"
          style={{
            background: "rgba(0,0,0,0.5)",
            backdropFilter: "blur(4px)",
          }}
          onClick={() => setShowLogoutModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="flex flex-col"
            style={{
              width: 400,
              background: WHITE,
              borderRadius: 16,
              boxShadow: "0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(155,142,196,0.1)",
              overflow: "hidden",
              animation: "modalIn 0.2s ease-out",
            }}
          >
            {/* Header accent bar */}
            <div
              style={{
                height: 4,
                background: `linear-gradient(90deg, ${TEAL}, ${TEAL_DARK})`,
              }}
            />

            <div className="p-6">
              {/* Icon + Title */}
              <div className="flex items-center gap-3 mb-4">
                <div
                  className="flex items-center justify-center rounded-xl"
                  style={{
                    width: 42,
                    height: 42,
                    background: `${TEAL}15`,
                    border: `1px solid ${TEAL}25`,
                  }}
                >
                  <LogOut size={20} color={TEAL} />
                </div>
                <div>
                  <h3
                    style={{
                      fontFamily: "'DM Sans', sans-serif",
                      fontWeight: 700,
                      fontSize: 17,
                      color: DARK_TEXT,
                      margin: 0,
                    }}
                  >
                    Confirm Log Out
                  </h3>
                </div>
              </div>

              {/* Body */}
              <p
                style={{
                  fontSize: 13.5,
                  color: MID_TEXT,
                  lineHeight: 1.6,
                  margin: "0 0 24px 0",
                }}
              >
                Are you sure you want to end your session and return to the login page?
              </p>

              {/* Actions */}
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowLogoutModal(false)}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 10,
                    border: `1px solid ${BORDER_LIGHT}`,
                    background: WHITE,
                    color: MID_TEXT,
                    fontSize: 13,
                    fontWeight: 500,
                    cursor: "pointer",
                    transition: "all 0.15s",
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#F5F3FA";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = WHITE;
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setShowLogoutModal(false);
                    logoutMutation.mutate();
                  }}
                  disabled={logoutMutation.isPending}
                  style={{
                    padding: "9px 20px",
                    borderRadius: 10,
                    border: "none",
                    background: `linear-gradient(135deg, ${TEAL}, ${TEAL_DARK})`,
                    color: WHITE,
                    fontSize: 13,
                    fontWeight: 600,
                    cursor: logoutMutation.isPending ? "not-allowed" : "pointer",
                    boxShadow: `0 4px 12px ${TEAL}40`,
                    transition: "all 0.15s",
                    opacity: logoutMutation.isPending ? 0.7 : 1,
                  }}
                  onMouseEnter={(e) => {
                    if (logoutMutation.isPending) return;
                    e.currentTarget.style.transform = "translateY(-1px)";
                    e.currentTarget.style.boxShadow = `0 6px 16px ${TEAL}50`;
                  }}
                  onMouseLeave={(e) => {
                    if (logoutMutation.isPending) return;
                    e.currentTarget.style.transform = "translateY(0)";
                    e.currentTarget.style.boxShadow = `0 4px 12px ${TEAL}40`;
                  }}
                >
                  {logoutMutation.isPending ? "Logging out..." : "Yes, Log Out"}
                </button>
              </div>
            </div>
          </div>
          <style>{`
            @keyframes modalIn {
              from { opacity: 0; transform: scale(0.95) translateY(8px); }
              to { opacity: 1; transform: scale(1) translateY(0); }
            }
            @keyframes badgePop {
              0% { transform: scale(0); }
              100% { transform: scale(1); }
            }
          `}</style>
        </div>
      )}
    </>
  );
}

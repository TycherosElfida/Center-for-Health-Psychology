"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChpLogo } from "@/components/ui/ChpLogo";
import { trpc } from "@/lib/trpc/client";

const NAV_ITEMS = [
  {
    section: "General",
    items: [{ label: "Dashboard", href: "/admin/dashboard", icon: "📊" }],
  },
  {
    section: "Data",
    items: [{ label: "Results", href: "/admin/results", icon: "📋" }],
  },
  {
    section: "Management",
    items: [
      { label: "Assessments", href: "/admin/assessments", icon: "📝" },
      { label: "Email Requests", href: "/admin/reports", icon: "📧" },
      { label: "Audit Log", href: "/admin/audit", icon: "🔒" },
    ],
  },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const logoutMutation = trpc.admin.logout.useMutation({
    onSuccess() {
      // Full reload ensures the cleared cookie is respected (ADR-7)
      window.location.href = "/admin/login";
    },
  });

  return (
    <aside className="admin-sidebar">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 mb-2">
        <ChpLogo size={36} />
        <div>
          <div className="text-sm font-semibold text-white">CHP Admin</div>
          <div className="text-[10px] text-[#8B7CB8]">Management Portal</div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 flex flex-col gap-1 px-3">
        {NAV_ITEMS.map((section) => (
          <div key={section.section} className="mb-3">
            <div className="admin-sidebar-label">{section.section}</div>
            {section.items.map((item) => {
              const isActive =
                pathname === item.href ||
                (item.href !== "/admin/dashboard" && pathname.startsWith(item.href));
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`admin-sidebar-item ${isActive ? "active" : ""}`}
                >
                  <span className="sidebar-icon">{item.icon}</span>
                  {item.label}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Logout */}
      <div className="px-3 pb-5 mt-auto">
        <button
          onClick={() => logoutMutation.mutate()}
          disabled={logoutMutation.isPending}
          className="admin-sidebar-item w-full text-left"
          style={{ color: "#E57373" }}
        >
          <span className="sidebar-icon">🚪</span>
          {logoutMutation.isPending ? "Logging out\u2026" : "Logout"}
        </button>
      </div>
    </aside>
  );
}

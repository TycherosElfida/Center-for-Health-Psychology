"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChpLogo } from "@/components/ui/ChpLogo";
import { trpc } from "@/lib/trpc/client";
import { useState, useRef, useEffect } from "react";
import { User, Moon, LogOut, Link as LinkIcon, MoreHorizontal, ScrollText } from "lucide-react";

function getNavItems(adminRole?: string) {
  const managementItems = [
    { label: "Assessments", href: "/admin/assessments", icon: "📝" },
    { label: "Email Requests", href: "/admin/reports", icon: "📧" },
    { label: "Audit Log", href: "/admin/audit", icon: <ScrollText size={16} /> },
  ];

  // Accounts link is only visible to super_admin
  if (adminRole === "super_admin") {
    managementItems.push({ label: "Accounts", href: "/admin/accounts", icon: "👥" });
  }

  return [
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
      items: managementItems,
    },
  ];
}

function UserProfileDropdown({ adminName }: { adminName: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const logoutMutation = trpc.admin.logout.useMutation({
    onSuccess() {
      // Full reload ensures the cleared cookie is respected (ADR-7)
      window.location.href = "/admin/login";
    },
  });

  // Handle click outside to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {isOpen && (
        <div className="absolute bottom-full left-0 mb-2 w-full bg-[#18181b] border border-[#27272a] rounded-xl shadow-xl overflow-hidden z-50 text-sm">
          <Link
            href="/admin/profile"
            onClick={() => setIsOpen(false)}
            className="px-3 py-2.5 text-white font-medium border-b border-[#27272a] flex items-center gap-2 hover:bg-[#27272a]/50 transition-colors"
          >
            <span className="text-[#a1a1aa]">
              <User size={14} />
            </span>{" "}
            My profile
          </Link>
          <div className="py-1 border-b border-[#27272a]">
            <button
              onClick={() => {
                setIsOpen(false);
              }}
              className="w-full flex items-center justify-between px-3 py-2 text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
            >
              <div className="flex items-center gap-2">
                <Moon size={14} /> Toggle theme
              </div>
              <kbd className="bg-[#27272a] text-[#71717a] text-[10px] px-1.5 py-0.5 rounded border border-[#3f3f46]">
                M
              </kbd>
            </button>
          </div>
          <div className="py-1 border-b border-[#27272a]">
            <Link
              href="/home"
              onClick={() => setIsOpen(false)}
              className="w-full flex items-center gap-2 px-3 py-2 text-[#a1a1aa] hover:text-white hover:bg-[#27272a] transition-colors"
            >
              <LinkIcon size={14} /> Homepage
            </Link>
          </div>
          <div className="py-1">
            <button
              onClick={() => logoutMutation.mutate()}
              disabled={logoutMutation.isPending}
              className="w-full flex items-center gap-2 px-3 py-2 text-[#E57373] hover:bg-[#27272a] transition-colors"
            >
              <LogOut size={14} /> {logoutMutation.isPending ? "Logging out..." : "Log out"}
            </button>
          </div>
        </div>
      )}

      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-[#27272a]/50 transition-colors"
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-[#27272a] text-[#a1a1aa] flex items-center justify-center font-medium text-xs">
            {adminName.charAt(0).toUpperCase()}
          </div>
          <div className="text-sm text-[#d4d4d8] truncate max-w-[120px] font-medium text-left">
            {adminName}
          </div>
        </div>
        <MoreHorizontal size={16} className="text-[#71717a]" />
      </button>
    </div>
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
  const navItems = getNavItems(adminRole);

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
        {navItems.map((section) => (
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

      {/* User Profile / Menu */}
      <div className="px-3 pb-5 mt-auto">
        <UserProfileDropdown adminName={adminName} />
      </div>
    </aside>
  );
}

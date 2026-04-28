"use client";

import { usePathname } from "next/navigation";

const TITLE_MAP: Record<string, string> = {
  "/admin/dashboard": "Dashboard",
  "/admin/results": "Results",
  "/admin/assessments": "Assessments",
  "/admin/reports": "Email Requests",
  "/admin/audit": "Audit Log",
};

function getPageTitle(pathname: string): string {
  // Exact match first
  if (TITLE_MAP[pathname]) return TITLE_MAP[pathname];
  // Prefix match for nested routes (e.g., /admin/results/[id])
  for (const [path, title] of Object.entries(TITLE_MAP)) {
    if (pathname.startsWith(path)) return title;
  }
  return "Admin";
}

export function AdminHeader({ adminName }: { adminName?: string }) {
  const pathname = usePathname();
  const title = getPageTitle(pathname);

  const formattedDate = new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date());

  return (
    <header className="admin-header">
      <div>
        <h1
          className="text-xl font-bold"
          style={{ color: "var(--text-heading)", fontFamily: "var(--font-heading)" }}
        >
          {title}
        </h1>
        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
          {formattedDate}
        </p>
      </div>
      {adminName && (
        <div className="text-sm" style={{ color: "var(--text-body)" }}>
          {adminName}
        </div>
      )}
    </header>
  );
}

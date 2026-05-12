"use client";

import { useEffect } from "react";
import { trpc } from "@/lib/trpc/client";
import { AdminSidebar } from "../_components/AdminSidebar";
import { AdminHeader } from "../_components/AdminHeader";
import "@/app/admin/admin.css";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const meQuery = trpc.admin.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (meQuery.isError || (meQuery.isSuccess && !meQuery.data)) {
      // Use window.location.href (not router.replace) to ensure cookie headers
      // are properly read on the next request — same pattern as login page.
      window.location.href = "/admin/login";
      return;
    }

    if (meQuery.isSuccess && meQuery.data?.mustChangePassword) {
      window.location.href = "/admin/change-password";
      return;
    }
  }, [meQuery.isError, meQuery.isSuccess, meQuery.data]);

  // Loading state
  if (meQuery.isLoading) {
    return (
      <div className="admin-shell">
        <div className="admin-sidebar">
          <div className="px-5 py-5">
            <div className="admin-skeleton" style={{ width: 120, height: 20 }} />
          </div>
        </div>
        <div className="admin-content flex items-center justify-center">
          <div className="admin-skeleton" style={{ width: 200, height: 24 }} />
        </div>
      </div>
    );
  }

  // Not authenticated
  if (!meQuery.data) return null;

  return (
    <div className="admin-shell">
      <AdminSidebar adminName={meQuery.data.name} adminRole={meQuery.data.role} />
      <div className="admin-content">
        <AdminHeader adminName={meQuery.data.name} />
        <main className="p-6 admin-fade-in">{children}</main>
      </div>
    </div>
  );
}

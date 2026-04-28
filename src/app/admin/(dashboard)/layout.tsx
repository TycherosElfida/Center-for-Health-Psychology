"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { trpc } from "@/lib/trpc/client";
import { AdminSidebar } from "../_components/AdminSidebar";
import { AdminHeader } from "../_components/AdminHeader";
import "@/app/admin/admin.css";

export default function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const meQuery = trpc.admin.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    if (meQuery.isError || (meQuery.isSuccess && !meQuery.data)) {
      router.replace("/admin/login");
    }
  }, [meQuery.isError, meQuery.isSuccess, meQuery.data, router]);

  useEffect(() => {
    if (meQuery.data?.mustChangePassword) {
      router.replace("/admin/change-password");
    }
  }, [meQuery.data?.mustChangePassword, router]);

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
      <AdminSidebar />
      <div className="admin-content">
        <AdminHeader adminName={meQuery.data.name} />
        <main className="p-6 admin-fade-in">{children}</main>
      </div>
    </div>
  );
}

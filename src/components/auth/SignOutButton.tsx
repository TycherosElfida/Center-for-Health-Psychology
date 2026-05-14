"use client";

/**
 * SignOutButton — Client component for signing out.
 *
 * Uses the Auth.js `signOut()` function directly.
 * Renders as a styled button matching the design system.
 */

import { logoutAction } from "@/app/actions/auth";
import { LogOut } from "lucide-react";
import { useState } from "react";
import { LogoutConfirmModal } from "../layout/LogoutConfirmModal";

interface SignOutButtonProps {
  className?: string;
  variant?: "ghost" | "outline";
}

export function SignOutButton({ className = "", variant = "ghost" }: SignOutButtonProps) {
  const [modalOpen, setModalOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-2 text-[13px] font-medium transition-all duration-200 ${className}`}
        style={{
          color: "var(--text-body, #4A5568)",
          backgroundColor: "transparent",
          border: variant === "outline" ? "1px solid var(--border-subtle, #E2DCF0)" : "none",
        }}
      >
        <LogOut size={15} strokeWidth={2} aria-hidden="true" />
        Keluar
      </button>

      <LogoutConfirmModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onConfirm={async () => {
          await logoutAction();
        }}
      />
    </>
  );
}

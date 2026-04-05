"use client";

/**
 * SignOutButton — Client component for signing out.
 *
 * Uses the Auth.js `signOut()` function directly.
 * Renders as a styled button matching the design system.
 */

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

interface SignOutButtonProps {
  className?: string;
  variant?: "ghost" | "outline";
}

export function SignOutButton({ className = "", variant = "ghost" }: SignOutButtonProps) {
  return (
    <button
      type="button"
      onClick={() => signOut({ callbackUrl: "/" })}
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
  );
}

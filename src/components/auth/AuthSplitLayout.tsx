"use client";

/**
 * AuthSplitLayout — Responsive split-screen shell for auth pages
 *
 * Desktop ≥ 1024px: CSS Grid 1fr 1fr — form left, BrandPanel right
 * Tablet 768–1023px: CSS Grid 1fr 420px
 * Mobile < 768px: Column layout — compact purple header strip + form
 *
 * The mobile header strip replaces the full BrandPanel with a minimal
 * gradient bar containing the ChpLogo and tagline.
 */
import { BrandPanel } from "./BrandPanel";
import { ChpLogo } from "@/components/ui/ChpLogo";

interface AuthSplitLayoutProps {
  children: React.ReactNode;
  mode: "login" | "signup";
}

export function AuthSplitLayout({ children }: AuthSplitLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-[1fr_420px] lg:grid-cols-2">
      {/* Mobile-only compact header strip */}
      <div
        className="flex md:hidden items-center justify-between px-6 shrink-0"
        style={{
          height: 96,
          background: "linear-gradient(90deg, #6B5CA0, #9B8EC4)",
        }}
      >
        <ChpLogo size={36} />
        <span className="text-white/70 text-xs font-medium">Platform Assessment Psikologi</span>
      </div>

      {/* Form panel */}
      <div className="flex flex-1 items-center justify-center px-6 py-12 md:px-12 lg:px-16">
        <div className="w-full max-w-md">{children}</div>
      </div>

      {/* Brand panel — desktop/tablet only (hidden on mobile via BrandPanel itself) */}
      <BrandPanel />
    </div>
  );
}

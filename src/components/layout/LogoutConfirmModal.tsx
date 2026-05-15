"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "motion/react";
import { LogOut } from "lucide-react";

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export function LogoutConfirmModal({ isOpen, onClose, onConfirm }: LogoutConfirmModalProps) {
  const [mounted, setMounted] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl bg-white shadow-2xl"
            style={{
              boxShadow: "0 20px 40px -10px rgba(0,0,0,0.15)",
            }}
          >
            {/* Top border color bar */}
            <div
              className="h-2 w-full"
              style={{ backgroundColor: "var(--brand-primary, #9B8EC4)" }}
            />

            <div className="p-8">
              {/* Header (Icon + Title) */}
              <div className="mb-6 flex items-center gap-4">
                <div
                  className="flex h-14 w-14 items-center justify-center rounded-2xl"
                  style={{
                    backgroundColor: "var(--brand-primary-light, #EDE9F8)",
                    border: "2px solid var(--border-subtle, #E2DCF0)",
                  }}
                >
                  <LogOut size={24} style={{ color: "var(--brand-primary-dark, #6B5CA0)" }} />
                </div>
                <h3 className="m-0 text-xl font-bold text-foreground">Konfirmasi Keluar</h3>
              </div>

              {/* Body text */}
              <p className="mb-8 text-[15px] leading-relaxed text-muted-foreground">
                Apakah Anda yakin ingin mengakhiri sesi dan kembali ke halaman masuk?
              </p>

              {/* Actions */}
              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={isLoggingOut}
                  className="cursor-pointer rounded-xl border px-6 py-3 font-semibold transition-colors hover:bg-secondary/50 disabled:opacity-50"
                  style={{
                    borderColor: "var(--border-subtle, #E2DCF0)",
                    color: "var(--text-body, #4A5568)",
                  }}
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={isLoggingOut}
                  onClick={async () => {
                    setIsLoggingOut(true);
                    try {
                      await onConfirm();
                    } catch (error) {
                      console.error("Logout failed:", error);
                      setIsLoggingOut(false);
                    }
                  }}
                  className="cursor-pointer rounded-xl px-6 py-3 font-bold text-white shadow-md transition-opacity hover:opacity-90 disabled:opacity-70"
                  style={{
                    backgroundColor: "var(--brand-primary, #9B8EC4)",
                  }}
                >
                  {isLoggingOut ? "Sedang keluar..." : "Ya, Keluar"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChpLogo } from "@/components/ui/ChpLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import "@/app/admin/admin.css";

export default function AdminChangePasswordPage() {
  const router = useRouter();
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");

  const mutation = trpc.admin.changePassword.useMutation({
    onSuccess() {
      router.push("/admin/dashboard");
    },
    onError(err) {
      setError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (newPassword.length < 12) {
      setError("New password must be at least 12 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    mutation.mutate({ currentPassword, newPassword });
  }

  return (
    <div className="admin-login-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-[420px] border-0 shadow-2xl admin-fade-in">
        <CardHeader className="flex flex-col items-center gap-3 pb-2 pt-8">
          <ChpLogo size={56} />
          <div className="text-center">
            <h1 className="text-xl font-bold" style={{ color: "var(--text-heading)" }}>
              Change Your Password
            </h1>
            <p className="text-sm" style={{ color: "var(--text-muted)" }}>
              You must change your password before continuing.
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="current-password">Current Password</Label>
              <Input
                id="current-password"
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                maxLength={128}
                autoComplete="current-password"
                autoFocus
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={12}
                maxLength={128}
                autoComplete="new-password"
                placeholder="Minimum 12 characters"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="confirm-password">Confirm New Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                maxLength={128}
                autoComplete="new-password"
              />
            </div>

            {error && (
              <p
                className="text-sm text-center py-1"
                style={{ color: "var(--destructive)" }}
                role="alert"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full mt-2 cursor-pointer"
              disabled={mutation.isPending}
              style={{ background: "var(--brand-primary)", color: "#fff" }}
            >
              {mutation.isPending ? "Updating\u2026" : "Update Password"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

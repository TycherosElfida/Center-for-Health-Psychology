"use client";

import { useState } from "react";
// STRUCTURAL CONSTRAINT: No import of useRouter from next/navigation.
// Post-login redirect MUST use window.location.href to ensure the browser
// registers the Set-Cookie header before the next request fires.
import { ChpLogo } from "@/components/ui/ChpLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { trpc } from "@/lib/trpc/client";
import "@/app/admin/admin.css";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const loginMutation = trpc.admin.login.useMutation({
    onSuccess(data) {
      if (data.mustChangePassword) {
        window.location.href = "/admin/change-password";
      } else {
        window.location.href = "/admin/dashboard";
      }
    },
    onError(err) {
      setError(err.message);
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    loginMutation.mutate({ email, password });
  }

  return (
    <div className="admin-login-bg flex items-center justify-center p-4">
      <Card className="w-full max-w-[420px] border-0 shadow-2xl admin-fade-in">
        <CardHeader className="flex flex-col items-center gap-3 pb-2 pt-8">
          <ChpLogo size={56} />
          <div className="text-center">
            <h1 className="text-xl font-bold" style={{ color: "var(--text-heading)" }}>
              CHP Platform
            </h1>
            <p className="text-sm" style={{ color: "var(--brand-primary-mid)" }}>
              Management Portal
            </p>
          </div>
        </CardHeader>

        <CardContent className="px-8 pb-8">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@chp.ukrida.ac.id"
                autoFocus
                required
                maxLength={255}
                autoComplete="email"
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="admin-password">Password</Label>
              <div className="relative">
                <Input
                  id="admin-password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  maxLength={128}
                  autoComplete="current-password"
                  className="pr-14"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-medium"
                  style={{ color: "var(--text-muted)" }}
                  tabIndex={-1}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
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
              disabled={loginMutation.isPending}
              style={{ background: "var(--brand-primary)", color: "#fff" }}
            >
              {loginMutation.isPending ? "Signing in\u2026" : "Sign In"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

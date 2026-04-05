import type { Metadata } from "next";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { LoginForm } from "@/components/auth/LoginForm";

export const metadata: Metadata = {
  title: "Masuk — Center for Health Psychology",
  description: "Masuk ke akun CHP untuk mengakses hasil assessmentmu.",
};

export default function LoginPage() {
  return (
    <AuthSplitLayout mode="login">
      <LoginForm />
    </AuthSplitLayout>
  );
}

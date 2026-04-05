import type { Metadata } from "next";
import { AuthSplitLayout } from "@/components/auth/AuthSplitLayout";
import { SignupForm } from "@/components/auth/SignupForm";

export const metadata: Metadata = {
  title: "Daftar — Center for Health Psychology",
  description: "Buat akun CHP untuk menyimpan hasil assessmentmu.",
};

export default function SignupPage() {
  return (
    <AuthSplitLayout mode="signup">
      <SignupForm />
    </AuthSplitLayout>
  );
}

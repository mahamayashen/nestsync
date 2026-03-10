import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { ForgotPasswordForm } from "./forgot-password-form";

export default async function ForgotPasswordPage() {
  // Already-authenticated guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const dest = await getPostAuthRedirect();
    redirect(dest);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Reset your password
          </h1>
          <p className="text-slate-500">
            Enter your email and we&apos;ll send you a reset link
          </p>
        </div>

        <ForgotPasswordForm />
      </div>
    </div>
  );
}

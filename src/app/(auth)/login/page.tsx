import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { LoginForm } from "./login-form";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string; message?: string }>;
}) {
  const params = await searchParams;

  // Already-authenticated guard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const dest = await getPostAuthRedirect(params.redirect);
    redirect(dest);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">Welcome back</h1>
          <p className="text-slate-500">Sign in to your NestSync account</p>
        </div>

        {params.message && (
          <div
            className="p-3 rounded-lg bg-green-50 text-green-700 text-sm"
            role="status"
          >
            {params.message}
          </div>
        )}

        <LoginForm redirectTo={params.redirect} />
      </div>
    </div>
  );
}

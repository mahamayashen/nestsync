import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getPostAuthRedirect } from "@/lib/auth/redirect";
import { SignupForm } from "./signup-form";

export default async function SignupPage({
  searchParams,
}: {
  searchParams: Promise<{ invite?: string }>;
}) {
  const params = await searchParams;

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold font-heading text-text-primary">Create an account</h1>
          <p className="text-text-secondary">Get started with NestSync</p>
        </div>

        <SignupForm inviteCode={params.invite} />
      </div>
    </div>
  );
}

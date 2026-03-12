import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { House, UserPlus } from "@phosphor-icons/react/dist/ssr";

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;

  // If user already has active membership, redirect to dashboard
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membership } = await supabase
    .from("household_members")
    .select("id")
    .eq("user_id", user.id)
    .is("left_at", null)
    .limit(1)
    .maybeSingle();

  if (membership) {
    redirect("/dashboard/household");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-text-primary font-heading">
            Welcome to NestSync
          </h1>
          <p className="text-text-secondary">
            Create a new household or join an existing one
          </p>
        </div>

        {params.error && (
          <div
            className="p-3 rounded-lg bg-error-light text-error-text text-sm"
            role="alert"
          >
            {params.error}
          </div>
        )}

        <div className="grid gap-4">
          <Link
            href="/onboarding/create"
            className="flex items-center gap-4 p-5 bg-surface rounded-xl border border-border-light hover:border-primary hover:shadow-md transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-primary-light rounded-lg flex items-center justify-center group-hover:bg-primary-medium transition-colors">
              <House className="w-6 h-6 text-primary" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Create a household</p>
              <p className="text-sm text-text-secondary">
                Start a new household and invite your roommates
              </p>
            </div>
          </Link>

          <Link
            href="/onboarding/join"
            className="flex items-center gap-4 p-5 bg-surface rounded-xl border border-border-light hover:border-primary hover:shadow-md transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-highlight-light rounded-lg flex items-center justify-center group-hover:bg-highlight/20 transition-colors">
              <UserPlus className="w-6 h-6 text-highlight" />
            </div>
            <div>
              <p className="font-semibold text-text-primary">Join a household</p>
              <p className="text-sm text-text-secondary">
                Enter an invite code from your roommate
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

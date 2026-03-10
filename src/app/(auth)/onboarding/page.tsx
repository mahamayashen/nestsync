import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Home, UserPlus } from "lucide-react";

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
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome to NestSync
          </h1>
          <p className="text-slate-500">
            Create a new household or join an existing one
          </p>
        </div>

        {params.error && (
          <div
            className="p-3 rounded-lg bg-red-50 text-red-700 text-sm"
            role="alert"
          >
            {params.error}
          </div>
        )}

        <div className="grid gap-4">
          <Link
            href="/onboarding/create"
            className="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-lg flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
              <Home className="w-6 h-6 text-indigo-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Create a household</p>
              <p className="text-sm text-slate-500">
                Start a new household and invite your roommates
              </p>
            </div>
          </Link>

          <Link
            href="/onboarding/join"
            className="flex items-center gap-4 p-5 bg-white rounded-xl border border-slate-200 hover:border-indigo-300 hover:shadow-md transition-all group"
          >
            <div className="flex-shrink-0 w-12 h-12 bg-emerald-50 rounded-lg flex items-center justify-center group-hover:bg-emerald-100 transition-colors">
              <UserPlus className="w-6 h-6 text-emerald-600" />
            </div>
            <div>
              <p className="font-semibold text-slate-900">Join a household</p>
              <p className="text-sm text-slate-500">
                Enter an invite code from your roommate
              </p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}

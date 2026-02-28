import { createHousehold } from "./actions";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Home } from "lucide-react";

export default async function OnboardingPage(props: { searchParams: Promise<{ error?: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect("/auth");
  }

  // Check if they are already in a household. If so, go straight to dashboard.
  const { data: existingMember } = await supabase
    .from("members")
    .select("household_id")
    .eq("user_id", user.id)
    .single();

  if (existingMember) {
    redirect("/dashboard");
  }

  const searchParams = await props.searchParams;

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-8">
        <div className="flex flex-col items-center mb-8">
          <div className="bg-indigo-600 p-3 rounded-2xl mb-4">
            <Home className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900">
            Welcome to NestSync
          </h1>
          <p className="text-slate-500 mt-2 text-sm text-center">
            Let's start by setting up your household.
          </p>
        </div>

        {searchParams.error && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
            {searchParams.error}
          </div>
        )}

        <form action={createHousehold} className="space-y-6">
          <div className="space-y-1">
            <label className="text-sm font-medium text-slate-700" htmlFor="name">
              Household Name
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              minLength={3}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
              placeholder="e.g. The Treehouse, 4B, The Smiths"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]"
          >
            Create Household
          </button>
        </form>
      </div>
    </div>
  );
}

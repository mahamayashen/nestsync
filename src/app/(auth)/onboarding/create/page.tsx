import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { CreateHouseholdForm } from "./create-household-form";

export default async function CreateHouseholdPage() {
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
      <div className="w-full max-w-sm space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-bold text-slate-900">
            Create a household
          </h1>
          <p className="text-slate-500">
            Set up your shared living space
          </p>
        </div>

        <CreateHouseholdForm />
      </div>
    </div>
  );
}

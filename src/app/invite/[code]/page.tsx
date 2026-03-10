import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export default async function InvitePage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Not authenticated → send to signup with invite code preserved
  if (!user) {
    redirect(`/signup?invite=${encodeURIComponent(code)}`);
  }

  // Authenticated → try to join the household directly
  const admin = createAdminClient();

  // Look up household by invite code (must use admin client — non-member can't SELECT)
  const { data: household } = await admin
    .from("households")
    .select("id, max_members, deleted_at")
    .eq("invite_code", code)
    .maybeSingle();

  if (!household) {
    redirect("/onboarding?error=Invalid+invite+code");
  }

  if (household.deleted_at) {
    redirect("/onboarding?error=This+household+is+no+longer+active");
  }

  // Check if already a member of any household
  const { data: existingMembership } = await admin
    .from("household_members")
    .select("id, household_id")
    .eq("user_id", user.id)
    .is("left_at", null)
    .maybeSingle();

  if (existingMembership) {
    if (existingMembership.household_id === household.id) {
      // Already in this household — just go to dashboard
      redirect("/dashboard");
    }
    redirect("/onboarding?error=You+are+already+a+member+of+a+household");
  }

  // Check max members
  const { count } = await admin
    .from("household_members")
    .select("id", { count: "exact", head: true })
    .eq("household_id", household.id)
    .is("left_at", null);

  if (count !== null && count >= household.max_members) {
    redirect("/onboarding?error=This+household+is+full");
  }

  // Join the household (use regular client — RLS allows user_id = auth.uid())
  const { error: joinError } = await supabase
    .from("household_members")
    .insert({
      household_id: household.id,
      user_id: user.id,
      role: "member",
    });

  if (joinError) {
    redirect("/onboarding?error=Failed+to+join+household.+Please+try+again.");
  }

  redirect("/dashboard");
}

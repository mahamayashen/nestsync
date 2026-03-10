import { createClient } from "@/lib/supabase/server";

export type CurrentMembership = {
  memberId: string;
  householdId: string;
  userId: string;
  role: "member" | "admin";
};

/**
 * Get the current user's active household membership.
 * Returns null if not authenticated or not a member of any household.
 */
export async function getCurrentMembership(): Promise<CurrentMembership | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: member } = await supabase
    .from("household_members")
    .select("id, household_id, role")
    .eq("user_id", user.id)
    .is("left_at", null)
    .maybeSingle();

  if (!member) return null;

  return {
    memberId: member.id,
    householdId: member.household_id,
    userId: user.id,
    role: member.role as "member" | "admin",
  };
}

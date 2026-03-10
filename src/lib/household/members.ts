import { createClient } from "@/lib/supabase/server";

export type HouseholdMemberWithUser = {
  id: string;
  user_id: string;
  role: string;
  joined_at: string;
  users: { display_name: string; avatar_url: string | null; email: string };
};

/**
 * Fetch active household members with their user profiles.
 */
export async function getHouseholdMembers(
  householdId: string
): Promise<HouseholdMemberWithUser[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("household_members")
    .select(
      "id, user_id, role, joined_at, users!inner(display_name, avatar_url, email)"
    )
    .eq("household_id", householdId)
    .is("left_at", null)
    .order("joined_at", { ascending: true });

  if (error || !data) return [];

  return data as unknown as HouseholdMemberWithUser[];
}

import { createClient } from "@/lib/supabase/server";

/**
 * Determines where to redirect a user after authentication.
 * - Has active household membership → "/dashboard/household"
 * - No membership → "/onboarding"
 * - Not authenticated → "/login"
 */
export async function getPostAuthRedirect(
  overrideRedirect?: string | null
): Promise<string> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return "/login";
  }

  // Check for active household membership
  const { data: membership } = await supabase
    .from("household_members")
    .select("id")
    .eq("user_id", user.id)
    .is("left_at", null)
    .limit(1)
    .maybeSingle();

  if (membership) {
    return overrideRedirect || "/dashboard/household";
  }

  return "/onboarding";
}

import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database.types";

/**
 * Determines where to redirect a user after authentication.
 * - Has active household membership → "/dashboard"
 * - No membership → "/onboarding"
 * - Not authenticated → "/login"
 *
 * Accepts an optional Supabase client to reuse an existing session
 * (critical for OAuth callback where a new client can't see freshly-set cookies).
 */
export async function getPostAuthRedirect(
  overrideRedirect?: string | null,
  existingClient?: SupabaseClient<Database>
): Promise<string> {
  const supabase = existingClient ?? (await createClient());

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
    return overrideRedirect || "/dashboard";
  }

  return "/onboarding";
}

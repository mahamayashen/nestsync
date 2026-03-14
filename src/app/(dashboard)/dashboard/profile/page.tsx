import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/household/queries";
import { createClient } from "@/lib/supabase/server";
import { ProfileCard } from "@/components/profile/profile-card";

export default async function ProfilePage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const supabase = await createClient();

  const [{ data: user }, { data: household }] = await Promise.all([
    supabase
      .from("users")
      .select("display_name, avatar_url, email, created_at")
      .eq("id", membership.userId)
      .single(),
    supabase
      .from("households")
      .select("name")
      .eq("id", membership.householdId)
      .single(),
  ]);

  return (
    <div className="max-w-lg mx-auto py-8">
      <ProfileCard
        userId={membership.userId}
        displayName={user?.display_name ?? "User"}
        email={user?.email ?? ""}
        avatarUrl={user?.avatar_url ?? null}
        householdName={household?.name ?? "Household"}
        role={membership.role}
        memberSince={user?.created_at ?? new Date().toISOString()}
      />
    </div>
  );
}

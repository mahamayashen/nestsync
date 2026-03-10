import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/household/queries";
import { createClient } from "@/lib/supabase/server";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const supabase = await createClient();

  const { data: household } = await supabase
    .from("households")
    .select("id, name, invite_code, timezone")
    .eq("id", membership.householdId)
    .single();

  if (!household) redirect("/onboarding");

  const { data: user } = await supabase
    .from("users")
    .select("display_name, avatar_url")
    .eq("id", membership.userId)
    .single();

  return (
    <DashboardShell
      household={household}
      membership={membership}
      user={user ?? { display_name: "User", avatar_url: null }}
    >
      {children}
    </DashboardShell>
  );
}

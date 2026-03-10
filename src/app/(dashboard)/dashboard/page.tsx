import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/household/queries";
import { createClient } from "@/lib/supabase/server";
import { getChoreInstances, getWeeklyChoreStats } from "@/lib/chores/queries";
import { DashboardHome } from "@/components/dashboard/dashboard-home";

export default async function DashboardPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const supabase = await createClient();

  const { data: user } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", membership.userId)
    .single();

  const now = new Date();
  const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  // Fetch data in parallel
  const [allPending, todayInstances, weeklyStats] = await Promise.all([
    getChoreInstances(membership.householdId, { status: "pending" }),
    getChoreInstances(membership.householdId, {
      status: "pending",
      dateFrom: today,
      dateTo: today,
    }),
    getWeeklyChoreStats(membership.householdId),
  ]);

  const myPendingCount = allPending.filter(
    (c) => c.assigned_to === membership.memberId
  ).length;

  return (
    <DashboardHome
      userName={user?.display_name ?? "User"}
      householdId={membership.householdId}
      myPendingCount={myPendingCount}
      totalPendingCount={allPending.length}
      todayChores={todayInstances}
      weeklyStats={weeklyStats}
    />
  );
}

import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/household/queries";
import { createClient } from "@/lib/supabase/server";
import {
  getChoreInstances,
  getWeeklyChoreStats,
  ensureWeekInstances,
  getTodayProgress,
  getCompletionStreak,
} from "@/lib/chores/queries";
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

  // Ensure current week's instances exist (Mon–Sun)
  await ensureWeekInstances(membership.householdId);

  const [todayInstances, weeklyStats, todayProgress, householdStreak] =
    await Promise.all([
      getChoreInstances(membership.householdId, {
        status: "pending",
        dateFrom: today,
        dateTo: today,
      }),
      getWeeklyChoreStats(membership.householdId),
      getTodayProgress(membership.householdId),
      getCompletionStreak(membership.householdId),
    ]);

  return (
    <DashboardHome
      userName={user?.display_name ?? "User"}
      householdId={membership.householdId}
      todayChores={todayInstances}
      weeklyStats={weeklyStats}
      todayProgress={todayProgress}
      householdStreak={householdStreak}
    />
  );
}

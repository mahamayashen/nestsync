import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/household/queries";
import {
  getChoreInstances,
  getWeeklyChoreStats,
  replenishInstances,
  getOnTimeRate,
  getTodayProgress,
} from "@/lib/chores/queries";
import { getHouseholdMembers } from "@/lib/household/members";
import { HouseholdDashboard } from "@/components/household/household-dashboard";

export default async function HouseholdPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  // Ensure rolling 7-day window is filled
  await replenishInstances(membership.householdId);

  const [members, weeklyStats, allPendingChores, teamOnTimeRate, todayProgress] =
    await Promise.all([
      getHouseholdMembers(membership.householdId),
      getWeeklyChoreStats(membership.householdId),
      getChoreInstances(membership.householdId, { status: "pending" }),
      getOnTimeRate(membership.householdId),
      getTodayProgress(membership.householdId),
    ]);

  // Compute per-member on-time rates
  const memberOnTimeRates = await Promise.all(
    members.map(async (m) => {
      const rate = await getOnTimeRate(membership.householdId, m.id);
      return { memberId: m.id, rate: rate.rate, total: rate.total };
    })
  );

  const memberRateMap: Record<string, { rate: number; total: number }> = {};
  for (const mr of memberOnTimeRates) {
    memberRateMap[mr.memberId] = { rate: mr.rate, total: mr.total };
  }

  return (
    <HouseholdDashboard
      householdId={membership.householdId}
      currentMemberId={membership.memberId}
      members={members}
      weeklyStats={weeklyStats}
      allPendingChores={allPendingChores}
      teamOnTimeRate={teamOnTimeRate}
      todayProgress={todayProgress}
      memberOnTimeRates={memberRateMap}
    />
  );
}

import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/household/queries";
import { createClient } from "@/lib/supabase/server";
import {
  getChoreInstances,
  ensureWeekInstances,
  getCompletionStreak,
  getOnTimeRate,
  getWeekComparison,
} from "@/lib/chores/queries";
import { MyPageDashboard } from "@/components/my-page/my-page-dashboard";

export default async function MyPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const supabase = await createClient();
  const { data: user } = await supabase
    .from("users")
    .select("display_name")
    .eq("id", membership.userId)
    .single();

  // Ensure current week's instances exist (Mon–Sun)
  await ensureWeekInstances(membership.householdId);

  const [myPendingChores, myStreak, onTimeRate, weekComparison] =
    await Promise.all([
      getChoreInstances(membership.householdId, {
        status: "pending",
        assignedTo: membership.memberId,
      }),
      getCompletionStreak(membership.householdId, membership.memberId),
      getOnTimeRate(membership.householdId, membership.memberId),
      getWeekComparison(membership.householdId, membership.memberId),
    ]);

  return (
    <div className="max-w-5xl">
    <MyPageDashboard
      userName={user?.display_name ?? "User"}
      householdId={membership.householdId}
      currentMemberId={membership.memberId}
      myPendingChores={myPendingChores}
      myStreak={myStreak}
      onTimeRate={onTimeRate}
      weekComparison={weekComparison}
    />
    </div>
  );
}

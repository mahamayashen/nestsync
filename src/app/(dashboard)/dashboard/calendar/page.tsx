import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/household/queries";
import { getCalendarEvents } from "@/lib/calendar/queries";
import { getHouseholdMembers } from "@/lib/household/members";
import { ensureWeekInstances } from "@/lib/chores/queries";
import {
  getWeekBounds,
  formatDateForDB,
} from "@/lib/chores/instance-generator";
import { WeeklyCalendar } from "@/components/calendar/weekly-calendar";

export default async function CalendarPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const { monday, sunday } = getWeekBounds();
  const weekStart = formatDateForDB(monday);
  const weekEnd = formatDateForDB(sunday);

  // Ensure current week's instances exist (Mon–Sun)
  await ensureWeekInstances(membership.householdId);

  const [events, members] = await Promise.all([
    getCalendarEvents(membership.householdId, weekStart, weekEnd),
    getHouseholdMembers(membership.householdId),
  ]);

  const memberMap: Record<string, string> = {};
  for (const m of members) {
    memberMap[m.id] = m.users.display_name;
  }

  return (
    <WeeklyCalendar
      householdId={membership.householdId}
      currentMemberId={membership.memberId}
      currentRole={membership.role}
      members={members}
      initialEvents={events}
      initialWeekStart={weekStart}
      memberMap={memberMap}
    />
  );
}

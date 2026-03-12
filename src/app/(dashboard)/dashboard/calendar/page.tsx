import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/household/queries";
import { getCalendarEvents } from "@/lib/calendar/queries";
import { getHouseholdMembers } from "@/lib/household/members";
import { replenishInstances } from "@/lib/chores/queries";
import { WeeklyCalendar } from "@/components/calendar/weekly-calendar";

function getMonday(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getSunday(mondayStr: string): string {
  const d = new Date(mondayStr + "T00:00:00");
  d.setDate(d.getDate() + 6);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default async function CalendarPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const now = new Date();
  const weekStart = getMonday(now);
  const weekEnd = getSunday(weekStart);

  // Ensure rolling 7-day window is filled
  await replenishInstances(membership.householdId);

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
      initialEvents={events}
      initialWeekStart={weekStart}
      memberMap={memberMap}
    />
  );
}

import { createClient } from "@/lib/supabase/server";
import { getHouseholdMembers } from "@/lib/household/members";

export type CalendarEventWithMember = {
  event_id: string;
  household_id: string;
  event_type: string;
  event_title: string;
  event_date: string;
  event_status: string;
  related_member_id: string | null;
  metadata_int: number | null;
  metadata_decimal: number | null;
  member_display_name: string | null;
};

export async function getCalendarEvents(
  householdId: string,
  dateFrom: string,
  dateTo: string
): Promise<CalendarEventWithMember[]> {
  const supabase = await createClient();

  const [{ data: events, error }, members] = await Promise.all([
    supabase
      .from("calendar_events")
      .select("*")
      .eq("household_id", householdId)
      .gte("event_date", dateFrom)
      .lte("event_date", dateTo)
      .order("event_date", { ascending: true }),
    getHouseholdMembers(householdId),
  ]);

  if (error || !events) return [];

  const memberMap = new Map(
    members.map((m) => [m.id, m.users.display_name])
  );

  return events.map((e) => ({
    event_id: e.event_id ?? "",
    household_id: e.household_id ?? "",
    event_type: e.event_type ?? "chore",
    event_title: e.event_title ?? "",
    event_date: e.event_date ?? "",
    event_status: e.event_status ?? "",
    related_member_id: e.related_member_id,
    metadata_int: e.metadata_int,
    metadata_decimal: e.metadata_decimal,
    member_display_name: e.related_member_id
      ? memberMap.get(e.related_member_id) ?? null
      : null,
  }));
}

"use client";

import { useMemo, useCallback, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useSupabase } from "@/hooks/use-supabase";
import { CalendarDots } from "@phosphor-icons/react";
import { WeekNavigator } from "./week-navigator";
import { CalendarEventChip } from "./calendar-event-chip";
import type { CalendarEventWithMember } from "@/lib/calendar/queries";

interface WeeklyCalendarProps {
  householdId: string;
  currentMemberId: string;
  initialEvents: CalendarEventWithMember[];
  initialWeekStart: string;
  memberMap: Record<string, string>; // memberId -> displayName
}

const DAY_NAMES = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function getMonday(date: Date): string {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function addDays(dateStr: string, days: number): string {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + days);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

function getSunday(mondayStr: string): string {
  return addDays(mondayStr, 6);
}

export function WeeklyCalendar({
  householdId,
  initialEvents,
  initialWeekStart,
  memberMap,
}: WeeklyCalendarProps) {
  const supabase = useSupabase();
  const [weekStart, setWeekStart] = useState(initialWeekStart);

  const { data: events } = useQuery({
    queryKey: ["calendar-events", householdId, weekStart],
    queryFn: async () => {
      const dateTo = getSunday(weekStart);
      const { data, error } = await supabase
        .from("calendar_events")
        .select("*")
        .eq("household_id", householdId)
        .gte("event_date", weekStart)
        .lte("event_date", dateTo)
        .order("event_date", { ascending: true });

      if (error || !data) return [];

      return data.map((e) => ({
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
          ? memberMap[e.related_member_id] ?? null
          : null,
      })) as CalendarEventWithMember[];
    },
    initialData: weekStart === initialWeekStart ? initialEvents : undefined,
    staleTime: 0,
  });

  // Group events by date
  const eventsByDate = useMemo(() => {
    const map = new Map<string, CalendarEventWithMember[]>();
    for (const event of events ?? []) {
      const existing = map.get(event.event_date) ?? [];
      existing.push(event);
      map.set(event.event_date, existing);
    }
    return map;
  }, [events]);

  // Get days of the week
  const weekDays = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));
  }, [weekStart]);

  const today = getMonday(new Date()).slice(0, 10);
  const todayFull = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
  })();

  const handlePrevWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, -7));
  }, []);

  const handleNextWeek = useCallback(() => {
    setWeekStart((prev) => addDays(prev, 7));
  }, []);

  const handleToday = useCallback(() => {
    setWeekStart(getMonday(new Date()));
  }, []);

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-bold text-text-primary font-heading">
            Calendar
          </h1>
          <p className="text-sm text-text-secondary mt-1">
            Weekly schedule for your household
          </p>
        </div>
        <WeekNavigator
          weekStart={weekStart}
          onPrevWeek={handlePrevWeek}
          onNextWeek={handleNextWeek}
          onToday={handleToday}
        />
      </div>

      {/* Calendar grid */}
      <div className="overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0">
        <div className="grid grid-cols-7 gap-px bg-border-light rounded-xl overflow-hidden min-w-[700px]">
          {weekDays.map((dateStr, i) => {
            const date = new Date(dateStr + "T00:00:00");
            const dayNum = date.getDate();
            const isToday = dateStr === todayFull;
            const dayEvents = eventsByDate.get(dateStr) ?? [];

            return (
              <div
                key={dateStr}
                className={`flex flex-col ${
                  isToday ? "bg-primary-light/30" : "bg-surface"
                }`}
              >
                {/* Day header */}
                <div
                  className={`px-2 py-2.5 text-center border-b border-border-light ${
                    isToday ? "bg-primary-light" : "bg-surface-secondary"
                  }`}
                >
                  <p className="text-[10px] font-medium text-text-muted uppercase tracking-wider">
                    {DAY_NAMES[i]}
                  </p>
                  <p
                    className={`text-lg font-bold ${
                      isToday ? "text-primary" : "text-text-primary"
                    }`}
                  >
                    {dayNum}
                  </p>
                </div>

                {/* Events */}
                <div className="flex-1 p-1.5 space-y-1 min-h-[280px] max-h-[480px] overflow-y-auto">
                  {dayEvents.length === 0 ? (
                    <div className="h-full flex items-center justify-center">
                      <span className="text-[10px] text-text-muted/50">—</span>
                    </div>
                  ) : (
                    dayEvents.map((event) => (
                      <CalendarEventChip key={event.event_id} event={event} />
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Empty week state */}
      {(events ?? []).length === 0 && (
        <div className="text-center py-8">
          <CalendarDots className="w-10 h-10 text-text-muted mx-auto mb-2" />
          <p className="text-sm text-text-muted">
            No events scheduled this week.
          </p>
        </div>
      )}
    </div>
  );
}

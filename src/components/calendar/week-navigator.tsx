"use client";

import { CaretLeft, CaretRight } from "@phosphor-icons/react";

interface WeekNavigatorProps {
  weekStart: string; // YYYY-MM-DD (Monday)
  onPrevWeek: () => void;
  onNextWeek: () => void;
  onToday: () => void;
}

function formatWeekRange(mondayStr: string): string {
  const monday = new Date(mondayStr + "T00:00:00");
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);

  const monthFmt = { month: "short" as const, day: "numeric" as const };
  const startLabel = monday.toLocaleDateString("en-US", monthFmt);

  if (monday.getMonth() === sunday.getMonth()) {
    return `${startLabel} – ${sunday.getDate()}, ${monday.getFullYear()}`;
  }
  const endLabel = sunday.toLocaleDateString("en-US", monthFmt);
  return `${startLabel} – ${endLabel}, ${monday.getFullYear()}`;
}

export function WeekNavigator({
  weekStart,
  onPrevWeek,
  onNextWeek,
  onToday,
}: WeekNavigatorProps) {
  return (
    <div className="flex items-center gap-2">
      <button
        onClick={onPrevWeek}
        className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
        aria-label="Previous week"
      >
        <CaretLeft className="w-4 h-4" />
      </button>

      <span className="text-sm font-medium text-text-primary min-w-[180px] text-center">
        {formatWeekRange(weekStart)}
      </span>

      <button
        onClick={onNextWeek}
        className="p-2 rounded-lg hover:bg-surface-secondary transition-colors text-text-secondary"
        aria-label="Next week"
      >
        <CaretRight className="w-4 h-4" />
      </button>

      <button
        onClick={onToday}
        className="ml-2 px-3 py-1.5 text-xs font-medium text-primary bg-primary-light hover:bg-primary/20 rounded-lg transition-colors"
      >
        Today
      </button>
    </div>
  );
}

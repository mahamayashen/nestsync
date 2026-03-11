"use client";

import { Star, Check } from "@phosphor-icons/react";

interface CalendarEventChipProps {
  event: {
    event_id: string;
    event_type: string;
    event_title: string;
    event_status: string;
    metadata_int: number | null;
    member_display_name: string | null;
  };
}

const typeStyles: Record<string, string> = {
  chore: "bg-primary-light text-primary border-primary/20",
  expense: "bg-highlight-light text-highlight border-highlight/20",
  proposal: "bg-accent-light text-accent border-accent/20",
};

export function CalendarEventChip({ event }: CalendarEventChipProps) {
  const isCompleted = event.event_status === "completed";
  const style = typeStyles[event.event_type] ?? typeStyles.chore;

  return (
    <div
      className={`text-xs px-2 py-1.5 rounded-lg border truncate ${style} ${
        isCompleted ? "opacity-50" : ""
      }`}
      title={`${event.event_title}${event.member_display_name ? ` — ${event.member_display_name}` : ""}`}
    >
      <div className="flex items-center gap-1 min-w-0">
        {isCompleted && <Check className="w-3 h-3 flex-shrink-0" />}
        <span className="truncate font-medium">{event.event_title}</span>
        {event.event_type === "chore" && event.metadata_int != null && (
          <span className="flex items-center gap-0.5 flex-shrink-0 ml-auto">
            <Star className="w-2.5 h-2.5" />
            {event.metadata_int}
          </span>
        )}
      </div>
      {event.member_display_name && (
        <p className="truncate opacity-70 mt-0.5">
          {event.member_display_name}
        </p>
      )}
    </div>
  );
}

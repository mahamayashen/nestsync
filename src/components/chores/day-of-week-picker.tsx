"use client";

const DAYS = [
  { label: "Mon", value: 1 },
  { label: "Tue", value: 2 },
  { label: "Wed", value: 3 },
  { label: "Thu", value: 4 },
  { label: "Fri", value: 5 },
  { label: "Sat", value: 6 },
  { label: "Sun", value: 0 },
];

const ALL_DAYS = new Set([0, 1, 2, 3, 4, 5, 6]);
const WEEKDAYS = new Set([1, 2, 3, 4, 5]);

function setsEqual(a: Set<number>, b: Set<number>) {
  if (a.size !== b.size) return false;
  for (const v of a) if (!b.has(v)) return false;
  return true;
}

interface DayOfWeekPickerProps {
  selectedDays: Set<number>;
  onToggle: (day: number) => void;
  onSelectAll: () => void;
  onSelectWeekdays: () => void;
}

export function DayOfWeekPicker({
  selectedDays,
  onToggle,
  onSelectAll,
  onSelectWeekdays,
}: DayOfWeekPickerProps) {
  const isDaily = setsEqual(selectedDays, ALL_DAYS);
  const isWeekdays = setsEqual(selectedDays, WEEKDAYS);

  return (
    <div className="space-y-2">
      <div className="flex gap-1.5">
        {DAYS.map((day) => {
          const active = selectedDays.has(day.value);
          return (
            <button
              key={day.value}
              type="button"
              onClick={() => onToggle(day.value)}
              className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-colors ${
                active
                  ? "bg-primary text-white"
                  : "bg-surface-secondary text-text-secondary hover:bg-surface-secondary/80"
              }`}
            >
              {day.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 text-xs">
        <button
          type="button"
          onClick={onSelectAll}
          className={`font-medium transition-colors ${
            isDaily
              ? "text-primary"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Daily
        </button>
        <button
          type="button"
          onClick={onSelectWeekdays}
          className={`font-medium transition-colors ${
            isWeekdays
              ? "text-primary"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          Weekdays
        </button>
      </div>

      {/* Hidden form inputs for each selected day */}
      {Array.from(selectedDays).map((day) => (
        <input key={day} type="hidden" name="scheduleDays" value={day} />
      ))}

      {/* Derive recurrence for the DB */}
      <input
        type="hidden"
        name="recurrence"
        value={isDaily ? "daily" : "weekly"}
      />
    </div>
  );
}

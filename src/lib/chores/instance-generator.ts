import type { Recurrence } from "@/types";

/**
 * Compute all due dates for a recurrence pattern between fromDate and toDate (inclusive).
 */
export function computeRecurrenceDates(
  recurrence: Recurrence,
  fromDate: Date,
  toDate: Date
): Date[] {
  const dates: Date[] = [];
  const current = new Date(fromDate);

  // Normalize to start of day
  current.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(23, 59, 59, 999);

  switch (recurrence) {
    case "one_time":
      if (current <= end) dates.push(new Date(current));
      break;
    case "daily":
      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      break;
    case "weekly":
      while (current <= end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 7);
      }
      break;
    case "monthly": {
      const targetDay = current.getDate();
      while (current <= end) {
        dates.push(new Date(current));
        // Move to the same day next month, clamped to the last day of that month.
        current.setDate(1);
        current.setMonth(current.getMonth() + 1);
        const daysInMonth = new Date(
          current.getFullYear(),
          current.getMonth() + 1,
          0
        ).getDate();
        current.setDate(Math.min(targetDay, daysInMonth));
      }
      break;
    }
  }

  return dates;
}

/**
 * Get the Monday and Sunday bounding the natural week (Mon–Sun)
 * that contains the given date. Used everywhere to align chore
 * generation, stats, and calendar to the same week boundaries.
 */
export function getWeekBounds(date?: Date): { monday: Date; sunday: Date } {
  const d = new Date(date ?? new Date());
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun, 1=Mon, …, 6=Sat
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1)); // rewind to Monday
  const monday = new Date(d);
  const sunday = new Date(d);
  sunday.setDate(d.getDate() + 6);
  return { monday, sunday };
}

/**
 * Compute due dates for specific weekdays between fromDate and toDate (inclusive).
 * scheduleDays is an array of JS weekday numbers: 0=Sun, 1=Mon, …, 6=Sat.
 */
export function computeScheduledDates(
  scheduleDays: number[],
  fromDate: Date,
  toDate: Date
): Date[] {
  const dates: Date[] = [];
  const current = new Date(fromDate);
  current.setHours(0, 0, 0, 0);
  const end = new Date(toDate);
  end.setHours(23, 59, 59, 999);

  const daySet = new Set(scheduleDays);

  while (current <= end) {
    if (daySet.has(current.getDay())) {
      dates.push(new Date(current));
    }
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

/**
 * Format a Date as YYYY-MM-DD string for the due_date column.
 */
export function formatDateForDB(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

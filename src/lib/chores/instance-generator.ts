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
    case "monthly":
      while (current <= end) {
        dates.push(new Date(current));
        current.setMonth(current.getMonth() + 1);
      }
      break;
  }

  return dates;
}

/**
 * Format a Date as YYYY-MM-DD string for the due_date column.
 */
export function formatDateForDB(date: Date): string {
  return date.toISOString().split("T")[0];
}

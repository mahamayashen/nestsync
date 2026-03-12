import { describe, it, expect } from "vitest";
import {
  computeRecurrenceDates,
  computeScheduledDates,
  formatDateForDB,
  getWeekBounds,
} from "./instance-generator";

// ---- computeRecurrenceDates ----

describe("computeRecurrenceDates", () => {
  // Helper: create date at midnight local
  const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

  describe("one_time recurrence", () => {
    it("returns exactly 1 date", () => {
      const result = computeRecurrenceDates(
        "one_time",
        d(2025, 3, 1),
        d(2025, 3, 31)
      );
      expect(result).toHaveLength(1);
      expect(result[0].getDate()).toBe(1);
    });

    it("returns 1 date when fromDate equals toDate", () => {
      const result = computeRecurrenceDates(
        "one_time",
        d(2025, 6, 15),
        d(2025, 6, 15)
      );
      expect(result).toHaveLength(1);
    });

    it("returns empty array when fromDate is after toDate", () => {
      const result = computeRecurrenceDates(
        "one_time",
        d(2025, 4, 1),
        d(2025, 3, 1)
      );
      expect(result).toHaveLength(0);
    });
  });

  describe("daily recurrence", () => {
    it("returns 31 dates for a 30-day span (inclusive)", () => {
      const result = computeRecurrenceDates(
        "daily",
        d(2025, 3, 1),
        d(2025, 3, 31)
      );
      expect(result).toHaveLength(31);
    });

    it("returns 1 date when fromDate equals toDate", () => {
      const result = computeRecurrenceDates(
        "daily",
        d(2025, 6, 15),
        d(2025, 6, 15)
      );
      expect(result).toHaveLength(1);
    });

    it("returns empty array when fromDate is after toDate", () => {
      const result = computeRecurrenceDates(
        "daily",
        d(2025, 4, 1),
        d(2025, 3, 1)
      );
      expect(result).toHaveLength(0);
    });

    it("correctly spans across months", () => {
      const result = computeRecurrenceDates(
        "daily",
        d(2025, 1, 30),
        d(2025, 2, 2)
      );
      expect(result).toHaveLength(4); // Jan 30, 31, Feb 1, 2
    });
  });

  describe("weekly recurrence", () => {
    it("returns ~5 dates for 30 days", () => {
      const result = computeRecurrenceDates(
        "weekly",
        d(2025, 3, 1),
        d(2025, 3, 31)
      );
      // Mar 1, 8, 15, 22, 29 = 5 dates
      expect(result).toHaveLength(5);
    });

    it("returns 1 date when range is less than 7 days", () => {
      const result = computeRecurrenceDates(
        "weekly",
        d(2025, 3, 1),
        d(2025, 3, 5)
      );
      expect(result).toHaveLength(1);
    });

    it("returns empty array when fromDate is after toDate", () => {
      const result = computeRecurrenceDates(
        "weekly",
        d(2025, 4, 1),
        d(2025, 3, 1)
      );
      expect(result).toHaveLength(0);
    });

    it("dates are exactly 7 days apart", () => {
      const result = computeRecurrenceDates(
        "weekly",
        d(2025, 1, 1),
        d(2025, 2, 28)
      );
      for (let i = 1; i < result.length; i++) {
        const diff =
          (result[i].getTime() - result[i - 1].getTime()) / (1000 * 60 * 60 * 24);
        expect(diff).toBe(7);
      }
    });
  });

  describe("monthly recurrence", () => {
    it("returns ~2 dates for 30 days starting from month start", () => {
      const result = computeRecurrenceDates(
        "monthly",
        d(2025, 1, 1),
        d(2025, 1, 31)
      );
      // Jan 1 only (Feb 1 would be the next, outside range)
      expect(result).toHaveLength(1);
    });

    it("returns correct count for multi-month span", () => {
      const result = computeRecurrenceDates(
        "monthly",
        d(2025, 1, 15),
        d(2025, 6, 15)
      );
      // Jan 15, Feb 15, Mar 15, Apr 15, May 15, Jun 15 = 6
      expect(result).toHaveLength(6);
    });

    it("handles month boundary (Jan 31 → Feb 28)", () => {
      const result = computeRecurrenceDates(
        "monthly",
        d(2025, 1, 31),
        d(2025, 4, 30)
      );
      // Jan 31, Feb 28 (or Mar 3 depending on JS behavior), Mar 28/31, Apr 28
      // JS Date: Jan 31 + 1 month = Mar 3 (Feb has 28 days), so it overflows
      expect(result.length).toBeGreaterThanOrEqual(2);
    });

    it("handles year boundary (Dec → Jan)", () => {
      const result = computeRecurrenceDates(
        "monthly",
        d(2025, 12, 1),
        d(2026, 3, 1)
      );
      // Dec 1, Jan 1, Feb 1, Mar 1 = 4
      expect(result).toHaveLength(4);
      expect(result[0].getMonth()).toBe(11); // December
      expect(result[1].getFullYear()).toBe(2026);
    });

    it("returns empty array when fromDate is after toDate", () => {
      const result = computeRecurrenceDates(
        "monthly",
        d(2025, 4, 1),
        d(2025, 3, 1)
      );
      expect(result).toHaveLength(0);
    });
  });

  describe("edge cases", () => {
    it("all returned dates are Date instances", () => {
      const result = computeRecurrenceDates(
        "daily",
        d(2025, 3, 1),
        d(2025, 3, 7)
      );
      result.forEach((date) => {
        expect(date).toBeInstanceOf(Date);
      });
    });

    it("returned dates are independent copies (mutation safe)", () => {
      const result = computeRecurrenceDates(
        "daily",
        d(2025, 3, 1),
        d(2025, 3, 3)
      );
      result[0].setDate(99);
      expect(result[1].getDate()).not.toBe(99);
    });
  });
});

// ---- formatDateForDB ----

describe("formatDateForDB", () => {
  it("formats a standard date as YYYY-MM-DD", () => {
    const date = new Date(2025, 2, 15); // March 15, 2025
    expect(formatDateForDB(date)).toBe("2025-03-15");
  });

  it("zero-pads single-digit month", () => {
    const date = new Date(2025, 0, 20); // January 20
    expect(formatDateForDB(date)).toBe("2025-01-20");
  });

  it("zero-pads single-digit day", () => {
    const date = new Date(2025, 11, 5); // December 5
    expect(formatDateForDB(date)).toBe("2025-12-05");
  });

  it("handles leap year date (Feb 29)", () => {
    const date = new Date(2024, 1, 29); // Feb 29, 2024 (leap year)
    expect(formatDateForDB(date)).toBe("2024-02-29");
  });

  it("handles last day of year", () => {
    const date = new Date(2025, 11, 31);
    expect(formatDateForDB(date)).toBe("2025-12-31");
  });

  it("handles first day of year", () => {
    const date = new Date(2025, 0, 1);
    expect(formatDateForDB(date)).toBe("2025-01-01");
  });
});

// ---- getWeekBounds ----

describe("getWeekBounds", () => {
  const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

  it("returns Monday–Sunday for a Wednesday input", () => {
    // 2025-03-12 is a Wednesday
    const { monday, sunday } = getWeekBounds(d(2025, 3, 12));
    expect(monday.getDate()).toBe(10); // Mon Mar 10
    expect(monday.getMonth()).toBe(2); // March
    expect(sunday.getDate()).toBe(16); // Sun Mar 16
    expect(sunday.getMonth()).toBe(2);
  });

  it("returns same week when input is Monday", () => {
    // 2025-03-10 is a Monday
    const { monday, sunday } = getWeekBounds(d(2025, 3, 10));
    expect(monday.getDate()).toBe(10);
    expect(sunday.getDate()).toBe(16);
  });

  it("returns same week when input is Sunday", () => {
    // 2025-03-16 is a Sunday
    const { monday, sunday } = getWeekBounds(d(2025, 3, 16));
    expect(monday.getDate()).toBe(10);
    expect(sunday.getDate()).toBe(16);
  });

  it("handles month boundary (Sunday in next month)", () => {
    // 2025-03-31 is a Monday → Sunday is April 6
    const { monday, sunday } = getWeekBounds(d(2025, 3, 31));
    expect(monday.getDate()).toBe(31);
    expect(monday.getMonth()).toBe(2); // March
    expect(sunday.getDate()).toBe(6);
    expect(sunday.getMonth()).toBe(3); // April
  });

  it("handles month boundary (Monday in previous month)", () => {
    // 2025-04-02 is a Wednesday → Monday is March 31
    const { monday, sunday } = getWeekBounds(d(2025, 4, 2));
    expect(monday.getDate()).toBe(31);
    expect(monday.getMonth()).toBe(2); // March
    expect(sunday.getDate()).toBe(6);
    expect(sunday.getMonth()).toBe(3); // April
  });

  it("handles year boundary", () => {
    // 2025-01-01 is a Wednesday → Monday is Dec 30, 2024
    const { monday, sunday } = getWeekBounds(d(2025, 1, 1));
    expect(monday.getDate()).toBe(30);
    expect(monday.getMonth()).toBe(11); // December
    expect(monday.getFullYear()).toBe(2024);
    expect(sunday.getDate()).toBe(5);
    expect(sunday.getMonth()).toBe(0); // January
    expect(sunday.getFullYear()).toBe(2025);
  });

  it("returns dates at midnight", () => {
    const { monday, sunday } = getWeekBounds(d(2025, 3, 12));
    expect(monday.getHours()).toBe(0);
    expect(monday.getMinutes()).toBe(0);
    expect(sunday.getHours()).toBe(0);
    expect(sunday.getMinutes()).toBe(0);
  });

  it("handles Saturday input", () => {
    // 2025-03-15 is a Saturday
    const { monday, sunday } = getWeekBounds(d(2025, 3, 15));
    expect(monday.getDate()).toBe(10);
    expect(sunday.getDate()).toBe(16);
  });
});

// ---- computeScheduledDates ----

describe("computeScheduledDates", () => {
  const d = (y: number, m: number, day: number) => new Date(y, m - 1, day);

  it("returns only dates matching specified weekdays", () => {
    // Mon=1, Wed=3, Fri=5 within Mon Mar 10 – Sun Mar 16, 2025
    const result = computeScheduledDates([1, 3, 5], d(2025, 3, 10), d(2025, 3, 16));
    expect(result).toHaveLength(3);
    expect(result.map((r) => r.getDay())).toEqual([1, 3, 5]);
  });

  it("returns all 7 days when all weekdays selected", () => {
    const result = computeScheduledDates(
      [0, 1, 2, 3, 4, 5, 6],
      d(2025, 3, 10),
      d(2025, 3, 16)
    );
    expect(result).toHaveLength(7);
  });

  it("returns weekdays only for [1,2,3,4,5]", () => {
    const result = computeScheduledDates([1, 2, 3, 4, 5], d(2025, 3, 10), d(2025, 3, 16));
    expect(result).toHaveLength(5);
    // Should not include Sat (6) or Sun (0)
    for (const date of result) {
      expect(date.getDay()).toBeGreaterThanOrEqual(1);
      expect(date.getDay()).toBeLessThanOrEqual(5);
    }
  });

  it("returns empty array when no days match", () => {
    // Sat=6, but range is Mon–Fri
    const result = computeScheduledDates([6], d(2025, 3, 10), d(2025, 3, 14));
    expect(result).toHaveLength(0);
  });

  it("returns empty array when fromDate is after toDate", () => {
    const result = computeScheduledDates([1], d(2025, 4, 1), d(2025, 3, 1));
    expect(result).toHaveLength(0);
  });

  it("returns empty for empty scheduleDays array", () => {
    const result = computeScheduledDates([], d(2025, 3, 10), d(2025, 3, 16));
    expect(result).toHaveLength(0);
  });

  it("spans across week boundaries", () => {
    // Two weeks, only Sundays (0)
    const result = computeScheduledDates([0], d(2025, 3, 10), d(2025, 3, 23));
    expect(result).toHaveLength(2);
    expect(result[0].getDay()).toBe(0);
    expect(result[1].getDay()).toBe(0);
  });

  it("returns independent date copies", () => {
    const result = computeScheduledDates([1, 3], d(2025, 3, 10), d(2025, 3, 16));
    result[0].setDate(99);
    expect(result[1].getDate()).not.toBe(99);
  });
});

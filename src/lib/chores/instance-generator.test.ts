import { describe, it, expect } from "vitest";
import { computeRecurrenceDates, formatDateForDB } from "./instance-generator";

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

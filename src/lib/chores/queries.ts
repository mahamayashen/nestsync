import { createClient } from "@/lib/supabase/server";
import { computeRecurrenceDates, formatDateForDB } from "./instance-generator";
import type { Recurrence } from "@/types";

export type ChoreInstanceRow = {
  id: string;
  title: string;
  points: number;
  due_date: string;
  assigned_to: string | null;
  status: string;
  assigned_member: { id: string; users: { display_name: string } } | null;
  completed_member?: { id: string; users: { display_name: string } } | null;
};

export type ChoreTemplateRow = {
  id: string;
  title: string;
  description: string | null;
  points: number;
  recurrence: string;
  assigned_member: { id: string; users: { display_name: string } } | null;
  creator: { id: string; users: { display_name: string } } | null;
};

export async function getChoreInstances(
  householdId: string,
  filters?: {
    status?: "pending" | "completed" | "cancelled";
    assignedTo?: string | null;
    dateFrom?: string;
    dateTo?: string;
  }
): Promise<ChoreInstanceRow[]> {
  const supabase = await createClient();

  let query = supabase
    .from("chore_instances")
    .select(
      `
      *,
      assigned_member:household_members!chore_instances_assigned_to_fkey(
        id,
        users!inner(display_name)
      ),
      completed_member:household_members!chore_instances_completed_by_fkey(
        id,
        users!inner(display_name)
      )
    `
    )
    .eq("household_id", householdId);

  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.assignedTo !== undefined) {
    if (filters.assignedTo === null) {
      query = query.is("assigned_to", null);
    } else {
      query = query.eq("assigned_to", filters.assignedTo);
    }
  }
  if (filters?.dateFrom) query = query.gte("due_date", filters.dateFrom);
  if (filters?.dateTo) query = query.lte("due_date", filters.dateTo);

  query = query.order("due_date", { ascending: true });

  const { data, error } = await query;
  if (error) return [];
  return data as unknown as ChoreInstanceRow[];
}

export async function getChoreTemplates(householdId: string): Promise<ChoreTemplateRow[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("chore_templates")
    .select(
      `
      *,
      assigned_member:household_members!chore_templates_assigned_to_fkey(
        id,
        users!inner(display_name)
      ),
      creator:household_members!chore_templates_created_by_fkey(
        id,
        users!inner(display_name)
      )
    `
    )
    .eq("household_id", householdId)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as unknown as ChoreTemplateRow[];
}

export async function getWeeklyChoreStats(householdId: string) {
  const supabase = await createClient();

  // Get the start of the current week (Monday) using local date boundaries
  const now = new Date();
  const dayOfWeek = now.getDay();
  const monday = new Date(now);
  monday.setHours(0, 0, 0, 0);
  monday.setDate(monday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  sunday.setHours(23, 59, 59, 999);

  const { data, error } = await supabase
    .from("chore_instances")
    .select(
      `
      completed_by,
      points,
      completed_member:household_members!chore_instances_completed_by_fkey(
        id,
        users!inner(display_name)
      )
    `
    )
    .eq("household_id", householdId)
    .eq("status", "completed")
    .not("completed_by", "is", null)
    .gte("completed_at", monday.toISOString())
    .lte("completed_at", sunday.toISOString());

  if (error || !data) return [];

  // Aggregate by completed_by
  const statsMap = new Map<
    string,
    { memberId: string; displayName: string; points: number; count: number }
  >();

  for (const row of data) {
    const memberId = row.completed_by!;
    const existing = statsMap.get(memberId);
    const member = row.completed_member as unknown as {
      id: string;
      users: { display_name: string };
    } | null;
    const displayName = member?.users?.display_name ?? "Unknown";

    if (existing) {
      existing.points += row.points;
      existing.count += 1;
    } else {
      statsMap.set(memberId, {
        memberId,
        displayName,
        points: row.points,
        count: 1,
      });
    }
  }

  return Array.from(statsMap.values()).sort((a, b) => b.points - a.points);
}

// ---- Insightful Stat Queries ----

/**
 * Completion streak: consecutive days (going back from yesterday) where all
 * assigned chores for the household (or a specific member) were completed.
 */
export async function getCompletionStreak(
  householdId: string,
  memberId?: string
): Promise<number> {
  const supabase = await createClient();

  // Look back up to 60 days for streak calculation
  const now = new Date();
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  const lookback = new Date(now);
  lookback.setDate(lookback.getDate() - 60);

  const yesterdayStr = formatDateForDB(yesterday);
  const lookbackStr = formatDateForDB(lookback);

  // Fetch all instances (pending + completed) in the lookback window
  let query = supabase
    .from("chore_instances")
    .select("due_date, status")
    .eq("household_id", householdId)
    .in("status", ["pending", "completed"])
    .gte("due_date", lookbackStr)
    .lte("due_date", yesterdayStr);

  if (memberId) {
    query = query.eq("assigned_to", memberId);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) return 0;

  // Group by date: check if all instances for that day are completed
  const dateMap = new Map<string, { total: number; completed: number }>();
  for (const row of data) {
    const entry = dateMap.get(row.due_date) ?? { total: 0, completed: 0 };
    entry.total++;
    if (row.status === "completed") entry.completed++;
    dateMap.set(row.due_date, entry);
  }

  // Walk backwards from yesterday counting consecutive complete days
  let streak = 0;
  const cursor = new Date(yesterday);
  while (true) {
    const dateStr = formatDateForDB(cursor);
    const entry = dateMap.get(dateStr);
    // If no chores existed that day, skip it (don't break streak)
    if (!entry) {
      cursor.setDate(cursor.getDate() - 1);
      if (cursor < lookback) break;
      continue;
    }
    // If all chores were completed, streak continues
    if (entry.completed === entry.total) {
      streak++;
      cursor.setDate(cursor.getDate() - 1);
      if (cursor < lookback) break;
    } else {
      break;
    }
  }

  return streak;
}

/**
 * On-time rate: percentage of chores completed on or before the due date.
 * Looks at the last 30 days of completed chores.
 */
export async function getOnTimeRate(
  householdId: string,
  memberId?: string
): Promise<{ onTime: number; total: number; rate: number }> {
  const supabase = await createClient();

  const now = new Date();
  const thirtyDaysAgo = new Date(now);
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  let query = supabase
    .from("chore_instances")
    .select("due_date, completed_at")
    .eq("household_id", householdId)
    .eq("status", "completed")
    .gte("completed_at", thirtyDaysAgo.toISOString());

  if (memberId) {
    query = query.eq("completed_by", memberId);
  }

  const { data, error } = await query;
  if (error || !data || data.length === 0) {
    return { onTime: 0, total: 0, rate: 0 };
  }

  let onTime = 0;
  for (const row of data) {
    if (row.completed_at) {
      // Compare just the date portion
      const completedDate = row.completed_at.slice(0, 10);
      if (completedDate <= row.due_date) {
        onTime++;
      }
    }
  }

  return {
    onTime,
    total: data.length,
    rate: data.length > 0 ? Math.round((onTime / data.length) * 100) : 0,
  };
}

/**
 * Week-over-week comparison: total points earned this week vs last week.
 */
export async function getWeekComparison(
  householdId: string,
  memberId?: string
): Promise<{ thisWeek: number; lastWeek: number; diff: number }> {
  const supabase = await createClient();

  const now = new Date();
  const dayOfWeek = now.getDay();
  const thisMonday = new Date(now);
  thisMonday.setHours(0, 0, 0, 0);
  thisMonday.setDate(thisMonday.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  const lastMonday = new Date(thisMonday);
  lastMonday.setDate(lastMonday.getDate() - 7);

  const thisSunday = new Date(thisMonday);
  thisSunday.setDate(thisMonday.getDate() + 6);
  thisSunday.setHours(23, 59, 59, 999);

  const lastSunday = new Date(lastMonday);
  lastSunday.setDate(lastMonday.getDate() + 6);
  lastSunday.setHours(23, 59, 59, 999);

  // Fetch completed chores from both weeks in a single query
  let query = supabase
    .from("chore_instances")
    .select("points, completed_at")
    .eq("household_id", householdId)
    .eq("status", "completed")
    .gte("completed_at", lastMonday.toISOString())
    .lte("completed_at", thisSunday.toISOString());

  if (memberId) {
    query = query.eq("completed_by", memberId);
  }

  const { data, error } = await query;
  if (error || !data) return { thisWeek: 0, lastWeek: 0, diff: 0 };

  let thisWeek = 0;
  let lastWeek = 0;

  for (const row of data) {
    if (!row.completed_at) continue;
    const completedAt = new Date(row.completed_at);
    if (completedAt >= thisMonday) {
      thisWeek += row.points;
    } else {
      lastWeek += row.points;
    }
  }

  return { thisWeek, lastWeek, diff: thisWeek - lastWeek };
}

/**
 * Today's household progress: how many of today's chores are done.
 */
export async function getTodayProgress(
  householdId: string
): Promise<{ completed: number; total: number }> {
  const supabase = await createClient();

  const todayStr = formatDateForDB(new Date());

  const { data, error } = await supabase
    .from("chore_instances")
    .select("status")
    .eq("household_id", householdId)
    .eq("due_date", todayStr)
    .in("status", ["pending", "completed"]);

  if (error || !data) return { completed: 0, total: 0 };

  const completed = data.filter((r) => r.status === "completed").length;
  return { completed, total: data.length };
}

/**
 * Ensure pending chore instances exist for the next 7 days for all active
 * recurring templates. Also cancels any pending instances beyond the 7-day
 * window (cleanup from the old 30-day generation).
 *
 * Safe to call on every page load — skips dates that already have a pending
 * instance and the partial unique index prevents races.
 */
export async function replenishInstances(householdId: string): Promise<void> {
  const supabase = await createClient();

  const today = new Date();
  const todayStr = formatDateForDB(today);
  const sevenDaysOut = new Date();
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);
  const sevenDaysStr = formatDateForDB(sevenDaysOut);

  // 1. Fetch active recurring templates
  const { data: templates } = await supabase
    .from("chore_templates")
    .select("id, title, points, recurrence, assigned_to")
    .eq("household_id", householdId)
    .is("deleted_at", null)
    .neq("recurrence", "one_time");

  if (!templates || templates.length === 0) return;

  // 2. Fetch existing instances (pending OR completed) in the 7-day window.
  //    We must include completed instances so we don't re-create a chore
  //    for a date that was already fulfilled.
  const templateIds = templates.map((t) => t.id);
  const { data: existingInstances } = await supabase
    .from("chore_instances")
    .select("template_id, due_date")
    .eq("household_id", householdId)
    .in("status", ["pending", "completed"])
    .in("template_id", templateIds)
    .gte("due_date", todayStr)
    .lte("due_date", sevenDaysStr);

  // Build a set of "templateId:dueDate" for quick lookup
  const existingSet = new Set(
    (existingInstances ?? []).map((i) => `${i.template_id}:${i.due_date}`)
  );

  // 3. Compute missing instances
  const toInsert: {
    template_id: string;
    household_id: string;
    title: string;
    points: number;
    assigned_to: string | null;
    due_date: string;
    status: "pending";
  }[] = [];

  for (const template of templates) {
    const dates = computeRecurrenceDates(
      template.recurrence as Recurrence,
      today,
      sevenDaysOut
    );

    for (const date of dates) {
      const dateStr = formatDateForDB(date);
      const key = `${template.id}:${dateStr}`;
      if (!existingSet.has(key)) {
        toInsert.push({
          template_id: template.id,
          household_id: householdId,
          title: template.title,
          points: template.points,
          assigned_to: template.assigned_to,
          due_date: dateStr,
          status: "pending",
        });
      }
    }
  }

  // 4. Batch insert missing instances
  if (toInsert.length > 0) {
    await supabase.from("chore_instances").insert(toInsert);
  }

  // 5. Cancel pending instances beyond the 7-day window (cleanup old 30-day data)
  await supabase
    .from("chore_instances")
    .update({ status: "cancelled" as const })
    .eq("household_id", householdId)
    .eq("status", "pending")
    .in("template_id", templateIds)
    .gt("due_date", sevenDaysStr);
}

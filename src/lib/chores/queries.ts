import { createClient } from "@/lib/supabase/server";

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

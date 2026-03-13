"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/household/queries";
import {
  createChoreTemplateSchema,
  completeChoreSchema,
  deleteChoreTemplateSchema,
  reassignChoreSchema,
} from "./validation";
import {
  computeRecurrenceDates,
  computeScheduledDates,
  formatDateForDB,
  getWeekBounds,
} from "./instance-generator";
import { ensureWeekInstances } from "./queries";

type ActionResult = { error?: string; success?: boolean };

// ---- SHARED: parse + insert chore template ----
async function insertChoreTemplate(
  formData: FormData
): Promise<ActionResult> {
  // Resolve assignedTo: prefer explicit form field, fall back to current member
  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not authenticated" };

  const rawAssignedTo = formData.get("assignedTo");
  const assignedTo =
    typeof rawAssignedTo === "string" && rawAssignedTo.length > 0
      ? rawAssignedTo
      : membership.memberId; // self-assign as fallback

  const rawScheduleDays = formData.getAll("scheduleDays");
  const parsed = createChoreTemplateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") ?? undefined,
    points: formData.get("points"),
    recurrence: formData.get("recurrence"),
    scheduleDays: rawScheduleDays.length > 0 ? rawScheduleDays : null,
    dueDate: formData.get("dueDate") || null,
    assignedTo,
  });

  if (!parsed.success) {
    const messages = parsed.error.issues.map((i) => i.message).join("; ");
    console.error("Chore validation failed:", messages, {
      title: formData.get("title"),
      recurrence: formData.get("recurrence"),
      assignedTo,
      dueDate: formData.get("dueDate"),
      scheduleDays: rawScheduleDays,
    });
    return { error: messages };
  }

  const supabase = await createClient();

  const scheduleDays =
    parsed.data.scheduleDays && parsed.data.scheduleDays.length > 0
      ? parsed.data.scheduleDays
      : null;

  // 1. Insert the template
  const { data: template, error: templateError } = await supabase
    .from("chore_templates")
    .insert({
      household_id: membership.householdId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      points: parsed.data.points,
      recurrence: parsed.data.recurrence,
      schedule_days: scheduleDays,
      assigned_to: parsed.data.assignedTo,
      created_by: membership.memberId,
    })
    .select("id, title, points, recurrence, assigned_to")
    .single();

  if (templateError || !template) {
    console.error("Chore template insert error:", templateError);
    return {
      error: templateError?.message
        ? `Create failed: ${templateError.message}`
        : "Failed to create chore template. Please try again.",
    };
  }

  // 2. Generate instances (use parsed form data, not template row)
  const today = new Date();
  const { sunday } = getWeekBounds(today);

  let dates: Date[];
  if (parsed.data.recurrence === "one_time") {
    const oneTimeDate = parsed.data.dueDate
      ? new Date(parsed.data.dueDate + "T00:00:00")
      : today;
    dates = [oneTimeDate];
  } else if (scheduleDays && scheduleDays.length > 0) {
    dates = computeScheduledDates(scheduleDays, today, sunday);
  } else {
    dates = computeRecurrenceDates(parsed.data.recurrence, today, sunday);
  }

  if (dates.length > 0) {
    const instances = dates.map((date) => ({
      template_id: template.id,
      household_id: membership.householdId,
      title: template.title,
      points: template.points,
      assigned_to: template.assigned_to,
      due_date: formatDateForDB(date),
      status: "pending" as const,
    }));

    const { error: instancesError } = await supabase
      .from("chore_instances")
      .insert(instances);

    if (instancesError) {
      console.error("Instance generation error:", instancesError);
    }
  }

  return { success: true };
}

// ---- CREATE CHORE TEMPLATE (full-page form — redirects) ----
export async function createChoreTemplate(
  formData: FormData
): Promise<ActionResult> {
  const result = await insertChoreTemplate(formData);
  if (result.error) return result;
  redirect("/dashboard/my");
}

// ---- CREATE CHORE QUICK (calendar inline — no redirect) ----
export async function createChoreQuick(
  formData: FormData
): Promise<ActionResult> {
  return insertChoreTemplate(formData);
}

// ---- COMPLETE A CHORE ----
export async function completeChore(
  formData: FormData
): Promise<ActionResult> {
  const parsed = completeChoreSchema.safeParse({
    instanceId: formData.get("instanceId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { error } = await supabase
    .from("chore_instances")
    .update({
      status: "completed",
      completed_at: new Date().toISOString(),
      completed_by: membership.memberId,
    })
    .eq("id", parsed.data.instanceId)
    .eq("household_id", membership.householdId)
    .eq("status", "pending");

  if (error) {
    return { error: "Failed to complete chore. Please try again." };
  }

  return { success: true };
}

// ---- SOFT-DELETE A CHORE TEMPLATE ----
export async function deleteChoreTemplate(
  formData: FormData
): Promise<ActionResult> {
  const parsed = deleteChoreTemplateSchema.safeParse({
    templateId: formData.get("templateId"),
  });

  if (!parsed.success) {
    console.error("Delete chore validation failed:", parsed.error.issues);
    return { error: parsed.error.issues[0].message };
  }

  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not authenticated" };

  const supabase = await createClient();

  // Non-admin: check D3 permission (members_can_edit_own_chores) + ownership
  if (membership.role !== "admin") {
    const { data: household, error: householdError } = await supabase
      .from("households")
      .select("members_can_edit_own_chores")
      .eq("id", membership.householdId)
      .single();

    if (householdError || !household) {
      console.error("Household lookup failed:", householdError);
      return { error: "Household not found" };
    }

    if (!household.members_can_edit_own_chores) {
      return { error: "Only the admin can delete chore templates" };
    }

    const { data: template } = await supabase
      .from("chore_templates")
      .select("created_by")
      .eq("id", parsed.data.templateId)
      .eq("household_id", membership.householdId)
      .single();

    if (!template || template.created_by !== membership.memberId) {
      return { error: "You can only delete templates you created" };
    }
  }

  // Soft delete (D4: pending instances survive)
  const { error } = await supabase
    .from("chore_templates")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.templateId)
    .eq("household_id", membership.householdId);

  if (error) {
    console.error("Chore template soft-delete error:", error);
    return {
      error: error.message
        ? `Delete failed: ${error.message}`
        : "Failed to delete template. Please try again.",
    };
  }

  return { success: true };
}

// ---- REASSIGN CHORE (admin-only) ----
export async function reassignChore(
  formData: FormData
): Promise<ActionResult> {
  const parsed = reassignChoreSchema.safeParse({
    templateId: formData.get("templateId"),
    newAssignee: formData.get("newAssignee"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not authenticated" };

  if (membership.role !== "admin") {
    return { error: "Only admins can reassign chores" };
  }

  const supabase = await createClient();

  // Update the template
  const { error: templateError } = await supabase
    .from("chore_templates")
    .update({ assigned_to: parsed.data.newAssignee })
    .eq("id", parsed.data.templateId)
    .eq("household_id", membership.householdId);

  if (templateError) {
    return { error: "Failed to reassign chore. Please try again." };
  }

  // Update all future pending instances for this template
  const todayStr = formatDateForDB(new Date());
  await supabase
    .from("chore_instances")
    .update({ assigned_to: parsed.data.newAssignee })
    .eq("template_id", parsed.data.templateId)
    .eq("household_id", membership.householdId)
    .eq("status", "pending")
    .gte("due_date", todayStr);

  return { success: true };
}

// ---- ENSURE WEEK INSTANCES (for calendar on-demand generation) ----
export async function ensureWeekInstancesAction(
  weekStart: string
): Promise<void> {
  const membership = await getCurrentMembership();
  if (!membership) return;

  await ensureWeekInstances(membership.householdId, weekStart);
}

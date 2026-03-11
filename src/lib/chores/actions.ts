"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/household/queries";
import {
  createChoreTemplateSchema,
  completeChoreSchema,
  deleteChoreTemplateSchema,
} from "./validation";
import { computeRecurrenceDates, formatDateForDB } from "./instance-generator";

type ActionResult = { error?: string; success?: boolean };

// ---- CREATE CHORE TEMPLATE ----
export async function createChoreTemplate(
  formData: FormData
): Promise<ActionResult> {
  const parsed = createChoreTemplateSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    points: formData.get("points"),
    recurrence: formData.get("recurrence"),
    assignedTo: formData.get("assignedTo"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not authenticated" };

  const supabase = await createClient();

  // 1. Insert the template
  const { data: template, error: templateError } = await supabase
    .from("chore_templates")
    .insert({
      household_id: membership.householdId,
      title: parsed.data.title,
      description: parsed.data.description || null,
      points: parsed.data.points,
      recurrence: parsed.data.recurrence,
      assigned_to: parsed.data.assignedTo,
      created_by: membership.memberId,
    })
    .select("id, title, points, recurrence, assigned_to")
    .single();

  if (templateError || !template) {
    return { error: "Failed to create chore template. Please try again." };
  }

  // 2. Generate instances for the next 7 days (rolling window)
  const today = new Date();
  const sevenDaysOut = new Date();
  sevenDaysOut.setDate(sevenDaysOut.getDate() + 7);

  const dates = computeRecurrenceDates(
    template.recurrence,
    today,
    sevenDaysOut
  );

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

    // Batch insert — the partial unique index (template_id, due_date)
    // WHERE status='pending' prevents duplicates (D27)
    const { error: instancesError } = await supabase
      .from("chore_instances")
      .insert(instances);

    if (instancesError) {
      console.error("Instance generation error:", instancesError);
    }
  }

  redirect("/dashboard/my");
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
    return { error: parsed.error.issues[0].message };
  }

  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not authenticated" };

  const supabase = await createClient();

  // Check D3 permission: members_can_edit_own_chores
  const { data: household } = await supabase
    .from("households")
    .select("members_can_edit_own_chores")
    .eq("id", membership.householdId)
    .single();

  if (!household) return { error: "Household not found" };

  if (membership.role !== "admin") {
    if (!household.members_can_edit_own_chores) {
      return { error: "Only the admin can delete chore templates" };
    }
    // When members_can_edit_own_chores is enabled, members can only delete their own templates
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
    return { error: "Failed to delete template. Please try again." };
  }

  return { success: true };
}

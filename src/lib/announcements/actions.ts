"use server";

import { createClient } from "@/lib/supabase/server";
import { getCurrentMembership } from "@/lib/household/queries";
import {
  createAnnouncementSchema,
  togglePinSchema,
  deleteAnnouncementSchema,
  toggleReactionSchema,
} from "./validation";

type ActionResult = { error?: string; success?: boolean };

// ---- CREATE ANNOUNCEMENT ----
export async function createAnnouncement(
  formData: FormData
): Promise<ActionResult> {
  const parsed = createAnnouncementSchema.safeParse({
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { error } = await supabase.from("announcements").insert({
    household_id: membership.householdId,
    author_id: membership.memberId,
    content: parsed.data.content,
  });

  if (error) {
    return { error: "Failed to post announcement. Please try again." };
  }

  return { success: true };
}

// ---- TOGGLE PIN ----
export async function togglePinAnnouncement(
  formData: FormData
): Promise<ActionResult> {
  const parsed = togglePinSchema.safeParse({
    announcementId: formData.get("announcementId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { data: announcement } = await supabase
    .from("announcements")
    .select("author_id, is_pinned")
    .eq("id", parsed.data.announcementId)
    .eq("household_id", membership.householdId)
    .is("deleted_at", null)
    .single();

  if (!announcement) return { error: "Announcement not found" };

  if (
    membership.role !== "admin" &&
    announcement.author_id !== membership.memberId
  ) {
    return { error: "You don't have permission to pin this announcement" };
  }

  const { error } = await supabase
    .from("announcements")
    .update({ is_pinned: !announcement.is_pinned })
    .eq("id", parsed.data.announcementId);

  if (error) {
    return { error: "Failed to update pin status. Please try again." };
  }

  return { success: true };
}

// ---- SOFT DELETE ----
export async function deleteAnnouncement(
  formData: FormData
): Promise<ActionResult> {
  const parsed = deleteAnnouncementSchema.safeParse({
    announcementId: formData.get("announcementId"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not authenticated" };

  const supabase = await createClient();

  const { data: announcement } = await supabase
    .from("announcements")
    .select("author_id")
    .eq("id", parsed.data.announcementId)
    .eq("household_id", membership.householdId)
    .is("deleted_at", null)
    .single();

  if (!announcement) return { error: "Announcement not found" };

  if (
    membership.role !== "admin" &&
    announcement.author_id !== membership.memberId
  ) {
    return { error: "You don't have permission to delete this announcement" };
  }

  const { error } = await supabase
    .from("announcements")
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", parsed.data.announcementId);

  if (error) {
    return { error: "Failed to delete announcement. Please try again." };
  }

  return { success: true };
}

// ---- TOGGLE REACTION ----
export async function toggleReaction(
  formData: FormData
): Promise<ActionResult> {
  const parsed = toggleReactionSchema.safeParse({
    announcementId: formData.get("announcementId"),
    emoji: formData.get("emoji"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const membership = await getCurrentMembership();
  if (!membership) return { error: "Not authenticated" };

  const supabase = await createClient();

  // Check if reaction already exists
  const { data: existing } = await supabase
    .from("announcement_reactions")
    .select("id")
    .eq("announcement_id", parsed.data.announcementId)
    .eq("member_id", membership.memberId)
    .eq("emoji", parsed.data.emoji)
    .maybeSingle();

  if (existing) {
    // Remove reaction
    const { error } = await supabase
      .from("announcement_reactions")
      .delete()
      .eq("id", existing.id);

    if (error) {
      return { error: "Failed to remove reaction. Please try again." };
    }
  } else {
    // Add reaction
    const { error } = await supabase
      .from("announcement_reactions")
      .insert({
        announcement_id: parsed.data.announcementId,
        member_id: membership.memberId,
        emoji: parsed.data.emoji,
      });

    if (error) {
      return { error: "Failed to add reaction. Please try again." };
    }
  }

  return { success: true };
}

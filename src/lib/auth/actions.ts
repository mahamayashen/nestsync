"use server";

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getPostAuthRedirect } from "./redirect";
import {
  loginSchema,
  signupSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  createHouseholdSchema,
  joinHouseholdSchema,
  updateProfileSchema,
  updateEmailSchema,
  changePasswordSchema,
} from "./validation";
import { getCurrentMembership } from "@/lib/household/queries";

// ---- Action Result Type ----
type ActionResult = { error?: string; success?: boolean };

// ---- LOGIN ----
export async function login(formData: FormData): Promise<ActionResult> {
  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  const redirectParam = formData.get("redirect") as string | null;
  const redirectTo = await getPostAuthRedirect(redirectParam);
  redirect(redirectTo);
}

// ---- SIGNUP ----
export async function signup(formData: FormData): Promise<ActionResult> {
  const parsed = signupSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { display_name: parsed.data.displayName },
    },
  });

  if (error) {
    return { error: error.message };
  }

  // Auto-join household if invite code was provided
  const inviteCode = formData.get("inviteCode") as string | null;
  if (inviteCode) {
    const joinResult = await joinHouseholdByCode(inviteCode);
    if (!joinResult.error) {
      redirect("/dashboard");
    }
    // If join fails, fall through to onboarding
  }

  redirect("/onboarding");
}

// ---- FORGOT PASSWORD ----
export async function forgotPassword(
  formData: FormData
): Promise<ActionResult> {
  const parsed = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ||
    (process.env.VERCEL_URL
      ? `https://${process.env.VERCEL_URL}`
      : "http://127.0.0.1:3000");

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${siteUrl}/auth/callback?next=/reset-password`,
  });

  // Always show success for security (don't reveal if email exists)
  return { success: true };
}

// ---- RESET PASSWORD ----
export async function resetPassword(
  formData: FormData
): Promise<ActionResult> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    password: parsed.data.password,
  });

  if (error) {
    return { error: error.message };
  }

  redirect("/login?message=Password+updated+successfully");
}

// ---- CREATE HOUSEHOLD ----
export async function createHousehold(
  formData: FormData
): Promise<ActionResult> {
  const parsed = createHouseholdSchema.safeParse({
    name: formData.get("name"),
    timezone: formData.get("timezone"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const inviteCode = generateInviteCode();

  // 1. Create household (RLS: households_insert_authenticated allows this)
  const { data: household, error: householdError } = await supabase
    .from("households")
    .insert({
      name: parsed.data.name,
      timezone: parsed.data.timezone,
      invite_code: inviteCode,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (householdError) {
    return { error: "Failed to create household. Please try again." };
  }

  // 2. Create membership as admin (RLS: household_members_insert_self allows this)
  const { data: member, error: memberError } = await supabase
    .from("household_members")
    .insert({
      household_id: household.id,
      user_id: user.id,
      role: "admin",
    })
    .select("id")
    .single();

  if (memberError) {
    return { error: "Failed to create membership. Please try again." };
  }

  // 3. Create admin history (NO INSERT RLS policy — must use admin client)
  const admin = createAdminClient();
  await admin.from("admin_history").insert({
    household_id: household.id,
    member_id: member.id,
    reason: "household_created",
  });

  redirect("/dashboard");
}

// ---- JOIN HOUSEHOLD ----
export async function joinHousehold(
  formData: FormData
): Promise<ActionResult> {
  const parsed = joinHouseholdSchema.safeParse({
    inviteCode: formData.get("inviteCode"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const result = await joinHouseholdByCode(parsed.data.inviteCode);
  if (result.error) {
    return result;
  }

  redirect("/dashboard");
}

// ---- Shared helper: join by invite code ----
async function joinHouseholdByCode(code: string): Promise<ActionResult> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  // Use admin client to look up household (RLS blocks non-member SELECT)
  const { data: household } = await admin
    .from("households")
    .select("id, max_members, deleted_at")
    .eq("invite_code", code)
    .maybeSingle();

  if (!household) {
    return { error: "Invalid invite code" };
  }

  if (household.deleted_at) {
    return { error: "This household is no longer active" };
  }

  // Check if user already has an active membership anywhere
  const { data: existingMembership } = await admin
    .from("household_members")
    .select("id")
    .eq("user_id", user.id)
    .is("left_at", null)
    .maybeSingle();

  if (existingMembership) {
    return { error: "You are already a member of a household" };
  }

  // Check max members
  const { count } = await admin
    .from("household_members")
    .select("id", { count: "exact", head: true })
    .eq("household_id", household.id)
    .is("left_at", null);

  if (count !== null && count >= household.max_members) {
    return { error: "This household is full" };
  }

  // Insert membership (use regular client — RLS allows user_id = auth.uid())
  const { error: joinError } = await supabase
    .from("household_members")
    .insert({
      household_id: household.id,
      user_id: user.id,
      role: "member",
    });

  if (joinError) {
    if (joinError.code === "23505") {
      return { error: "You are already a member of a household" };
    }
    return { error: "Failed to join household. Please try again." };
  }

  return {};
}

// ---- UPDATE PROFILE (display name) ----
export async function updateProfile(
  formData: FormData
): Promise<ActionResult> {
  const parsed = updateProfileSchema.safeParse({
    displayName: formData.get("displayName"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const { error } = await supabase
    .from("users")
    .update({ display_name: parsed.data.displayName })
    .eq("id", user.id);

  if (error) {
    return { error: "Failed to update name. Please try again." };
  }

  return { success: true };
}

// ---- UPDATE EMAIL ----
export async function updateEmail(
  formData: FormData
): Promise<ActionResult> {
  const parsed = updateEmailSchema.safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.updateUser({
    email: parsed.data.email,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ---- CHANGE PASSWORD ----
export async function changePassword(
  formData: FormData
): Promise<ActionResult> {
  const parsed = changePasswordSchema.safeParse({
    currentPassword: formData.get("currentPassword"),
    newPassword: formData.get("newPassword"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const supabase = await createClient();

  // Verify current password by re-authenticating
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email) {
    return { error: "Not authenticated" };
  }

  const { error: signInError } = await supabase.auth.signInWithPassword({
    email: user.email,
    password: parsed.data.currentPassword,
  });

  if (signInError) {
    return { error: "Current password is incorrect" };
  }

  const { error } = await supabase.auth.updateUser({
    password: parsed.data.newPassword,
  });

  if (error) {
    return { error: error.message };
  }

  return { success: true };
}

// ---- UPLOAD AVATAR ----
export async function uploadAvatar(
  formData: FormData
): Promise<ActionResult> {
  const file = formData.get("avatar") as File | null;

  if (!file || file.size === 0) {
    return { error: "No file selected" };
  }

  if (file.size > 2 * 1024 * 1024) {
    return { error: "File must be under 2MB" };
  }

  if (!file.type.startsWith("image/")) {
    return { error: "File must be an image" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const ext = file.name.split(".").pop() || "jpg";
  const path = `${user.id}/avatar.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from("avatars")
    .upload(path, file, { upsert: true });

  if (uploadError) {
    return { error: "Failed to upload avatar. Please try again." };
  }

  const {
    data: { publicUrl },
  } = supabase.storage.from("avatars").getPublicUrl(path);

  // Add cache-bust param to force re-fetch
  const avatarUrl = `${publicUrl}?t=${Date.now()}`;

  const { error: updateError } = await supabase
    .from("users")
    .update({ avatar_url: avatarUrl })
    .eq("id", user.id);

  if (updateError) {
    return { error: "Failed to update profile. Please try again." };
  }

  return { success: true };
}

// ---- CHECK DELETE ELIGIBILITY ----
export async function checkDeleteEligibility(): Promise<{
  canDelete: boolean;
  reason?: string;
  isAdmin: boolean;
  isSoleMember: boolean;
  memberCount: number;
}> {
  const membership = await getCurrentMembership();

  if (!membership) {
    return { canDelete: true, isAdmin: false, isSoleMember: true, memberCount: 0 };
  }

  const admin = createAdminClient();

  // Count active members in the household
  const { count } = await admin
    .from("household_members")
    .select("id", { count: "exact", head: true })
    .eq("household_id", membership.householdId)
    .is("left_at", null);

  const memberCount = count ?? 1;
  const isAdmin = membership.role === "admin";
  const isSoleMember = memberCount === 1;

  // Admin with other members cannot delete
  if (isAdmin && !isSoleMember) {
    return {
      canDelete: false,
      reason:
        "As the admin, you must remove all other members or transfer admin role before deleting your account.",
      isAdmin,
      isSoleMember,
      memberCount,
    };
  }

  return { canDelete: true, isAdmin, isSoleMember, memberCount };
}

// ---- DELETE ACCOUNT ----
export async function deleteAccount(): Promise<ActionResult> {
  const supabase = await createClient();
  const admin = createAdminClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Not authenticated" };
  }

  const membership = await getCurrentMembership();

  if (membership) {
    const eligibility = await checkDeleteEligibility();
    if (!eligibility.canDelete) {
      return { error: eligibility.reason };
    }

    // If admin and sole member — soft-delete the household
    if (eligibility.isAdmin && eligibility.isSoleMember) {
      await admin
        .from("households")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", membership.householdId);
    }

    // Leave the household
    await admin
      .from("household_members")
      .update({ left_at: new Date().toISOString() })
      .eq("id", membership.memberId);
  }

  // Anonymize user data (FK RESTRICT prevents hard delete)
  await admin
    .from("users")
    .update({
      display_name: "Deleted User",
      email: `deleted-${user.id}@nestsync.local`,
      avatar_url: null,
    })
    .eq("id", user.id);

  // Delete auth user
  await admin.auth.admin.deleteUser(user.id);

  // Sign out and redirect
  await supabase.auth.signOut();
  redirect("/login");
}

// ---- SIGN OUT ----
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  const { error } = await supabase.auth.signOut();
  if (error) {
    console.error("Error signing out:", error);
  }
  redirect("/login");
}

// ---- Invite code generator (8-char, no confusing chars) ----
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

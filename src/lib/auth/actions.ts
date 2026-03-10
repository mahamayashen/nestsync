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
} from "./validation";

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
    process.env.NEXT_PUBLIC_SITE_URL || "http://127.0.0.1:3000";

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

// ---- SIGN OUT ----
export async function signOut(): Promise<void> {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}

// ---- Invite code generator (8-char, no confusing chars) ----
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789";
  const array = new Uint8Array(8);
  crypto.getRandomValues(array);
  return Array.from(array, (byte) => chars[byte % chars.length]).join("");
}

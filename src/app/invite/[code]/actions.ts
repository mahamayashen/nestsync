"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function joinHousehold(formData: FormData) {
  const supabase = await createClient();
  const inviteCode = formData.get("inviteCode") as string;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/auth?mode=signup`);
  }

  // Find house by invite code
  const { data: house, error: houseError } = await supabase
    .from("households")
    .select("id")
    .eq("invite_code", inviteCode)
    .single();

  if (houseError || !house) {
    redirect(`/invite/${inviteCode}?error=${encodeURIComponent("Invalid invite link.")}`);
  }

  // Insert member
  const { error: memberError } = await supabase
    .from("members")
    .insert([{
      household_id: house.id,
      user_id: user.id,
      role: "member"
    }]);

  if (memberError) {
    // If they are already a member, it violates the UNIQUE constraint, just redirect them to dashboard.
    if (memberError.code === '23505') {
       redirect("/dashboard");
    }
    redirect(`/invite/${inviteCode}?error=${encodeURIComponent("Failed to join household.")}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

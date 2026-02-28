"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";

export async function createHousehold(formData: FormData) {
  const supabase = await createClient();
  const name = formData.get("name") as string;

  // 1. Get the current user
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  // 2. Insert House
  const { data: house, error: houseError } = await supabase
    .from("households")
    .insert([{ name }])
    .select("id, invite_code")
    .single();

  if (houseError || !house) {
    console.error("Error creating household:", houseError);
    redirect(`/onboarding?error=${encodeURIComponent("Failed to create household.")}`);
  }

  // 3. Link user as admin
  const { error: memberError } = await supabase
    .from("members")
    .insert([{ 
      household_id: house.id, 
      user_id: user.id, 
      role: "admin" 
    }]);

  if (memberError) {
    console.error("Error linking member:", memberError);
    // Cleanup the house if member link failed (soft transactional)
    await supabase.from("households").delete().eq("id", house.id);
    redirect(`/onboarding?error=${encodeURIComponent("Failed to assign household permissions.")}`);
  }

  revalidatePath("/", "layout");
  redirect("/dashboard");
}

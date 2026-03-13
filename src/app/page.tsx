import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPostAuthRedirect } from "@/lib/auth/redirect";

export default async function HomePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const dest = await getPostAuthRedirect();
    redirect(dest);
  }

  redirect("/login");
}

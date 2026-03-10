import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getPostAuthRedirect } from "@/lib/auth/redirect";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next");

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // If there's a specific "next" destination (e.g., /reset-password), go there
      if (next) {
        return NextResponse.redirect(`${origin}${next}`);
      }

      // Otherwise, determine where to go based on user state
      const dest = await getPostAuthRedirect();
      return NextResponse.redirect(`${origin}${dest}`);
    }
  }

  // Auth code exchange failed — redirect to login with error
  return NextResponse.redirect(
    `${origin}/login?message=Could+not+authenticate.+Please+try+again.`
  );
}

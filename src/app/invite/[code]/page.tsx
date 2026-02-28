import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { joinHousehold } from "./actions";
import { Home, Users } from "lucide-react";

export default async function InvitePage(props: {
  params: Promise<{ code: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await props.params;
  const searchParams = await props.searchParams;
  const inviteCode = params.code;

  const supabase = await createClient();

  // 1. Fetch Household Info
  const { data: house, error } = await supabase
    .from("households")
    .select("name, id")
    .eq("invite_code", inviteCode)
    .single();

  if (error || !house) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-8 text-center">
          <div className="bg-red-100 p-3 rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
            <span className="text-red-500 text-2xl">!</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Invalid Invite Link</h1>
          <p className="text-slate-500 text-sm">This link might have expired or been deleted.</p>
        </div>
      </div>
    );
  }

  // 2. Check if user is logged in
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl ring-1 ring-slate-200 p-8 text-center">
        
        <div className="flex justify-center mb-6">
          <div className="bg-indigo-100 text-indigo-600 p-4 rounded-full ring-8 ring-indigo-50">
            <Users className="w-8 h-8" />
          </div>
        </div>

        <h1 className="text-2xl font-bold text-slate-900">
          You've been invited!
        </h1>
        <p className="text-slate-600 mt-2">
          Join <span className="font-semibold text-slate-900">{house.name}</span> on NestSync.
        </p>

        {searchParams.error && (
          <div className="mt-6 p-4 bg-red-50 text-red-600 rounded-xl text-sm font-medium border border-red-100">
            {searchParams.error}
          </div>
        )}

        <form action={joinHousehold} className="mt-8 space-y-4">
          <input type="hidden" name="inviteCode" value={inviteCode} />
          
          <button
            type="submit"
            className="w-full py-3 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-xl shadow-sm transition-all active:scale-[0.98]"
          >
            {user ? "Accept Invite & Join" : "Log In to Join"}
          </button>
        </form>

      </div>
    </div>
  );
}

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { signout } from "@/app/auth/actions";
import { Home, Users, Copy, LogOut } from "lucide-react";

export default async function DashboardPage() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect("/auth");
  }

  // Find the user's household
  const { data: memberData } = await supabase
    .from("members")
    .select("role, households (name, invite_code)")
    .eq("user_id", user.id)
    .single();

  if (!memberData || !memberData.households) {
    // They are logged in but have no household
    redirect("/onboarding");
  }

  // Supabase returns an array for joins unless specified.
  // We know a member only belongs to one household based on our schema context for dashboard.
  const household = Array.isArray(memberData.households) 
    ? memberData.households[0] 
    : memberData.households;
  // Use Vercel URL or fallback to localhost for the invite link
  const appUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  const inviteLink = `${appUrl}/invite/${household.invite_code}`;

  return (
    <div className="min-h-screen bg-slate-50">
      
      {/* Top Navigation Placeholder */}
      <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2 text-indigo-600 font-bold text-xl">
          <Home className="w-6 h-6" />
          NestSync
        </div>
        <div className="flex items-center gap-4 text-sm font-medium text-slate-600">
          <span className="hidden sm:inline-block bg-slate-100 px-3 py-1 rounded-full">
            {user.email}
          </span>
          <form action={signout}>
            <button className="flex items-center gap-2 hover:text-slate-900 transition-colors">
              <LogOut className="w-4 h-4" />
              Sign Out
            </button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-6 space-y-8 mt-4">
        
        {/* Household Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">
              {household.name}
            </h1>
            <p className="text-slate-500 mt-1">
              Role: <span className="capitalize font-medium text-slate-700">{memberData.role}</span>
            </p>
          </div>
          
          <div className="bg-white border border-slate-200 rounded-xl p-4 flex items-center shadow-sm w-full sm:w-auto">
            <div className="bg-indigo-50 p-2 rounded-lg mr-3">
              <Users className="text-indigo-600 w-5 h-5" />
            </div>
            <div className="flex-1 mr-4">
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">Invite Roommates</p>
              <code className="text-xs text-slate-700 bg-slate-100 px-2 py-1 rounded block truncate max-w-[200px] sm:max-w-xs">
                {inviteLink}
              </code>
            </div>
            {/* Note: This is a placeholder visual button. We'll add the clipboard JS later. */}
            <button className="text-slate-400 hover:text-indigo-600 transition-colors p-2" title="Copy to clipboard">
              <Copy className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Dashboard Placeholder Modules */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[200px] flex items-center justify-center text-slate-400 border-dashed">
            Chores Module (Coming Soon)
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[200px] flex items-center justify-center text-slate-400 border-dashed">
            Expenses Module (Coming Soon)
          </div>
          <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 min-h-[200px] flex items-center justify-center text-slate-400 border-dashed">
            Voting Module (Coming Soon)
          </div>
        </div>

      </main>
    </div>
  );
}

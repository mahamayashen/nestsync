import { createClient } from "@/lib/supabase/server";

export type AnnouncementWithDetails = {
  id: string;
  household_id: string;
  author_id: string;
  content: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
  author: {
    id: string;
    role: string;
    users: { display_name: string; avatar_url: string | null };
  };
  reactions: {
    id: string;
    emoji: string;
    member_id: string;
  }[];
};

export async function getAnnouncements(
  householdId: string
): Promise<AnnouncementWithDetails[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("announcements")
    .select(
      `
      *,
      author:household_members!announcements_author_id_fkey(
        id,
        role,
        users!inner(display_name, avatar_url)
      ),
      reactions:announcement_reactions(
        id,
        emoji,
        member_id
      )
    `
    )
    .eq("household_id", householdId)
    .is("deleted_at", null)
    .order("is_pinned", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) return [];
  return data as unknown as AnnouncementWithDetails[];
}

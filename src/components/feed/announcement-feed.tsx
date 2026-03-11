"use client";

import { useQuery } from "@tanstack/react-query";
import { Megaphone } from "@phosphor-icons/react";
import { useSupabase } from "@/hooks/use-supabase";
import type { AnnouncementWithDetails } from "@/lib/announcements/queries";
import { AnnouncementCard } from "./announcement-card";
import { CreateAnnouncementForm } from "./create-announcement-form";

interface AnnouncementFeedProps {
  initialAnnouncements: AnnouncementWithDetails[];
  householdId: string;
  currentMemberId: string;
  currentMemberRole: "admin" | "member";
}

export function AnnouncementFeed({
  initialAnnouncements,
  householdId,
  currentMemberId,
  currentMemberRole,
}: AnnouncementFeedProps) {
  const supabase = useSupabase();

  const { data: announcements } = useQuery({
    queryKey: ["announcements", householdId],
    queryFn: async () => {
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
    },
    initialData: initialAnnouncements,
    staleTime: 0,
  });

  return (
    <div className="space-y-4">
      <CreateAnnouncementForm householdId={householdId} />

      {announcements.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Megaphone className="w-12 h-12 text-text-muted mb-3" />
          <p className="text-text-secondary font-medium">
            No announcements yet
          </p>
          <p className="text-sm text-text-muted mt-1">
            Be the first to share something with your household
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {announcements.map((announcement) => (
            <AnnouncementCard
              key={announcement.id}
              announcement={announcement}
              currentMemberId={currentMemberId}
              currentMemberRole={currentMemberRole}
              householdId={householdId}
            />
          ))}
        </div>
      )}
    </div>
  );
}

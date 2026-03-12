import { redirect } from "next/navigation";
import { getCurrentMembership } from "@/lib/household/queries";
import { getAnnouncements } from "@/lib/announcements/queries";
import { AnnouncementFeed } from "@/components/feed/announcement-feed";

export default async function FeedPage() {
  const membership = await getCurrentMembership();
  if (!membership) redirect("/login");

  const announcements = await getAnnouncements(membership.householdId);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-text-primary font-heading">
          Feed
        </h1>
        <p className="text-sm text-text-secondary mt-1">
          Household announcements and updates
        </p>
      </div>

      <AnnouncementFeed
        initialAnnouncements={announcements}
        householdId={membership.householdId}
        currentMemberId={membership.memberId}
        currentMemberRole={membership.role}
      />
    </div>
  );
}

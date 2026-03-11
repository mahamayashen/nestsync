"use client";

import { useState, useRef, useEffect } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PushPin, DotsThree, Trash, SpinnerGap } from "@phosphor-icons/react";
import {
  togglePinAnnouncement,
  deleteAnnouncement,
} from "@/lib/announcements/actions";
import { EmojiReactions } from "./emoji-reactions";
import type { AnnouncementWithDetails } from "@/lib/announcements/queries";

interface AnnouncementCardProps {
  announcement: AnnouncementWithDetails;
  currentMemberId: string;
  currentMemberRole: "admin" | "member";
  householdId: string;
}

function formatRelativeTime(isoString: string): string {
  const now = Date.now();
  const then = new Date(isoString).getTime();
  const diffMs = now - then;
  const diffMin = Math.floor(diffMs / 60000);
  const diffHr = Math.floor(diffMs / 3600000);
  const diffDay = Math.floor(diffMs / 86400000);

  if (diffMin < 1) return "Just now";
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHr < 24) return `${diffHr}h ago`;
  if (diffDay === 1) return "Yesterday";
  if (diffDay < 7) return `${diffDay}d ago`;
  return new Date(isoString).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
}

export function AnnouncementCard({
  announcement,
  currentMemberId,
  currentMemberRole,
  householdId,
}: AnnouncementCardProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  const canManage =
    currentMemberRole === "admin" ||
    announcement.author_id === currentMemberId;

  const displayName = announcement.author.users.display_name;
  const initial = displayName.charAt(0).toUpperCase();

  // Close menu on outside click
  useEffect(() => {
    if (!menuOpen) return;
    function handleClick(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [menuOpen]);

  const pinMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set("announcementId", announcement.id);
      return togglePinAnnouncement(formData);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: ["announcements", householdId],
        });
      }
      setMenuOpen(false);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set("announcementId", announcement.id);
      return deleteAnnouncement(formData);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: ["announcements", householdId],
        });
      }
      setMenuOpen(false);
    },
  });

  const isPending = pinMutation.isPending || deleteMutation.isPending;

  return (
    <div className="bg-surface rounded-xl border border-border-light p-4">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-primary-light text-primary flex items-center justify-center text-sm font-semibold shrink-0">
            {initial}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-text-primary truncate">
                {displayName}
              </span>
              <span className="text-xs text-text-muted">
                {formatRelativeTime(announcement.created_at)}
              </span>
              {announcement.is_pinned && (
                <span className="inline-flex items-center gap-0.5 text-xs text-primary">
                  <PushPin className="w-3 h-3" weight="fill" />
                  Pinned
                </span>
              )}
            </div>
          </div>
        </div>

        {canManage && (
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              disabled={isPending}
              className="p-1.5 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-secondary transition-colors"
              aria-label="Announcement actions"
            >
              {isPending ? (
                <SpinnerGap className="w-4 h-4 animate-spin" />
              ) : (
                <DotsThree className="w-4 h-4" weight="bold" />
              )}
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-36 bg-surface border border-border-light rounded-xl shadow-lg z-10 py-1">
                <button
                  onClick={() => pinMutation.mutate()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-text-primary hover:bg-surface-secondary transition-colors"
                >
                  <PushPin className="w-4 h-4" />
                  {announcement.is_pinned ? "Unpin" : "Pin"}
                </button>
                <button
                  onClick={() => deleteMutation.mutate()}
                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-error hover:bg-error-light transition-colors"
                >
                  <Trash className="w-4 h-4" />
                  Delete
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <p className="text-sm text-text-primary whitespace-pre-wrap mt-3 leading-relaxed">
        {announcement.content}
      </p>

      {/* Reactions */}
      <EmojiReactions
        announcementId={announcement.id}
        reactions={announcement.reactions}
        currentMemberId={currentMemberId}
        householdId={householdId}
      />
    </div>
  );
}

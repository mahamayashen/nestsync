"use client";

import { useState, useMemo } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Plus } from "@phosphor-icons/react";
import { toggleReaction } from "@/lib/announcements/actions";
import {
  ALLOWED_EMOJIS,
  EMOJI_MAP,
} from "@/lib/announcements/validation";

interface EmojiReactionsProps {
  announcementId: string;
  reactions: { id: string; emoji: string; member_id: string }[];
  currentMemberId: string;
  householdId: string;
}

type GroupedReaction = {
  emoji: string;
  count: number;
  hasReacted: boolean;
};

export function EmojiReactions({
  announcementId,
  reactions,
  currentMemberId,
  householdId,
}: EmojiReactionsProps) {
  const [showPicker, setShowPicker] = useState(false);
  const queryClient = useQueryClient();

  const grouped = useMemo(() => {
    const map = new Map<string, GroupedReaction>();
    for (const r of reactions) {
      const existing = map.get(r.emoji);
      if (existing) {
        existing.count++;
        if (r.member_id === currentMemberId) existing.hasReacted = true;
      } else {
        map.set(r.emoji, {
          emoji: r.emoji,
          count: 1,
          hasReacted: r.member_id === currentMemberId,
        });
      }
    }
    return Array.from(map.values());
  }, [reactions, currentMemberId]);

  const mutation = useMutation({
    mutationFn: async (emoji: string) => {
      const formData = new FormData();
      formData.set("announcementId", announcementId);
      formData.set("emoji", emoji);
      return toggleReaction(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["announcements", householdId],
      });
    },
  });

  const handleToggle = (emoji: string) => {
    mutation.mutate(emoji);
    setShowPicker(false);
  };

  return (
    <div className="flex flex-wrap items-center gap-1.5 mt-3">
      {grouped.map((g) => (
        <button
          key={g.emoji}
          onClick={() => handleToggle(g.emoji)}
          disabled={mutation.isPending}
          className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium transition-colors ${
            g.hasReacted
              ? "bg-primary-light border border-primary/30 text-primary"
              : "bg-surface-secondary border border-border-light text-text-secondary hover:bg-surface-secondary/80"
          }`}
        >
          <span>{EMOJI_MAP[g.emoji as keyof typeof EMOJI_MAP] ?? g.emoji}</span>
          <span>{g.count}</span>
        </button>
      ))}

      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-surface-secondary border border-border-light text-text-muted hover:text-text-secondary transition-colors"
          aria-label="Add reaction"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>

        {showPicker && (
          <div className="absolute bottom-full left-0 mb-1 flex gap-1 bg-surface border border-border-light rounded-xl p-1.5 shadow-lg z-10">
            {ALLOWED_EMOJIS.map((emoji) => (
              <button
                key={emoji}
                onClick={() => handleToggle(emoji)}
                className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-surface-secondary transition-colors text-base"
                aria-label={emoji}
              >
                {EMOJI_MAP[emoji]}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

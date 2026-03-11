"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { PaperPlaneTilt, SpinnerGap } from "@phosphor-icons/react";
import { createAnnouncement } from "@/lib/announcements/actions";

interface CreateAnnouncementFormProps {
  householdId: string;
}

const MAX_LENGTH = 2000;

export function CreateAnnouncementForm({
  householdId,
}: CreateAnnouncementFormProps) {
  const [content, setContent] = useState("");
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set("content", content.trim());
      return createAnnouncement(formData);
    },
    onSuccess: (result) => {
      if (result.success) {
        setContent("");
        queryClient.invalidateQueries({
          queryKey: ["announcements", householdId],
        });
      }
    },
  });

  const error = mutation.data?.error;
  const showCharCount = content.length > MAX_LENGTH - 200;

  return (
    <div className="bg-surface rounded-xl border border-border-light p-4">
      {error && (
        <div
          role="alert"
          className="mb-3 text-sm text-error-text bg-error-light px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      )}
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Share an update with your household..."
        rows={3}
        maxLength={MAX_LENGTH}
        className="w-full resize-none rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
      />
      <div className="flex items-center justify-between mt-2">
        <span
          className={`text-xs ${
            content.length > MAX_LENGTH
              ? "text-error-text"
              : showCharCount
                ? "text-text-muted"
                : "invisible"
          }`}
        >
          {content.length}/{MAX_LENGTH}
        </span>
        <button
          onClick={() => mutation.mutate()}
          disabled={mutation.isPending || !content.trim()}
          className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-on-primary bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {mutation.isPending ? (
            <SpinnerGap className="w-4 h-4 animate-spin" />
          ) : (
            <PaperPlaneTilt className="w-4 h-4" />
          )}
          Post
        </button>
      </div>
    </div>
  );
}

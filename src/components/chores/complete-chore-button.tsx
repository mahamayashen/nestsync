"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeChore } from "@/lib/chores/actions";
import { CheckCircle, SpinnerGap } from "@phosphor-icons/react";

interface CompleteChoreButtonProps {
  instanceId: string;
  householdId: string;
}

export function CompleteChoreButton({
  instanceId,
  householdId,
}: CompleteChoreButtonProps) {
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set("instanceId", instanceId);
      return completeChore(formData);
    },
    onSuccess: (result) => {
      if (result.success) {
        queryClient.invalidateQueries({
          queryKey: ["chore-instances", householdId],
        });
        queryClient.invalidateQueries({
          queryKey: ["chore-stats", householdId],
        });
      }
    },
  });

  return (
    <button
      onClick={() => mutation.mutate()}
      disabled={mutation.isPending}
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-primary hover:text-text-on-primary hover:bg-primary border border-primary/30 hover:border-primary rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Mark this chore as complete"
    >
      {mutation.isPending ? (
        <SpinnerGap className="w-4 h-4 animate-spin" />
      ) : (
        <CheckCircle className="w-4 h-4" />
      )}
      Done
    </button>
  );
}

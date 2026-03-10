"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { completeChore } from "@/lib/chores/actions";
import { CheckCircle2, Loader2 } from "lucide-react";

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
      className="flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium text-indigo-600 hover:text-white hover:bg-indigo-600 border border-indigo-200 hover:border-indigo-600 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
      aria-label="Mark this chore as complete"
    >
      {mutation.isPending ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : (
        <CheckCircle2 className="w-4 h-4" />
      )}
      Done
    </button>
  );
}

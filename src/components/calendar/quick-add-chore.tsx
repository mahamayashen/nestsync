"use client";

import { useState, useRef, useEffect, useActionState } from "react";
import { createChoreTemplate } from "@/lib/chores/actions";
import { X } from "@phosphor-icons/react";
import type { HouseholdMemberWithUser } from "@/lib/household/members";

interface QuickAddChoreProps {
  date: string; // YYYY-MM-DD
  householdId: string;
  currentMemberId: string;
  currentRole: "member" | "admin";
  members: HouseholdMemberWithUser[];
  onClose: () => void;
  onCreated: () => void;
}

export function QuickAddChore({
  date,
  currentMemberId,
  currentRole,
  members,
  onClose,
  onCreated,
}: QuickAddChoreProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [submitted, setSubmitted] = useState(false);

  const [state, formAction] = useActionState(
    async (_prev: { error?: string; success?: boolean }, formData: FormData) => {
      const result = (await createChoreTemplate(formData)) ?? {};
      // createChoreTemplate redirects on success (throws NEXT_REDIRECT)
      // If we get here, it was an error
      return result;
    },
    {}
  );

  // Focus title input on mount
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Handle escape key
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose]);

  return (
    <div
      className="bg-surface border border-primary/30 rounded-xl p-3 shadow-lg mb-1"
      onClick={(e) => e.stopPropagation()}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-semibold text-primary">Quick add</span>
        <button
          type="button"
          onClick={onClose}
          className="text-text-muted hover:text-text-secondary p-0.5"
        >
          <X size={14} weight="bold" />
        </button>
      </div>

      {state.error && (
        <p className="text-xs text-red-600 mb-2">{state.error}</p>
      )}

      <form ref={formRef} action={formAction} className="space-y-2">
        {/* Hidden fields */}
        <input type="hidden" name="recurrence" value="one_time" />
        <input type="hidden" name="dueDate" value={date} />
        {currentRole !== "admin" && (
          <input type="hidden" name="assignedTo" value={currentMemberId} />
        )}

        <input
          ref={inputRef}
          type="text"
          name="title"
          placeholder="Chore name"
          required
          className="w-full px-2.5 py-1.5 rounded-lg border border-border text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
        />

        <div className="flex gap-2">
          <input
            type="number"
            name="points"
            defaultValue="1"
            min="1"
            max="100"
            className="w-16 px-2 py-1.5 rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          />
          <span className="self-center text-xs text-text-muted">pts</span>

          {currentRole === "admin" && (
            <select
              name="assignedTo"
              defaultValue={currentMemberId}
              className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-border text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent bg-surface"
            >
              {members.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.users.display_name}
                </option>
              ))}
            </select>
          )}
        </div>

        <button
          type="submit"
          className="w-full py-1.5 rounded-lg bg-primary text-white text-xs font-semibold hover:bg-primary-hover transition-colors"
        >
          Add
        </button>
      </form>
    </div>
  );
}

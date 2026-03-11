"use client";

import { useState, useActionState } from "react";
import Link from "next/link";
import { createChoreTemplate } from "@/lib/chores/actions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { DayOfWeekPicker } from "./day-of-week-picker";
import type { HouseholdMemberWithUser } from "@/lib/household/members";

interface CreateChoreFormProps {
  members: HouseholdMemberWithUser[];
}

export function CreateChoreForm({ members }: CreateChoreFormProps) {
  const [mode, setMode] = useState<"one_time" | "recurring">("recurring");
  const [selectedDays, setSelectedDays] = useState<Set<number>>(
    new Set([1, 2, 3, 4, 5, 6, 0]) // all days by default
  );

  const [state, formAction] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => {
      return (await createChoreTemplate(formData)) ?? {};
    },
    {}
  );

  const handleToggleDay = (day: number) => {
    setSelectedDays((prev) => {
      const next = new Set(prev);
      if (next.has(day)) {
        next.delete(day);
      } else {
        next.add(day);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    setSelectedDays(new Set([0, 1, 2, 3, 4, 5, 6]));
  };

  const handleSelectWeekdays = () => {
    setSelectedDays(new Set([1, 2, 3, 4, 5]));
  };

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <div
          className="p-3 rounded-lg bg-error-light text-error-text text-sm"
          role="alert"
        >
          {state.error}
        </div>
      )}

      <FormField
        id="chore-title"
        label="Title"
        type="text"
        name="title"
        placeholder="e.g. Clean kitchen"
        required
      />

      <div className="space-y-1.5">
        <label
          htmlFor="chore-description"
          className="block text-sm font-medium text-text-primary"
        >
          Description{" "}
          <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <textarea
          id="chore-description"
          name="description"
          placeholder="What does this chore involve?"
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-border text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow resize-none"
        />
      </div>

      <FormField
        id="chore-points"
        label="Points"
        type="number"
        name="points"
        defaultValue="1"
        required
      />

      {/* Schedule type toggle */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-text-primary">
          Schedule
        </label>
        <div className="flex gap-1 bg-surface-secondary p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setMode("one_time")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "one_time"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            One-time
          </button>
          <button
            type="button"
            onClick={() => setMode("recurring")}
            className={`flex-1 py-2 rounded-md text-sm font-medium transition-colors ${
              mode === "recurring"
                ? "bg-surface text-text-primary shadow-sm"
                : "text-text-muted hover:text-text-secondary"
            }`}
          >
            Recurring
          </button>
        </div>

        {mode === "one_time" ? (
          <>
            <input type="hidden" name="recurrence" value="one_time" />
            <input
              type="date"
              name="dueDate"
              className="w-full px-3 py-2.5 rounded-lg border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow bg-surface"
            />
          </>
        ) : (
          <DayOfWeekPicker
            selectedDays={selectedDays}
            onToggle={handleToggleDay}
            onSelectAll={handleSelectAll}
            onSelectWeekdays={handleSelectWeekdays}
          />
        )}
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="chore-assignee"
          className="block text-sm font-medium text-text-primary"
        >
          Assigned to
        </label>
        <select
          id="chore-assignee"
          name="assignedTo"
          defaultValue={members[0]?.id ?? ""}
          className="w-full px-3 py-2.5 rounded-lg border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow bg-surface"
        >
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.users.display_name}
            </option>
          ))}
        </select>
      </div>

      <SubmitButton>Create chore</SubmitButton>

      <p className="text-center text-sm text-text-secondary">
        <Link
          href="/dashboard/chores"
          className="text-primary font-medium hover:text-primary-hover"
        >
          Back to chore board
        </Link>
      </p>
    </form>
  );
}

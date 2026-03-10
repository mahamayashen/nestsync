"use client";

import { useActionState } from "react";
import Link from "next/link";
import { createChoreTemplate } from "@/lib/chores/actions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import type { HouseholdMemberWithUser } from "@/lib/household/members";

interface CreateChoreFormProps {
  members: HouseholdMemberWithUser[];
}

export function CreateChoreForm({ members }: CreateChoreFormProps) {
  const [state, formAction] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => {
      return (await createChoreTemplate(formData)) ?? {};
    },
    {}
  );

  return (
    <form action={formAction} className="space-y-4" noValidate>
      {state.error && (
        <div
          className="p-3 rounded-lg bg-red-50 text-red-700 text-sm"
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
          className="block text-sm font-medium text-slate-700"
        >
          Description{" "}
          <span className="text-slate-400 font-normal">(optional)</span>
        </label>
        <textarea
          id="chore-description"
          name="description"
          placeholder="What does this chore involve?"
          rows={3}
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <FormField
          id="chore-points"
          label="Points"
          type="number"
          name="points"
          defaultValue="1"
          required
        />

        <div className="space-y-1.5">
          <label
            htmlFor="chore-recurrence"
            className="block text-sm font-medium text-slate-700"
          >
            Recurrence
          </label>
          <select
            id="chore-recurrence"
            name="recurrence"
            defaultValue="weekly"
            className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow bg-white"
          >
            <option value="one_time">One-time</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </div>
      </div>

      <div className="space-y-1.5">
        <label
          htmlFor="chore-assignee"
          className="block text-sm font-medium text-slate-700"
        >
          Assigned to
        </label>
        <select
          id="chore-assignee"
          name="assignedTo"
          required
          className="w-full px-3 py-2.5 rounded-lg border border-slate-300 text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow bg-white"
        >
          <option value="">Select a member</option>
          {members.map((member) => (
            <option key={member.id} value={member.id}>
              {member.users.display_name}
            </option>
          ))}
        </select>
      </div>

      <SubmitButton>Create chore</SubmitButton>

      <p className="text-center text-sm text-slate-500">
        <Link
          href="/dashboard/chores"
          className="text-indigo-600 font-medium hover:text-indigo-700"
        >
          Back to chore board
        </Link>
      </p>
    </form>
  );
}

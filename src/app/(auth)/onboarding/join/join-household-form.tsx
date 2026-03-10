"use client";

import { useActionState } from "react";
import Link from "next/link";
import { joinHousehold } from "@/lib/auth/actions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

export function JoinHouseholdForm() {
  const [state, formAction] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => {
      return (await joinHousehold(formData)) ?? {};
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
        id="invite-code"
        label="Invite code"
        type="text"
        name="inviteCode"
        placeholder="Enter 8-character code"
        autoComplete="off"
        required
      />

      <SubmitButton>Join household</SubmitButton>

      <p className="text-center text-sm text-slate-500">
        <Link
          href="/onboarding"
          className="text-indigo-600 font-medium hover:text-indigo-700"
        >
          Back to options
        </Link>
      </p>
    </form>
  );
}

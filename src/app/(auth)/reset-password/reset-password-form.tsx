"use client";

import { useActionState } from "react";
import { resetPassword } from "@/lib/auth/actions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

export function ResetPasswordForm() {
  const [state, formAction] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => {
      return (await resetPassword(formData)) ?? {};
    },
    {}
  );

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
        id="reset-password"
        label="New password"
        type="password"
        name="password"
        placeholder="At least 6 characters"
        autoComplete="new-password"
        required
      />
      <FormField
        id="reset-confirm-password"
        label="Confirm password"
        type="password"
        name="confirmPassword"
        placeholder="Re-enter your password"
        autoComplete="new-password"
        required
      />

      <SubmitButton>Update password</SubmitButton>
    </form>
  );
}

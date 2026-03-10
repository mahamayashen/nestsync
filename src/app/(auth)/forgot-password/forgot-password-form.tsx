"use client";

import { useActionState } from "react";
import Link from "next/link";
import { forgotPassword } from "@/lib/auth/actions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(
    async (_prev: { error?: string; success?: boolean }, formData: FormData) => {
      return (await forgotPassword(formData)) ?? {};
    },
    {}
  );

  return (
    <div className="space-y-6">
      {state.success ? (
        <div
          className="p-4 rounded-lg bg-green-50 text-green-700 text-sm space-y-2"
          role="status"
        >
          <p className="font-medium">Check your email</p>
          <p>
            If an account with that email exists, we&apos;ve sent a password
            reset link.
          </p>
        </div>
      ) : (
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
            id="forgot-email"
            label="Email"
            type="email"
            name="email"
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          <SubmitButton>Send reset link</SubmitButton>
        </form>
      )}

      <p className="text-center text-sm text-slate-500">
        <Link
          href="/login"
          className="text-indigo-600 font-medium hover:text-indigo-700"
        >
          Back to sign in
        </Link>
      </p>
    </div>
  );
}

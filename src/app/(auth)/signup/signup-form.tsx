"use client";

import { useActionState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { signup } from "@/lib/auth/actions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { GoogleOAuthButton } from "@/components/auth/oauth-button";
import { AuthDivider } from "@/components/auth/auth-divider";

export function SignupForm({ inviteCode }: { inviteCode?: string }) {
  const searchParams = useSearchParams();
  const code = inviteCode ?? searchParams.get("invite") ?? undefined;

  const [state, formAction] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => {
      if (code) formData.set("inviteCode", code);
      return (await signup(formData)) ?? {};
    },
    {}
  );

  return (
    <div className="space-y-6">
      {code && (
        <div
          className="p-3 rounded-lg bg-primary-light text-primary-hover text-sm"
          role="status"
        >
          You&apos;ve been invited to a household! Create an account to join.
        </div>
      )}

      <GoogleOAuthButton inviteCode={code} />
      <AuthDivider />

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
          id="signup-name"
          label="Display name"
          type="text"
          name="displayName"
          placeholder="Your name"
          autoComplete="name"
          required
        />
        <FormField
          id="signup-email"
          label="Email"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <FormField
          id="signup-password"
          label="Password"
          type="password"
          name="password"
          placeholder="At least 6 characters"
          autoComplete="new-password"
          required
        />

        <SubmitButton>Create account</SubmitButton>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Already have an account?{" "}
        <Link
          href="/login"
          className="text-primary font-medium hover:text-primary-hover"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}

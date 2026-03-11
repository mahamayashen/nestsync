"use client";

import { useActionState } from "react";
import Link from "next/link";
import { login } from "@/lib/auth/actions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { GoogleOAuthButton } from "@/components/auth/oauth-button";
import { AuthDivider } from "@/components/auth/auth-divider";

export function LoginForm({ redirectTo }: { redirectTo?: string }) {
  const [state, formAction] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => {
      if (redirectTo) formData.set("redirect", redirectTo);
      return (await login(formData)) ?? {};
    },
    {}
  );

  return (
    <div className="space-y-6">
      <GoogleOAuthButton />
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
          id="login-email"
          label="Email"
          type="email"
          name="email"
          placeholder="you@example.com"
          autoComplete="email"
          required
        />
        <FormField
          id="login-password"
          label="Password"
          type="password"
          name="password"
          placeholder="Your password"
          autoComplete="current-password"
          required
        />

        <div className="flex justify-end">
          <Link
            href="/forgot-password"
            className="text-sm text-primary hover:text-primary-hover"
          >
            Forgot password?
          </Link>
        </div>

        <SubmitButton>Sign in</SubmitButton>
      </form>

      <p className="text-center text-sm text-text-secondary">
        Don&apos;t have an account?{" "}
        <Link
          href="/signup"
          className="text-primary font-medium hover:text-primary-hover"
        >
          Sign up
        </Link>
      </p>
    </div>
  );
}

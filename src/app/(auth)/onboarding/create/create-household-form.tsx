"use client";

import { useActionState, useSyncExternalStore } from "react";
import Link from "next/link";
import { createHousehold } from "@/lib/auth/actions";
import { FormField } from "@/components/ui/form-field";
import { SubmitButton } from "@/components/ui/submit-button";

const COMMON_TIMEZONES = [
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "America/Anchorage",
  "Pacific/Honolulu",
  "America/Toronto",
  "America/Vancouver",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "Asia/Kolkata",
  "Australia/Sydney",
  "Pacific/Auckland",
];

const subscribe = () => () => {};
const getTimezone = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
const getServerTimezone = () => "";

export function CreateHouseholdForm() {
  const detectedTimezone = useSyncExternalStore(
    subscribe,
    getTimezone,
    getServerTimezone
  );

  const [state, formAction] = useActionState(
    async (_prev: { error?: string }, formData: FormData) => {
      return (await createHousehold(formData)) ?? {};
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
        id="household-name"
        label="Household name"
        type="text"
        name="name"
        placeholder="e.g. Apartment 4B"
        required
      />

      <div className="space-y-1.5">
        <label
          htmlFor="household-timezone"
          className="block text-sm font-medium text-text-primary"
        >
          Timezone
        </label>
        <select
          id="household-timezone"
          name="timezone"
          defaultValue={detectedTimezone}
          className="w-full px-3 py-2.5 rounded-lg border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-shadow bg-surface"
        >
          {COMMON_TIMEZONES.map((tz) => (
            <option key={tz} value={tz}>
              {tz.replace(/_/g, " ")}
            </option>
          ))}
          {detectedTimezone &&
            !COMMON_TIMEZONES.includes(detectedTimezone) && (
              <option value={detectedTimezone}>
                {detectedTimezone.replace(/_/g, " ")} (detected)
              </option>
            )}
        </select>
      </div>

      <SubmitButton>Create household</SubmitButton>

      <p className="text-center text-sm text-text-secondary">
        <Link
          href="/onboarding"
          className="text-primary font-medium hover:text-primary-hover"
        >
          Back to options
        </Link>
      </p>
    </form>
  );
}

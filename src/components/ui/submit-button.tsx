"use client";

import { useFormStatus } from "react-dom";
import { SpinnerGap } from "@phosphor-icons/react";

interface SubmitButtonProps {
  children: React.ReactNode;
  className?: string;
}

export function SubmitButton({ children, className }: SubmitButtonProps) {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      aria-busy={pending}
      className={`w-full flex items-center justify-center gap-2 px-4 py-3 bg-primary text-text-on-primary rounded-xl font-semibold hover:bg-primary-hover transition-all shadow-sm active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed ${className ?? ""}`}
    >
      {pending && <SpinnerGap className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  );
}

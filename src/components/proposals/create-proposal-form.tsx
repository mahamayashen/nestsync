"use client";

import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Crown,
  UserMinus,
  Scales,
  SpinnerGap,
  PaperPlaneTilt,
  Plus,
  X,
} from "@phosphor-icons/react";
import { createProposal } from "@/lib/proposals/actions";
import type { HouseholdMemberWithUser } from "@/lib/household/members";

interface CreateProposalFormProps {
  householdId: string;
  members: HouseholdMemberWithUser[];
  currentMemberRole: "admin" | "member";
}

const PROPOSAL_TYPES = [
  {
    value: "elect_admin" as const,
    label: "Admin Election",
    icon: Crown,
    description: "Nominate a new household admin",
  },
  {
    value: "remove_member" as const,
    label: "Remove Member",
    icon: UserMinus,
    description: "Vote to remove a household member",
  },
  {
    value: "custom" as const,
    label: "Custom Vote",
    icon: Scales,
    description: "Create a custom proposal for your household",
  },
];

export function CreateProposalForm({
  householdId,
  members,
  currentMemberRole,
}: CreateProposalFormProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [type, setType] = useState<"elect_admin" | "remove_member" | "custom">(
    "custom"
  );
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [targetMemberId, setTargetMemberId] = useState("");
  const [durationHours, setDurationHours] = useState("48");
  const queryClient = useQueryClient();

  const needsTarget = type === "elect_admin" || type === "remove_member";

  // Filter members for target dropdown
  const targetOptions =
    type === "elect_admin"
      ? members.filter((m) => m.role !== "admin")
      : members;

  const mutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.set("type", type);
      formData.set("title", title.trim());
      formData.set("description", description.trim());
      if (needsTarget && targetMemberId) {
        formData.set("targetMemberId", targetMemberId);
      }
      if (durationHours) {
        formData.set("durationHours", durationHours);
      }
      return createProposal(formData);
    },
    onSuccess: (result) => {
      if (result.success) {
        // Reset form
        setTitle("");
        setDescription("");
        setTargetMemberId("");
        setDurationHours("48");
        setType("custom");
        setIsOpen(false);
        queryClient.invalidateQueries({
          queryKey: ["proposals", householdId],
        });
      }
    },
  });

  const error = mutation.data?.error;

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-text-on-primary bg-primary hover:bg-primary-hover rounded-xl transition-colors shadow-sm"
      >
        <Plus className="w-4 h-4" />
        New Proposal
      </button>
    );
  }

  return (
    <div className="bg-surface rounded-xl border border-border-light p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-text-primary">
          Create Proposal
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="p-1 rounded-lg text-text-muted hover:text-text-secondary hover:bg-surface-secondary transition-colors"
          aria-label="Cancel"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {error && (
        <div
          role="alert"
          className="mb-4 text-sm text-error-text bg-error-light px-3 py-2 rounded-lg"
        >
          {error}
        </div>
      )}

      {/* Type selector */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-text-secondary mb-2">
          Proposal type
        </label>
        <div className="grid grid-cols-3 gap-2">
          {PROPOSAL_TYPES.map((pt) => {
            const Icon = pt.icon;
            const selected = type === pt.value;
            return (
              <button
                key={pt.value}
                type="button"
                onClick={() => {
                  setType(pt.value);
                  setTargetMemberId("");
                }}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border text-xs font-medium transition-colors ${
                  selected
                    ? "border-primary bg-primary-light text-primary"
                    : "border-border-light bg-background text-text-secondary hover:bg-surface-secondary"
                }`}
              >
                <Icon
                  className="w-5 h-5"
                  weight={selected ? "fill" : "regular"}
                />
                {pt.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Title */}
      <div className="mb-3">
        <label
          htmlFor="proposal-title"
          className="block text-xs font-medium text-text-secondary mb-1"
        >
          Title
        </label>
        <input
          id="proposal-title"
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={
            type === "elect_admin"
              ? "Elect new admin"
              : type === "remove_member"
                ? "Remove inactive member"
                : "Your proposal title..."
          }
          maxLength={200}
          className="w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {/* Description */}
      <div className="mb-3">
        <label
          htmlFor="proposal-desc"
          className="block text-xs font-medium text-text-secondary mb-1"
        >
          Description{" "}
          <span className="text-text-muted font-normal">(optional)</span>
        </label>
        <textarea
          id="proposal-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Explain your proposal..."
          rows={3}
          maxLength={2000}
          className="w-full resize-none rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text-primary placeholder:text-text-muted focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {/* Target member (conditional) */}
      {needsTarget && (
        <div className="mb-3">
          <label
            htmlFor="proposal-target"
            className="block text-xs font-medium text-text-secondary mb-1"
          >
            {type === "elect_admin" ? "Nominee" : "Member to remove"}
          </label>
          <select
            id="proposal-target"
            value={targetMemberId}
            onChange={(e) => setTargetMemberId(e.target.value)}
            className="w-full rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
          >
            <option value="">Select a member...</option>
            {targetOptions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.users.display_name}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Duration */}
      <div className="mb-4">
        <label
          htmlFor="proposal-duration"
          className="block text-xs font-medium text-text-secondary mb-1"
        >
          Voting period (hours)
        </label>
        <input
          id="proposal-duration"
          type="number"
          value={durationHours}
          onChange={(e) => setDurationHours(e.target.value)}
          min={1}
          max={168}
          className="w-32 rounded-lg border border-border-light bg-background px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
        />
      </div>

      {/* Submit */}
      <button
        onClick={() => mutation.mutate()}
        disabled={mutation.isPending || !title.trim()}
        className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-text-on-primary bg-primary hover:bg-primary-hover rounded-lg transition-colors shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {mutation.isPending ? (
          <SpinnerGap className="w-4 h-4 animate-spin" />
        ) : (
          <PaperPlaneTilt className="w-4 h-4" />
        )}
        Create Proposal
      </button>
    </div>
  );
}

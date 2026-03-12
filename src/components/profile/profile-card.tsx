"use client";

import Image from "next/image";
import { signOut } from "@/lib/auth/actions";
import {
  SignOut,
  UserCircle,
  House,
  Crown,
  CalendarBlank,
} from "@phosphor-icons/react";

interface ProfileCardProps {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  householdName: string;
  role: "member" | "admin";
  memberSince: string;
}

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileCard({
  displayName,
  email,
  avatarUrl,
  householdName,
  role,
  memberSince,
}: ProfileCardProps) {
  return (
    <div className="relative">
      {/* Gradient background blob */}
      <div className="absolute -inset-8 -z-10 overflow-hidden rounded-3xl">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#B8C4A9] rounded-full opacity-40 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-[#6FA4AF] rounded-full opacity-30 blur-3xl" />
        <div className="absolute top-1/3 right-0 w-48 h-48 bg-[#D97D55] rounded-full opacity-20 blur-3xl" />
      </div>

      {/* Glassmorphism card */}
      <div className="relative backdrop-blur-xl bg-white/50 border border-white/30 rounded-2xl shadow-xl overflow-hidden">
        {/* Decorative top gradient bar */}
        <div className="h-24 bg-gradient-to-r from-[#B8C4A9]/60 via-[#6FA4AF]/40 to-[#D97D55]/30" />

        {/* Avatar — overlapping the gradient bar */}
        <div className="flex justify-center -mt-14">
          <div className="ring-4 ring-white/60 rounded-full shadow-lg">
            {avatarUrl ? (
              <Image
                src={avatarUrl}
                alt={displayName}
                width={112}
                height={112}
                className="rounded-full object-cover w-28 h-28"
              />
            ) : (
              <div className="w-28 h-28 rounded-full bg-[#B8C4A9] flex items-center justify-center">
                <span className="text-3xl font-bold text-white font-heading">
                  {getInitials(displayName)}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* User info */}
        <div className="px-6 pt-4 pb-6 text-center space-y-4">
          <div>
            <h1 className="text-2xl font-bold text-text-primary font-heading">
              {displayName}
            </h1>
            <p className="text-sm text-text-secondary mt-0.5">{email}</p>
          </div>

          {/* Role badge */}
          <div className="flex justify-center">
            {role === "admin" ? (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#D97D55]/15 text-[#D97D55] border border-[#D97D55]/20">
                <Crown size={14} weight="fill" />
                Admin
              </span>
            ) : (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-[#6FA4AF]/15 text-[#6FA4AF] border border-[#6FA4AF]/20">
                <UserCircle size={14} weight="fill" />
                Member
              </span>
            )}
          </div>

          {/* Info rows */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/20">
              <House size={20} weight="duotone" className="text-[#6FA4AF] shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-xs text-text-muted">Household</p>
                <p className="text-sm font-medium text-text-primary truncate">
                  {householdName}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/40 backdrop-blur-sm border border-white/20">
              <CalendarBlank size={20} weight="duotone" className="text-[#B8C4A9] shrink-0" />
              <div className="text-left min-w-0">
                <p className="text-xs text-text-muted">Member since</p>
                <p className="text-sm font-medium text-text-primary">
                  {formatDate(memberSince)}
                </p>
              </div>
            </div>
          </div>

          {/* Sign out */}
          <form action={signOut} className="pt-2">
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-text-secondary hover:text-error hover:bg-error-light/50 backdrop-blur-sm border border-white/20 transition-colors"
            >
              <SignOut size={18} />
              Sign out
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

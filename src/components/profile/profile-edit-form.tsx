"use client";

import { useState, useTransition, useRef } from "react";
import Image from "next/image";
import {
  Camera,
  FloppyDisk,
  ArrowLeft,
  Eye,
  EyeSlash,
  Trash,
  Envelope,
  Lock,
  User,
  Warning,
} from "@phosphor-icons/react";
import {
  updateProfile,
  updateEmail,
  changePassword,
  uploadAvatar,
  deleteAccount,
  checkDeleteEligibility,
} from "@/lib/auth/actions";
import { Info } from "@phosphor-icons/react";

interface ProfileEditFormProps {
  displayName: string;
  email: string;
  avatarUrl: string | null;
  userId: string;
  role: "member" | "admin";
  onClose: () => void;
}

function getInitials(name: string): string {
  return name
    .split(" ")
    .map((w) => w[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function ProfileEditForm({
  displayName,
  email,
  avatarUrl,
  userId,
  role,
  onClose,
}: ProfileEditFormProps) {
  // Name state
  const [name, setName] = useState(displayName);
  const [nameMsg, setNameMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [namePending, startNameTransition] = useTransition();

  // Email state
  const [newEmail, setNewEmail] = useState(email);
  const [emailMsg, setEmailMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [emailPending, startEmailTransition] = useTransition();

  // Password state
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [pwMsg, setPwMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [pwPending, startPwTransition] = useTransition();

  // Avatar state
  const [previewUrl, setPreviewUrl] = useState<string | null>(avatarUrl);
  const [avatarMsg, setAvatarMsg] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [avatarPending, startAvatarTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Delete state
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteEligibility, setDeleteEligibility] = useState<{
    canDelete: boolean;
    reason?: string;
    isAdmin: boolean;
    isSoleMember: boolean;
    memberCount: number;
  } | null>(null);
  const [deleteCheckPending, startDeleteCheckTransition] = useTransition();
  const [deletePending, startDeleteTransition] = useTransition();

  function handleAvatarSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Show preview immediately
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);

    // Upload
    const fd = new FormData();
    fd.set("avatar", file);
    setAvatarMsg(null);
    startAvatarTransition(async () => {
      const result = await uploadAvatar(fd);
      if (result.error) {
        setAvatarMsg({ type: "error", text: result.error });
        setPreviewUrl(avatarUrl); // revert preview
      } else {
        setAvatarMsg({ type: "success", text: "Photo updated" });
      }
    });
  }

  function handleNameSave() {
    if (name === displayName) return;
    const fd = new FormData();
    fd.set("displayName", name);
    setNameMsg(null);
    startNameTransition(async () => {
      const result = await updateProfile(fd);
      if (result.error) {
        setNameMsg({ type: "error", text: result.error });
      } else {
        setNameMsg({ type: "success", text: "Name updated" });
      }
    });
  }

  function handleEmailSave() {
    if (newEmail === email) return;
    const fd = new FormData();
    fd.set("email", newEmail);
    setEmailMsg(null);
    startEmailTransition(async () => {
      const result = await updateEmail(fd);
      if (result.error) {
        setEmailMsg({ type: "error", text: result.error });
      } else {
        setEmailMsg({
          type: "success",
          text: "Confirmation email sent to new address",
        });
      }
    });
  }

  function handlePasswordSave(formData: FormData) {
    setPwMsg(null);
    startPwTransition(async () => {
      const result = await changePassword(formData);
      if (result.error) {
        setPwMsg({ type: "error", text: result.error });
      } else {
        setPwMsg({ type: "success", text: "Password changed" });
        setShowPasswordForm(false);
      }
    });
  }

  function handleDeleteCheck() {
    startDeleteCheckTransition(async () => {
      const result = await checkDeleteEligibility();
      setDeleteEligibility(result);
      setShowDeleteConfirm(true);
    });
  }

  function handleDelete() {
    startDeleteTransition(async () => {
      const result = await deleteAccount();
      if (result.error) {
        setDeleteEligibility((prev) =>
          prev ? { ...prev, canDelete: false, reason: result.error } : null
        );
      }
    });
  }

  const currentPreview = previewUrl;

  return (
    <div className="relative">
      {/* Same background blobs as profile card */}
      <div className="absolute -inset-8 -z-10 overflow-hidden rounded-3xl">
        <div className="absolute top-0 left-1/4 w-64 h-64 bg-[#B8C4A9] rounded-full opacity-40 blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-72 h-72 bg-[#6FA4AF] rounded-full opacity-30 blur-3xl" />
        <div className="absolute top-1/3 right-0 w-48 h-48 bg-[#D97D55] rounded-full opacity-20 blur-3xl" />
      </div>

      <div className="relative backdrop-blur-xl bg-white/50 border border-white/30 rounded-2xl shadow-xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-6 py-4 border-b border-white/20">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/40 transition-colors"
          >
            <ArrowLeft size={20} className="text-text-secondary" />
          </button>
          <h2 className="text-lg font-bold text-text-primary font-heading">
            Edit Profile
          </h2>
        </div>

        <div className="px-6 py-6 space-y-6">
          {/* ---- AVATAR ---- */}
          <div className="flex flex-col items-center gap-3">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="relative group"
              disabled={avatarPending}
            >
              <div className="ring-4 ring-white/60 rounded-full shadow-lg">
                {currentPreview ? (
                  <Image
                    src={currentPreview}
                    alt={name}
                    width={112}
                    height={112}
                    className="rounded-full object-cover w-28 h-28"
                  />
                ) : (
                  <div className="w-28 h-28 rounded-full bg-[#B8C4A9] flex items-center justify-center">
                    <span className="text-3xl font-bold text-white font-heading">
                      {getInitials(name)}
                    </span>
                  </div>
                )}
              </div>
              <div className="absolute inset-0 rounded-full bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera size={28} className="text-white" weight="fill" />
              </div>
              {avatarPending && (
                <div className="absolute inset-0 rounded-full bg-white/60 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarSelect}
            />
            <p className="text-xs text-text-muted">
              Tap to change photo (max 2MB)
            </p>
            {avatarMsg && (
              <p
                className={`text-xs ${avatarMsg.type === "error" ? "text-error" : "text-primary"}`}
              >
                {avatarMsg.text}
              </p>
            )}
          </div>

          {/* ---- DISPLAY NAME ---- */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <User size={16} />
              Display Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-white/40 backdrop-blur-sm border border-white/20 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                maxLength={100}
              />
              <button
                onClick={handleNameSave}
                disabled={namePending || name === displayName}
                className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40"
              >
                {namePending ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FloppyDisk size={18} />
                )}
              </button>
            </div>
            {nameMsg && (
              <p
                className={`text-xs ${nameMsg.type === "error" ? "text-error" : "text-primary"}`}
              >
                {nameMsg.text}
              </p>
            )}
          </div>

          {/* ---- EMAIL ---- */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <Envelope size={16} />
              Email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="flex-1 px-3 py-2 rounded-xl bg-white/40 backdrop-blur-sm border border-white/20 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
              />
              <button
                onClick={handleEmailSave}
                disabled={emailPending || newEmail === email}
                className="px-3 py-2 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40"
              >
                {emailPending ? (
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <FloppyDisk size={18} />
                )}
              </button>
            </div>
            {emailMsg && (
              <p
                className={`text-xs ${emailMsg.type === "error" ? "text-error" : "text-primary"}`}
              >
                {emailMsg.text}
              </p>
            )}
          </div>

          {/* ---- PASSWORD ---- */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-text-secondary">
              <Lock size={16} />
              Password
            </label>
            {!showPasswordForm ? (
              <button
                onClick={() => setShowPasswordForm(true)}
                className="w-full px-3 py-2.5 rounded-xl bg-white/40 backdrop-blur-sm border border-white/20 text-sm text-text-secondary hover:bg-white/60 transition-colors text-left"
              >
                Change password...
              </button>
            ) : (
              <form
                action={handlePasswordSave}
                className="space-y-3 p-4 rounded-xl bg-white/40 backdrop-blur-sm border border-white/20"
              >
                <div className="relative">
                  <input
                    name="currentPassword"
                    type={showCurrentPw ? "text" : "password"}
                    placeholder="Current password"
                    className="w-full px-3 py-2 pr-10 rounded-lg bg-white/60 border border-white/30 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
                  >
                    {showCurrentPw ? (
                      <EyeSlash size={16} />
                    ) : (
                      <Eye size={16} />
                    )}
                  </button>
                </div>
                <div className="relative">
                  <input
                    name="newPassword"
                    type={showNewPw ? "text" : "password"}
                    placeholder="New password (min 6 characters)"
                    className="w-full px-3 py-2 pr-10 rounded-lg bg-white/60 border border-white/30 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                    required
                    minLength={6}
                  />
                  <button
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-text-muted"
                  >
                    {showNewPw ? <EyeSlash size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <input
                  name="confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  className="w-full px-3 py-2 rounded-lg bg-white/60 border border-white/30 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-primary/30"
                  required
                  minLength={6}
                />
                {pwMsg && (
                  <p
                    className={`text-xs ${pwMsg.type === "error" ? "text-error" : "text-primary"}`}
                  >
                    {pwMsg.text}
                  </p>
                )}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setShowPasswordForm(false);
                      setPwMsg(null);
                    }}
                    className="flex-1 py-2 rounded-lg text-sm text-text-secondary hover:bg-white/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={pwPending}
                    className="flex-1 py-2 rounded-lg bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors disabled:opacity-40"
                  >
                    {pwPending ? "Saving..." : "Update Password"}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* ---- DANGER ZONE ---- */}
          <div className="pt-4 border-t border-white/20">
            {!showDeleteConfirm ? (
              <button
                onClick={handleDeleteCheck}
                disabled={deleteCheckPending}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium text-error/70 hover:text-error hover:bg-error-light/50 backdrop-blur-sm border border-error/10 transition-colors disabled:opacity-40"
              >
                <Trash size={18} />
                {deleteCheckPending ? "Checking..." : "Delete Account"}
              </button>
            ) : deleteEligibility && !deleteEligibility.canDelete ? (
              /* Admin with other members — blocked */
              <div className="p-4 rounded-xl bg-accent-light/30 border border-accent/20 space-y-3">
                <div className="flex items-start gap-2">
                  <Warning
                    size={20}
                    className="text-accent shrink-0 mt-0.5"
                    weight="fill"
                  />
                  <div>
                    <p className="text-sm font-medium text-accent">
                      Cannot delete account
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      {deleteEligibility.reason}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteEligibility(null);
                  }}
                  className="w-full py-2 rounded-lg text-sm text-text-secondary hover:bg-white/40 transition-colors"
                >
                  Got it
                </button>
              </div>
            ) : (
              /* Eligible to delete — show confirmation with context */
              <div className="p-4 rounded-xl bg-error-light/30 border border-error/20 space-y-3">
                <div className="flex items-start gap-2">
                  <Warning
                    size={20}
                    className="text-error shrink-0 mt-0.5"
                    weight="fill"
                  />
                  <div>
                    <p className="text-sm font-medium text-error">
                      Delete your account?
                    </p>
                    <p className="text-xs text-text-secondary mt-1">
                      {deleteEligibility?.isAdmin &&
                      deleteEligibility?.isSoleMember
                        ? "You are the only member. Your household and all its data (chores, announcements, proposals) will be permanently deleted."
                        : "You will be removed from your household. Your chore history and contributions will be anonymized."}
                    </p>
                    <p className="text-xs text-text-muted mt-1">
                      This action cannot be undone.
                    </p>
                  </div>
                </div>
                {/* Info box */}
                <div className="flex items-start gap-2 p-2.5 rounded-lg bg-white/30 border border-white/20">
                  <Info
                    size={16}
                    className="text-primary shrink-0 mt-0.5"
                    weight="fill"
                  />
                  <p className="text-xs text-text-secondary">
                    {role === "admin"
                      ? "As the sole admin, deleting your account will also delete the entire household."
                      : "Your account will be removed from the household. The household and other members will not be affected."}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => {
                      setShowDeleteConfirm(false);
                      setDeleteEligibility(null);
                    }}
                    className="flex-1 py-2 rounded-lg text-sm text-text-secondary hover:bg-white/40 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={deletePending}
                    className="flex-1 py-2 rounded-lg bg-error text-white text-sm font-medium hover:bg-error/90 transition-colors disabled:opacity-40"
                  >
                    {deletePending ? "Deleting..." : "Yes, delete"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

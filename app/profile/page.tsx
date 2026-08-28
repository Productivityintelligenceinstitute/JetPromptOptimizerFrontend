"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import { useAuth } from "@/shared/context/AuthContext";
import { deleteAccount } from "@/shared/api/user";
import DeleteAccountModal from "@/shared/components/Modal/DeleteAccountModal";
import { APP_ROUTES } from "@/config/navigation";

const nameSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(6, "Current password must be at least 6 characters"),
    newPassword: z.string().min(6, "New password must be at least 6 characters"),
    confirmPassword: z.string().min(6, "Confirm password must be at least 6 characters"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type NameForm = z.infer<typeof nameSchema>;
type PasswordForm = z.infer<typeof passwordSchema>;

function formatTrialEnd(trialEndsAt: string | null | undefined): string {
  if (!trialEndsAt) return "";
  try {
    const d = new Date(trialEndsAt);
    return d.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
  } catch {
    return trialEndsAt;
  }
}

function isTrialExpired(trialEndsAt: string | null | undefined): boolean {
  if (!trialEndsAt) return false;
  return new Date(trialEndsAt) < new Date();
}

export default function ProfilePage() {
  const router = useRouter();
  const { user, changePassword, updateProfile, logout, isLoading } = useAuth();
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const {
    register: registerPassword,
    handleSubmit: handlePasswordSubmit,
    formState: { errors: passwordErrors },
    reset: resetPassword,
  } = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
  });

  const {
    register: registerName,
    handleSubmit: handleNameSubmit,
    formState: { errors: nameErrors },
    reset: resetName,
  } = useForm<NameForm>({
    resolver: zodResolver(nameSchema),
    defaultValues: {
      name: user?.name || "",
    },
  });

  // Update form when user data changes
  useEffect(() => {
    if (user?.name) {
      resetName({ name: user.name });
    }
  }, [user?.name, resetName]);

  const onNameSubmit = async (data: NameForm) => {
    setNameSuccess(null);
    setNameError(null);
    try {
      await updateProfile(data.name);
      setNameSuccess("Your name has been updated successfully.");
      resetName({ name: data.name });
    } catch (error) {
      setNameError("Failed to update name. Please try again.");
    }
  };

  const onPasswordSubmit = async (data: PasswordForm) => {
    setPasswordSuccess(null);
    setPasswordError(null);
    try {
      await changePassword(data.currentPassword, data.newPassword);
      setPasswordSuccess("Your password has been updated successfully.");
      resetPassword({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      setPasswordError("Failed to update password. Please check your current password and try again.");
    }
  };

  const handleDeleteAccount = async () => {
    if (!user?.user_id) return;
    setDeleteLoading(true);
    try {
      await deleteAccount(user.user_id);
      await logout();
      router.replace(APP_ROUTES.home);
    } catch {
      setDeleteLoading(false);
      setDeleteModalOpen(false);
      alert("Failed to delete account. Please try again or contact support.");
    }
  };

  const pkg = user?.package_name?.toLowerCase();
  const isTrial = pkg === "trial";
  const trialExpired = isTrial && isTrialExpired(user?.trial_ends_at);
  const noActiveSubscription = !pkg || pkg === "free" || trialExpired;

  return (
    <AuthGuard>
      <main className="min-h-screen bg-soft-white px-4 pt-28 pb-16">
        <div className="mx-auto max-w-3xl space-y-10">
          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h1 className="text-2xl font-semibold text-jet-blue mb-2">Profile</h1>
            <p className="text-sm text-gray-600 mb-6">
              View your account details.
            </p>
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Email</p>
                <p className="mt-1 text-sm text-gray-900">{user?.email}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Plan</p>
                <p className="mt-1 text-sm text-gray-900">
                  {user?.package_name ? user.package_name.charAt(0).toUpperCase() + user.package_name.slice(1) : "No active subscription"}
                </p>
                {isTrial && user?.trial_ends_at && (
                  <p className="mt-1 text-sm text-gray-600">
                    {trialExpired ? (
                      <span className="text-red-600">Trial expired on {formatTrialEnd(user.trial_ends_at)}</span>
                    ) : (
                      <>Trial ends {formatTrialEnd(user.trial_ends_at)}</>
                    )}
                  </p>
                )}
                {noActiveSubscription && !trialExpired && (
                  <p className="mt-1 text-sm text-amber-600">
                    Subscribe to continue using optimizations.
                  </p>
                )}
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Role</p>
                <p className="mt-1 text-sm text-gray-900">{user?.role}</p>
              </div>
            </div>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-jet-blue mb-2">Update Name</h2>
            <p className="text-sm text-gray-600 mb-6">
              Change your display name. This will be shown throughout the application.
            </p>

            <form onSubmit={handleNameSubmit(onNameSubmit)} className="space-y-5 max-w-md">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                  Full Name
                </label>
                <input
                  {...registerName("name")}
                  id="name"
                  type="text"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue text-gray-900"
                  placeholder="Enter your full name"
                />
                {nameErrors.name && (
                  <p className="mt-1 text-sm text-red-600">{nameErrors.name.message}</p>
                )}
              </div>

              {nameError && (
                <p className="text-sm text-red-600" role="alert">
                  {nameError}
                </p>
              )}
              {nameSuccess && (
                <p className="text-sm text-emerald-600" role="status">
                  {nameSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-md bg-jet-blue px-4 py-2 text-sm font-medium text-soft-white shadow-sm transition hover:bg-jet-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jet-blue focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {isLoading ? "Updating..." : "Update name"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-gray-100">
            <h2 className="text-xl font-semibold text-jet-blue mb-2">Change Password</h2>
            <p className="text-sm text-gray-600 mb-6">
              Update the password you use to sign in. You&apos;ll need your current password for security.
            </p>

            <form onSubmit={handlePasswordSubmit(onPasswordSubmit)} className="space-y-5 max-w-md">
              <div>
                <label
                  htmlFor="currentPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Current password
                </label>
                <input
                  {...registerPassword("currentPassword")}
                  id="currentPassword"
                  type="password"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue text-gray-900"
                  placeholder="Enter your current password"
                />
                {passwordErrors.currentPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.currentPassword.message}</p>
                )}
              </div>

              <div>
                <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700">
                  New password
                </label>
                <input
                  {...registerPassword("newPassword")}
                  id="newPassword"
                  type="password"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue text-gray-900"
                  placeholder="Enter a new password"
                />
                {passwordErrors.newPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.newPassword.message}</p>
                )}
              </div>

              <div>
                <label
                  htmlFor="confirmPassword"
                  className="block text-sm font-medium text-gray-700"
                >
                  Confirm new password
                </label>
                <input
                  {...registerPassword("confirmPassword")}
                  id="confirmPassword"
                  type="password"
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue text-gray-900"
                  placeholder="Re-enter your new password"
                />
                {passwordErrors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{passwordErrors.confirmPassword.message}</p>
                )}
              </div>

              {passwordError && (
                <p className="text-sm text-red-600" role="alert">
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p className="text-sm text-emerald-600" role="status">
                  {passwordSuccess}
                </p>
              )}

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-md bg-jet-blue px-4 py-2 text-sm font-medium text-soft-white shadow-sm transition hover:bg-jet-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jet-blue focus-visible:ring-offset-2 disabled:opacity-60"
              >
                {isLoading ? "Updating..." : "Update password"}
              </button>
            </form>
          </section>

          <section className="rounded-2xl bg-white p-6 shadow-sm border border-red-100">
            <h2 className="text-xl font-semibold text-red-600 mb-2">Delete Account</h2>
            <p className="text-sm text-gray-600 mb-6">
              Permanently delete your account and all associated data. This action cannot be undone.
            </p>
            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              disabled={isLoading}
              className="rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-60"
            >
              Delete my account
            </button>
          </section>
        </div>

        <DeleteAccountModal
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={handleDeleteAccount}
          isLoading={deleteLoading}
        />
      </main>
    </AuthGuard>
  );
}



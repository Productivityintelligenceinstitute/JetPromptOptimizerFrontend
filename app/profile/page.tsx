"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import AuthGuard from "@/shared/components/auth/AuthGuard";
import { useAuth } from "@/shared/context/AuthContext";

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

export default function ProfilePage() {
  const { user, changePassword, updateProfile, isLoading } = useAuth();
  const [passwordSuccess, setPasswordSuccess] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [nameSuccess, setNameSuccess] = useState<string | null>(null);
  const [nameError, setNameError] = useState<string | null>(null);

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
                  {user?.package_name ? user.package_name.toUpperCase() : "FREE"}
                </p>
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
        </div>
      </main>
    </AuthGuard>
  );
}



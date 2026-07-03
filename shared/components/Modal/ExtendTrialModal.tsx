"use client";

import React from "react";
import { AdminUserListItem } from "@/shared/api/user";

interface ExtendTrialModalProps {
  isOpen: boolean;
  user: AdminUserListItem | null;
  days: string;
  onDaysChange: (value: string) => void;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export default function ExtendTrialModal({
  isOpen,
  user,
  days,
  onDaysChange,
  onClose,
  onConfirm,
  isLoading = false,
}: ExtendTrialModalProps) {
  if (!isOpen || !user) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget && !isLoading) {
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={handleBackdropClick}
    >
      <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" />

      <div className="relative w-full max-w-lg rounded-2xl bg-white shadow-xl">
        <div className="border-b border-gray-100 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-jet-blue">
            Extend Trial
          </p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">
            {user.full_name || user.email}
          </h3>
          <p className="mt-1 text-sm text-gray-600">{user.email}</p>
        </div>

        <div className="p-6">
          <label className="block text-sm font-medium text-gray-700" htmlFor="trial-days">
            Days to add
          </label>
          <input
            id="trial-days"
            type="number"
            min={1}
            step={1}
            value={days}
            onChange={(e) => onDaysChange(e.target.value)}
            className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:border-jet-blue focus:outline-none focus:ring-2 focus:ring-jet-blue/20"
          />

          <p className="mt-3 text-sm text-gray-600">
            The backend will extend from the later of the current end date or now.
          </p>

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={onConfirm}
              disabled={isLoading}
              className="inline-flex flex-1 items-center justify-center rounded-lg bg-jet-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jet-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? "Extending..." : "Extend Trial"}
            </button>
            <button
              onClick={onClose}
              disabled={isLoading}
              className="inline-flex flex-1 items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

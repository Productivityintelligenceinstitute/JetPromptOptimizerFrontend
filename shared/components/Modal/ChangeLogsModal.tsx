"use client";

import React from "react";
import { AdminUserListItem } from "@/shared/api/user";
import { UserChangeLogItem } from "@/shared/api/adminTrialManagement";

interface ChangeLogsModalProps {
  isOpen: boolean;
  user: AdminUserListItem | null;
  logs: UserChangeLogItem[];
  isLoading?: boolean;
  error?: string | null;
  onClose: () => void;
  onRetry: () => void;
}

const formatDate = (value: string | null): string => {
  if (!value) return "-";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString();
};

const formatStatus = (value: string | null): string => value || "-";

export default function ChangeLogsModal({
  isOpen,
  user,
  logs,
  isLoading = false,
  error = null,
  onClose,
  onRetry,
}: ChangeLogsModalProps) {
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

      <div className="relative w-full max-w-4xl overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="border-b border-gray-100 p-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-jet-blue">
            Change History
          </p>
          <h3 className="mt-2 text-xl font-semibold text-gray-900">
            {user.full_name || user.email}
          </h3>
          <p className="mt-1 text-sm text-gray-600">{user.email}</p>
        </div>

        <div className="max-h-[70vh] overflow-auto p-6">
          {isLoading ? (
            <div className="flex items-center justify-center py-10">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-jet-blue border-r-transparent" />
            </div>
          ) : error ? (
            <div className="rounded-lg border border-red-200 bg-red-50 p-4">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={onRetry}
                className="mt-3 rounded-md bg-white px-3 py-1.5 text-sm font-semibold text-red-700 ring-1 ring-inset ring-red-200 transition hover:bg-red-100"
              >
                Try again
              </button>
            </div>
          ) : logs.length === 0 ? (
            <div className="rounded-lg border border-gray-200 bg-gray-50 p-6 text-center">
              <p className="text-sm text-gray-600">No subscription changes were found for this user.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {logs.map((log) => (
                <div key={log.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-gray-900">{log.action}</p>
                      <p className="mt-1 text-xs text-gray-500">{formatDate(log.created_at)}</p>
                    </div>
                    <span className="inline-flex w-fit rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-jet-blue">
                      {log.performed_by ? "Admin action" : "System action"}
                    </span>
                  </div>

                  <dl className="mt-4 grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-gray-500">Old status</dt>
                      <dd className="font-medium text-gray-900">{formatStatus(log.old_status)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">New status</dt>
                      <dd className="font-medium text-gray-900">{formatStatus(log.new_status)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">Old end date</dt>
                      <dd className="font-medium text-gray-900">{formatDate(log.old_end_date)}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500">New end date</dt>
                      <dd className="font-medium text-gray-900">{formatDate(log.new_end_date)}</dd>
                    </div>
                  </dl>

                  {log.note && (
                    <p className="mt-4 rounded-lg bg-gray-50 px-3 py-2 text-sm text-gray-700">
                      {log.note}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="border-t border-gray-100 p-4">
          <button
            onClick={onClose}
            className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition hover:bg-gray-50"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

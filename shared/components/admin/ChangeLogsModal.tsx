"use client";

import React from "react";
import { UserChangeLogItem } from "@/shared/api/user";

interface ChangeLogsModalProps {
    isOpen: boolean;
    userLabel: string | null;
    items: UserChangeLogItem[];
    isLoading: boolean;
    error: string | null;
    onClose: () => void;
}

const formatDateTime = (value: string | null): string => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
    }).format(date);
};

const getActionLabel = (action: UserChangeLogItem["action"]): string => {
    if (action === "trial_extended") return "Trial extended";
    if (action === "subscription_expired") return "Subscription expired";
    return action;
};

export default function ChangeLogsModal({
    isOpen,
    userLabel,
    items,
    isLoading,
    error,
    onClose,
}: ChangeLogsModalProps) {
    if (!isOpen) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" />

            <div className="relative w-full max-w-3xl overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
                <div className="border-b border-gray-100 px-6 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-jet-blue">
                        Audit Trail
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-gray-900">
                        Change history
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                        {userLabel
                            ? `Subscription changes for ${userLabel}.`
                            : "Subscription changes for this user."}
                    </p>
                </div>

                <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
                    {isLoading ? (
                        <div className="flex items-center justify-center py-10">
                            <div className="text-center">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-jet-blue border-r-transparent" />
                                <p className="mt-4 text-sm text-gray-600">Loading change logs...</p>
                            </div>
                        </div>
                    ) : error ? (
                        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    ) : items.length === 0 ? (
                        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 px-4 py-8 text-center">
                            <p className="text-sm font-medium text-gray-900">No change history yet</p>
                            <p className="mt-2 text-sm text-gray-600">
                                This user has not had any trial extensions or automatic expiries logged.
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {items.map((item) => (
                                <div
                                    key={item.id}
                                    className="rounded-xl border border-gray-200 bg-white px-4 py-4 shadow-sm"
                                >
                                    <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                                        <div>
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="rounded-full bg-blue-50 px-2.5 py-1 text-xs font-semibold text-jet-blue">
                                                    {getActionLabel(item.action)}
                                                </span>
                                                <span className="text-xs text-gray-500">
                                                    {formatDateTime(item.created_at)}
                                                </span>
                                            </div>
                                            <p className="mt-3 text-sm text-gray-700">
                                                {item.note || "No note provided."}
                                            </p>
                                        </div>
                                        <div className="text-right text-xs text-gray-500">
                                            <p>
                                                Performed by{" "}
                                                <span className="font-medium text-gray-700">
                                                    {item.performed_by || "System"}
                                                </span>
                                            </p>
                                        </div>
                                    </div>

                                    <dl className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                                        <div className="rounded-lg bg-gray-50 px-3 py-2">
                                            <dt className="text-xs uppercase tracking-wide text-gray-500">
                                                Old status
                                            </dt>
                                            <dd className="mt-1 text-sm font-medium text-gray-900">
                                                {item.old_status || "-"}
                                            </dd>
                                        </div>
                                        <div className="rounded-lg bg-gray-50 px-3 py-2">
                                            <dt className="text-xs uppercase tracking-wide text-gray-500">
                                                New status
                                            </dt>
                                            <dd className="mt-1 text-sm font-medium text-gray-900">
                                                {item.new_status || "-"}
                                            </dd>
                                        </div>
                                        <div className="rounded-lg bg-gray-50 px-3 py-2">
                                            <dt className="text-xs uppercase tracking-wide text-gray-500">
                                                Old end date
                                            </dt>
                                            <dd className="mt-1 text-sm font-medium text-gray-900">
                                                {formatDateTime(item.old_end_date)}
                                            </dd>
                                        </div>
                                        <div className="rounded-lg bg-gray-50 px-3 py-2">
                                            <dt className="text-xs uppercase tracking-wide text-gray-500">
                                                New end date
                                            </dt>
                                            <dd className="mt-1 text-sm font-medium text-gray-900">
                                                {formatDateTime(item.new_end_date)}
                                            </dd>
                                        </div>
                                    </dl>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="border-t border-gray-100 px-6 py-4 text-right">
                    <button
                        type="button"
                        onClick={onClose}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
                    >
                        Close
                    </button>
                </div>
            </div>
        </div>
    );
}

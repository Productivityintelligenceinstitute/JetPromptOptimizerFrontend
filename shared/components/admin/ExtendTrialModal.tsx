"use client";

import React from "react";

interface ExtendTrialModalProps {
    isOpen: boolean;
    userEmail: string | null;
    days: number;
    isSubmitting: boolean;
    error: string | null;
    onDaysChange: (days: number) => void;
    onSubmit: () => void;
    onClose: () => void;
}

export default function ExtendTrialModal({
    isOpen,
    userEmail,
    days,
    isSubmitting,
    error,
    onDaysChange,
    onSubmit,
    onClose,
}: ExtendTrialModalProps) {
    if (!isOpen || !userEmail) return null;

    const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget && !isSubmitting) {
            onClose();
        }
    };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            onClick={handleBackdropClick}
        >
            <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-sm transition-opacity" />

            <div className="relative w-full max-w-lg rounded-2xl border border-gray-200 bg-white shadow-2xl">
                <div className="border-b border-gray-100 px-6 py-5">
                    <p className="text-xs font-semibold uppercase tracking-wide text-jet-blue">
                        Trial Management
                    </p>
                    <h3 className="mt-1 text-xl font-semibold text-gray-900">
                        Extend trial
                    </h3>
                    <p className="mt-2 text-sm text-gray-600">
                        Add days to this user&apos;s trial. If it has already expired, the trial
                        will be reactivated automatically.
                    </p>
                </div>

                <div className="px-6 py-5">
                    <div className="rounded-xl bg-blue-50 px-4 py-3 text-sm text-blue-900">
                        <span className="font-medium">User:</span> {userEmail}
                    </div>

                    <div className="mt-5">
                        <label
                            htmlFor="extend-days"
                            className="mb-2 block text-sm font-medium text-gray-700"
                        >
                            Days to add
                        </label>
                        <input
                            id="extend-days"
                            type="number"
                            min={1}
                            value={days}
                            onChange={(e) => {
                                const nextValue = Number(e.target.value);
                                onDaysChange(Number.isFinite(nextValue) ? nextValue : 0);
                            }}
                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue"
                            disabled={isSubmitting}
                        />
                        <p className="mt-2 text-xs text-gray-500">
                            The backend starts the extension from the later of now or the current
                            end date.
                        </p>
                    </div>

                    {error && (
                        <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3">
                            <p className="text-sm text-red-700">{error}</p>
                        </div>
                    )}
                </div>

                <div className="flex flex-col gap-3 border-t border-gray-100 px-6 py-4 sm:flex-row sm:justify-end">
                    <button
                        type="button"
                        onClick={onClose}
                        disabled={isSubmitting}
                        className="rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        onClick={onSubmit}
                        disabled={isSubmitting || !Number.isFinite(days) || days < 1}
                        className="inline-flex items-center justify-center rounded-lg bg-jet-blue px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-jet-blue/90 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                        {isSubmitting ? "Extending..." : "Extend trial"}
                    </button>
                </div>
            </div>
        </div>
    );
}

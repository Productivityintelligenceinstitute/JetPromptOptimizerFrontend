"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import AdminGuard from "@/shared/components/auth/AdminGuard";
import { AdminNavbar } from "@/shared/components/navbar/AdminNavbar";
import { useAuth } from "@/shared/context/AuthContext";
import { getAdminUsers, AdminUserListItem, updateUserRole } from "@/shared/api/user";
import {
  extendTrial,
  getUserChangeLogs,
  UserChangeLogItem,
} from "@/shared/api/adminTrialManagement";
import ExtendTrialModal from "@/shared/components/Modal/ExtendTrialModal";
import ChangeLogsModal from "@/shared/components/Modal/ChangeLogsModal";

type FeedbackState = {
  type: "success" | "error";
  message: string;
} | null;

const formatSubscriptionEndDate = (value: string | null | undefined): string => {
  if (!value) return "-";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleString();
};

export default function AdminUsersPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const initialPage = Number(searchParams.get("page") || "1") || 1;
  const initialSize = Number(searchParams.get("size") || "10") || 10;
  const initialSearch = searchParams.get("q") || "";

  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialSize);
  const [search, setSearch] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);
  const [users, setUsers] = useState<AdminUserListItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [roleUpdatingEmail, setRoleUpdatingEmail] = useState<string | null>(null);

  const [trialUser, setTrialUser] = useState<AdminUserListItem | null>(null);
  const [trialDays, setTrialDays] = useState("7");
  const [isExtendingTrial, setIsExtendingTrial] = useState(false);

  const [changeLogUser, setChangeLogUser] = useState<AdminUserListItem | null>(null);
  const [changeLogs, setChangeLogs] = useState<UserChangeLogItem[]>([]);
  const [isLoadingChangeLogs, setIsLoadingChangeLogs] = useState(false);
  const [changeLogError, setChangeLogError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      fetchUsers(currentPage, itemsPerPage, search);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPage, itemsPerPage, search]);

  const fetchUsers = async (page: number, size: number, query: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setFeedback(null);
      const data = await getAdminUsers(user.user_id, page, size, query);
      setUsers(data.items);
      setTotalItems(data.total);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to load users.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updateQueryParams = (page: number, size: number, query: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    params.set("size", String(size));
    if (query) params.set("q", query);
    else params.delete("q");
    router.push(`/admin/users?${params.toString()}`);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    updateQueryParams(page, itemsPerPage, search);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    updateQueryParams(1, newItemsPerPage, search);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchInput.trim();
    setCurrentPage(1);
    setSearch(query);
    updateQueryParams(1, itemsPerPage, query);
  };

  const handleRoleChange = (email: string, newRole: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.email === email ? { ...u, role: newRole } : u))
    );
  };

  const handleRoleSave = async (email: string, newRole: string) => {
    try {
      setRoleUpdatingEmail(email);
      setFeedback(null);
      await updateUserRole(email, newRole);
      await fetchUsers(currentPage, itemsPerPage, search);
      setFeedback({ type: "success", message: "User role updated successfully." });
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to update user role.",
      });
    } finally {
      setRoleUpdatingEmail(null);
    }
  };

  const openExtendTrialModal = (selectedUser: AdminUserListItem) => {
    setTrialUser(selectedUser);
    setTrialDays("7");
    setFeedback(null);
  };

  const closeExtendTrialModal = () => {
    if (isExtendingTrial) return;
    setTrialUser(null);
  };

  const handleExtendTrial = async () => {
    if (!user || !trialUser) return;

    const days = Number.parseInt(trialDays, 10);
    if (!Number.isInteger(days) || days <= 0) {
      setFeedback({
        type: "error",
        message: "Please enter a valid number of days greater than 0.",
      });
      return;
    }

    try {
      setIsExtendingTrial(true);
      setFeedback(null);
      const response = await extendTrial(user.user_id, {
        user_email: trialUser.email,
        days,
      });

      await fetchUsers(currentPage, itemsPerPage, search);
      setFeedback({
        type: "success",
        message: `Trial extended for ${response.user_email} by ${response.days_added} day(s).`,
      });
      setTrialUser(null);
    } catch (err: any) {
      setFeedback({
        type: "error",
        message: err.message || "Failed to extend trial.",
      });
    } finally {
      setIsExtendingTrial(false);
    }
  };

  const openChangeLogsModal = async (selectedUser: AdminUserListItem) => {
    if (!user) return;

    setChangeLogUser(selectedUser);
    setChangeLogs([]);
    setChangeLogError(null);
    setIsLoadingChangeLogs(true);

    try {
      const data = await getUserChangeLogs(user.user_id, selectedUser.user_id);
      setChangeLogs(data.items);
    } catch (err: any) {
      setChangeLogError(err.message || "Failed to load change logs.");
    } finally {
      setIsLoadingChangeLogs(false);
    }
  };

  const closeChangeLogsModal = () => {
    if (isLoadingChangeLogs) return;
    setChangeLogUser(null);
    setChangeLogs([]);
    setChangeLogError(null);
  };

  const retryChangeLogs = async () => {
    if (!changeLogUser || !user) return;

    setChangeLogError(null);
    setIsLoadingChangeLogs(true);

    try {
      const data = await getUserChangeLogs(user.user_id, changeLogUser.user_id);
      setChangeLogs(data.items);
    } catch (err: any) {
      setChangeLogError(err.message || "Failed to load change logs.");
    } finally {
      setIsLoadingChangeLogs(false);
    }
  };

  const totalPages = useMemo(
    () => (itemsPerPage ? Math.max(1, Math.ceil(totalItems / itemsPerPage)) : 1),
    [itemsPerPage, totalItems]
  );

  const showFrom = totalItems === 0 ? 0 : Math.min((currentPage - 1) * itemsPerPage + 1, totalItems);
  const showTo = totalItems === 0 ? 0 : Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />

        <main className="mx-auto max-w-7xl px-4 py-8 pt-28 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h1 className="mb-2 text-3xl font-semibold text-[#335386]">
                  Manage Users
                </h1>
                <p className="text-gray-600">
                  View all users, update roles, extend trials, and inspect account history.
                </p>
              </div>

              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search by email or name..."
                  className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue"
                />
                <button
                  type="submit"
                  className="rounded-md bg-jet-blue px-3 py-1.5 text-sm text-white hover:bg-jet-blue/90"
                >
                  Search
                </button>
              </form>
            </div>
          </div>

          {feedback && (
            <div
              className={`mb-6 rounded-lg border p-4 ${
                feedback.type === "success"
                  ? "border-green-200 bg-green-50"
                  : "border-red-200 bg-red-50"
              }`}
            >
              <p
                className={`text-sm ${
                  feedback.type === "success" ? "text-green-700" : "text-red-600"
                }`}
              >
                {feedback.message}
              </p>
            </div>
          )}

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-jet-blue border-r-transparent" />
                <p className="mt-4 text-sm text-gray-600">Loading users...</p>
              </div>
            </div>
          ) : users.length === 0 ? (
            <div className="rounded-xl border border-gray-200 bg-white py-12 text-center">
              <p className="mb-2 text-gray-600">No users found.</p>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Email
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Name
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Role
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Trial End
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Subscription
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Created At
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Firebase UID
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {users.map((u) => {
                      const isSelf = user && u.user_id === user.user_id;
                      const subscriptionLabel =
                        u.subscription_status || u.package_name || "-";
                      const expiryDate = u.expiry_date || u.trial_ends_at || null;

                      return (
                        <tr key={u.user_id}>
                          <td className="px-4 py-3 text-sm text-gray-900">{u.email}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {u.full_name || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="flex items-center gap-2">
                              <select
                                value={u.role}
                                onChange={(e) =>
                                  !isSelf && handleRoleChange(u.email, e.target.value)
                                }
                                disabled={!!isSelf}
                                className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-400"
                              >
                                <option value="user">user</option>
                                <option value="admin">admin</option>
                              </select>
                              <button
                                onClick={() => !isSelf && handleRoleSave(u.email, u.role)}
                                disabled={!!isSelf || roleUpdatingEmail === u.email}
                                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {isSelf
                                  ? "You"
                                  : roleUpdatingEmail === u.email
                                  ? "Saving..."
                                  : "Save"}
                              </button>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {expiryDate ? (
                              <div className="font-medium text-gray-900">
                                {formatSubscriptionEndDate(expiryDate)}
                              </div>
                            ) : (
                              <div className="text-gray-400">-</div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="font-medium text-gray-900">{subscriptionLabel}</div>
                            {u.is_expired && (
                              <div className="mt-1 text-xs font-medium text-red-600">
                                Expired
                              </div>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-500">
                            {u.created_at ? new Date(u.created_at).toLocaleDateString() : "-"}
                          </td>
                          <td className="max-w-xs truncate px-4 py-3 text-xs text-gray-500">
                            {u.firebase_uid || "-"}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex flex-wrap gap-2">
                              <button
                                onClick={() => openExtendTrialModal(u)}
                                className="rounded-md border border-jet-blue px-2 py-1 text-xs font-medium text-jet-blue transition hover:bg-blue-50"
                              >
                                Extend trial
                              </button>
                              <button
                                onClick={() => void openChangeLogsModal(u)}
                                className="rounded-md border border-gray-300 bg-white px-2 py-1 text-xs font-medium text-gray-700 transition hover:bg-gray-50"
                              >
                                Change history
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4">
                <div className="text-sm text-gray-600">
                  Showing <span className="font-semibold">{showFrom}</span> to{" "}
                  <span className="font-semibold">{showTo}</span> of{" "}
                  <span className="font-semibold">{totalItems}</span> users
                </div>

                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-sm">
                    <span>Rows per page:</span>
                    <select
                      value={itemsPerPage}
                      onChange={(e) => handleItemsPerPageChange(Number(e.target.value))}
                      className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue"
                    >
                      <option value={10}>10</option>
                      <option value={25}>25</option>
                      <option value={50}>50</option>
                    </select>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Previous
                    </button>
                    <span className="text-sm text-gray-600">
                      Page <span className="font-semibold">{currentPage}</span> of{" "}
                      <span className="font-semibold">{totalPages}</span>
                    </span>
                    <button
                      onClick={() =>
                        currentPage < totalPages && handlePageChange(currentPage + 1)
                      }
                      disabled={currentPage === totalPages}
                      className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>

      <ExtendTrialModal
        isOpen={!!trialUser}
        user={trialUser}
        days={trialDays}
        onDaysChange={setTrialDays}
        onClose={closeExtendTrialModal}
        onConfirm={() => void handleExtendTrial()}
        isLoading={isExtendingTrial}
      />

      <ChangeLogsModal
        isOpen={!!changeLogUser}
        user={changeLogUser}
        logs={changeLogs}
        isLoading={isLoadingChangeLogs}
        error={changeLogError}
        onClose={closeChangeLogsModal}
        onRetry={() => void retryChangeLogs()}
      />
    </AdminGuard>
  );
}

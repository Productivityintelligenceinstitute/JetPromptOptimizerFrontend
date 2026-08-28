"use client";

import React, { useEffect, useMemo, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import AdminGuard from "@/shared/components/auth/AdminGuard";
import { AdminNavbar } from "@/shared/components/navbar/AdminNavbar";
import Notification from "@/shared/components/Notification/Notification";
import ExtendTrialModal from "@/shared/components/admin/ExtendTrialModal";
import ChangeLogsModal from "@/shared/components/admin/ChangeLogsModal";
import { useAuth } from "@/shared/context/AuthContext";
import {
  getAdminUsers,
  AdminUserListItem,
  updateUserRole,
  extendTrial,
  getUserChangeLogs,
  UserChangeLogItem,
} from "@/shared/api/user";

function AdminUsersContent() {
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
  const [error, setError] = useState<string | null>(null);
  const [roleUpdatingEmail, setRoleUpdatingEmail] = useState<string | null>(null);
  const [notification, setNotification] = useState<{
    message: string;
    type: "success" | "error" | "info";
  } | null>(null);
  const [extendTrialUser, setExtendTrialUser] = useState<AdminUserListItem | null>(null);
  const [extendTrialDays, setExtendTrialDays] = useState(7);
  const [extendTrialError, setExtendTrialError] = useState<string | null>(null);
  const [isExtendingTrial, setIsExtendingTrial] = useState(false);
  const [changeLogsUser, setChangeLogsUser] = useState<AdminUserListItem | null>(null);
  const [changeLogs, setChangeLogs] = useState<UserChangeLogItem[]>([]);
  const [changeLogsLoading, setChangeLogsLoading] = useState(false);
  const [changeLogsError, setChangeLogsError] = useState<string | null>(null);

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
      setError(null);
      const data = await getAdminUsers(user.user_id, page, size, query);
      setUsers(data.items);
      setTotalItems(data.total);
    } catch (err: any) {
      setError(err.message || "Failed to load users.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusCode = (err: any): number | undefined =>
    err?.statusCode ?? err?.response?.status;

  const getErrorMessage = (err: any): string =>
    err?.message || err?.response?.data?.detail || "An unexpected error occurred.";

  const getExtendTrialErrorMessage = (err: any): string => {
    const statusCode = getStatusCode(err);
    const message = getErrorMessage(err);

    if (statusCode === 404) {
      if (message === "Trial user not found") {
        return message;
      }
      return "Not authorized or trial user not found.";
    }

    if (statusCode === 400) {
      return message;
    }

    if (statusCode === 422) {
      return "Please enter a valid number of days.";
    }

    return message || "Failed to extend trial.";
  };

  const getChangeLogsErrorMessage = (err: any): string => {
    const statusCode = getStatusCode(err);
    if (statusCode === 404) {
      return "Not authorized or user not found.";
    }
    return getErrorMessage(err) || "Failed to load change history.";
  };

  const closeExtendTrialModal = () => {
    setExtendTrialUser(null);
    setExtendTrialDays(7);
    setExtendTrialError(null);
    setIsExtendingTrial(false);
  };

  const closeChangeLogsModal = () => {
    setChangeLogsUser(null);
    setChangeLogs([]);
    setChangeLogsLoading(false);
    setChangeLogsError(null);
  };

  const handleOpenExtendTrial = (u: AdminUserListItem) => {
    setExtendTrialUser(u);
    setExtendTrialDays(7);
    setExtendTrialError(null);
  };

  const handleExtendTrialSubmit = async () => {
    if (!user || !extendTrialUser) return;

    try {
      setIsExtendingTrial(true);
      setExtendTrialError(null);
      const result = await extendTrial(user.user_id, extendTrialUser.email, extendTrialDays);
      setNotification({
        message: `Extended trial for ${result.user_email} by ${result.days_added} day(s).`,
        type: "success",
      });
      closeExtendTrialModal();
      await fetchUsers(currentPage, itemsPerPage, search);
    } catch (err: any) {
      setExtendTrialError(getExtendTrialErrorMessage(err));
    } finally {
      setIsExtendingTrial(false);
    }
  };

  const handleOpenChangeLogs = (u: AdminUserListItem) => {
    setChangeLogsUser(u);
    setChangeLogs([]);
    setChangeLogsError(null);
    setChangeLogsLoading(true);
  };

  useEffect(() => {
    if (!user || !changeLogsUser) return;

    let isMounted = true;

    const loadChangeLogs = async () => {
      try {
        setChangeLogsLoading(true);
        setChangeLogsError(null);
        const data = await getUserChangeLogs(user.user_id, changeLogsUser.user_id);
        if (isMounted) {
          setChangeLogs(data.items);
        }
      } catch (err: any) {
        if (isMounted) {
          setChangeLogsError(getChangeLogsErrorMessage(err));
          setChangeLogs([]);
        }
      } finally {
        if (isMounted) {
          setChangeLogsLoading(false);
        }
      }
    };

    loadChangeLogs();

    return () => {
      isMounted = false;
    };
  }, [changeLogsUser, user]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    params.set("size", String(itemsPerPage));
    if (search) params.set("q", search);
    else params.delete("q");
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    params.set("size", String(newItemsPerPage));
    if (search) params.set("q", search);
    else params.delete("q");
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    setSearch(searchInput.trim());
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    params.set("size", String(itemsPerPage));
    if (searchInput.trim()) params.set("q", searchInput.trim());
    else params.delete("q");
    router.push(`/admin/users?${params.toString()}`);
  };

  const handleRoleChange = (email: string, newRole: string) => {
    setUsers((prev) =>
      prev.map((u) => (u.email === email ? { ...u, role: newRole } : u))
    );
  };

  const handleRoleSave = async (email: string, newRole: string) => {
    try {
      setRoleUpdatingEmail(email);
      await updateUserRole(email, newRole);
      await fetchUsers(currentPage, itemsPerPage, search);
    } catch (err: any) {
      setError(err.message || "Failed to update user role.");
    } finally {
      setRoleUpdatingEmail(null);
    }
  };

  const totalPages = useMemo(
    () => (itemsPerPage ? Math.max(1, Math.ceil(totalItems / itemsPerPage)) : 1),
    [itemsPerPage, totalItems]
  );

  function formatPackageLevel(pkg: string | null | undefined): string {
    if (!pkg) return "No subscription";
    const n = pkg.toLowerCase();
    if (n === "essential") return "Essential";
    if (n === "pro") return "Pro";
    if (n === "trial") return "Trial";
    return pkg.charAt(0).toUpperCase() + pkg.slice(1);
  }

  function subscriptionStatusClass(status: string | null | undefined): string {
    const base = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ";
    const s = (status || "").toLowerCase();
    if (s === "active" || s === "trialing") return base + "bg-green-100 text-green-800";
    if (s === "canceled" || s === "cancelled" || s === "expired" || s === "no subscription") return base + "bg-red-100 text-red-800";
    if (s === "past due" || s === "suspended") return base + "bg-amber-100 text-amber-800";
    return base + "bg-gray-100 text-gray-800";
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <AdminNavbar />
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pt-36">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-semibold text-[#335386] mb-2">
                Manage Users
              </h1>
              <p className="text-gray-600">
                View all users, update roles, extend trials, and inspect account details.
              </p>
            </div>
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search by email or name..."
                className="w-64 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-jet-blue focus:border-jet-blue"
              />
              <button
                type="submit"
                className="px-3 py-1.5 text-sm rounded-md bg-jet-blue text-white hover:bg-jet-blue/90"
              >
                Search
              </button>
            </form>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {notification && (
          <Notification
            message={notification.message}
            type={notification.type}
            onClose={() => setNotification(null)}
          />
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-jet-blue border-r-transparent" />
              <p className="mt-4 text-sm text-gray-600">Loading users...</p>
            </div>
          </div>
        ) : users.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-600 mb-2">No users found.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto bg-white rounded-xl border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Package Level
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Subscription Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created On
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Expiry
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Firebase UID
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Trial Tools
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => {
                    const isSelf = user && u.user_id === user.user_id;
                    return (
                      <tr key={u.user_id}>
                        <td className="px-4 py-3 text-sm text-gray-900">{u.email}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {u.full_name || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {formatPackageLevel(u.package_name)}
                        </td>
                        <td className="px-4 py-3">
                          <span className={subscriptionStatusClass(u.subscription_status)}>
                            {u.subscription_status || "-"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {u.created_at
                            ? new Date(u.created_at).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-500">
                          {u.expiry_date
                            ? new Date(u.expiry_date).toLocaleDateString()
                            : "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <select
                              value={u.role}
                              onChange={(e) =>
                                !isSelf && handleRoleChange(u.email, e.target.value)
                              }
                              disabled={!!isSelf}
                              className="rounded-md border border-gray-300 px-2 py-1 text-xs text-gray-900 focus:outline-none focus:ring-1 focus:ring-jet-blue focus:border-jet-blue disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed"
                            >
                              <option value="user">user</option>
                              <option value="admin">admin</option>
                            </select>
                            <button
                              type="button"
                              onClick={() => !isSelf && handleRoleSave(u.email, u.role)}
                              disabled={!!isSelf || roleUpdatingEmail === u.email}
                              className="px-2 py-1 text-xs rounded-md border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                            >
                              {isSelf
                                ? "You"
                                : roleUpdatingEmail === u.email
                                  ? "Saving..."
                                  : "Save"}
                            </button>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-500 max-w-xs truncate">
                          {u.firebase_uid || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() => handleOpenExtendTrial(u)}
                              className="rounded-md border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-800 transition-colors hover:bg-amber-100"
                            >
                              Extend trial
                            </button>
                            <button
                              type="button"
                              onClick={() => handleOpenChangeLogs(u)}
                              className="rounded-md border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 transition-colors hover:bg-gray-50"
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

            <div className="mt-6 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                Showing{" "}
                <span className="font-semibold">
                  {Math.min((currentPage - 1) * itemsPerPage + 1, totalItems)}
                </span>{" "}
                to{" "}
                <span className="font-semibold">
                  {Math.min(currentPage * itemsPerPage, totalItems)}
                </span>{" "}
                of <span className="font-semibold">{totalItems}</span> users
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-sm">
                  <span>Rows per page:</span>
                  <select
                    value={itemsPerPage}
                    onChange={(e) =>
                      handleItemsPerPageChange(Number(e.target.value))
                    }
                    className="rounded-md border border-gray-300 px-2 py-1 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-jet-blue focus:border-jet-blue"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                  </select>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => currentPage > 1 && handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Previous
                  </button>
                  <span className="text-sm text-gray-600">
                    Page <span className="font-semibold">{currentPage}</span> of{" "}
                    <span className="font-semibold">{totalPages}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      currentPage < totalPages && handlePageChange(currentPage + 1)
                    }
                    disabled={currentPage === totalPages}
                    className="px-3 py-1.5 text-sm rounded-md border border-gray-300 bg-white text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                  >
                    Next
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </main>
      <ExtendTrialModal
        isOpen={!!extendTrialUser}
        userEmail={extendTrialUser?.email || null}
        days={extendTrialDays}
        isSubmitting={isExtendingTrial}
        error={extendTrialError}
        onDaysChange={setExtendTrialDays}
        onSubmit={handleExtendTrialSubmit}
        onClose={closeExtendTrialModal}
      />
      <ChangeLogsModal
        isOpen={!!changeLogsUser}
        userLabel={changeLogsUser?.email || null}
        items={changeLogs}
        isLoading={changeLogsLoading}
        error={changeLogsError}
        onClose={closeChangeLogsModal}
      />
    </div>
  );
}

export default function AdminUsersPage() {
  return (
    <AdminGuard>
      <Suspense
        fallback={
          <div className="min-h-screen bg-gray-50">
            <AdminNavbar />
            <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pt-28">
              <div className="flex items-center justify-center py-12">
                <div className="text-center">
                  <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-jet-blue border-r-transparent" />
                  <p className="mt-4 text-sm text-gray-600">Loading...</p>
                </div>
              </div>
            </main>
          </div>
        }
      >
        <AdminUsersContent />
      </Suspense>
    </AdminGuard>
  );
}

"use client";

import { useState, useMemo } from "react";
import AdminGuard from "@/shared/components/auth/AdminGuard";
import { AdminNavbar } from "@/shared/components/navbar/AdminNavbar";
import Pagination from "@/shared/components/admin/Pagination";

type Role = "user" | "admin";

interface AdminUser {
    id: number;
    name: string;
    email: string;
    role: Role;
    packageName: string;
    status: "active" | "invited" | "inactive";
    lastActive: string;
}

const DUMMY_USERS: AdminUser[] = [
    {
        id: 1,
        name: "Essential Admin",
        email: "essential@byom.de",
        role: "admin",
        packageName: "Pro",
        status: "active",
        lastActive: "2 hours ago",
    },
    {
        id: 2,
        name: "Jane Doe",
        email: "jane@example.com",
        role: "user",
        packageName: "Essential",
        status: "active",
        lastActive: "Yesterday",
    },
    {
        id: 3,
        name: "John Smith",
        email: "john@example.com",
        role: "user",
        packageName: "Free",
        status: "invited",
        lastActive: "—",
    },
    {
        id: 4,
        name: "Enterprise Owner",
        email: "owner@enterprise.com",
        role: "admin",
        packageName: "Enterprise",
        status: "active",
        lastActive: "3 days ago",
    },
    {
        id: 5,
        name: "Alice Johnson",
        email: "alice@example.com",
        role: "user",
        packageName: "Pro",
        status: "active",
        lastActive: "5 hours ago",
    },
    {
        id: 6,
        name: "Bob Williams",
        email: "bob@example.com",
        role: "user",
        packageName: "Essential",
        status: "active",
        lastActive: "1 day ago",
    },
    {
        id: 7,
        name: "Carol Brown",
        email: "carol@example.com",
        role: "user",
        packageName: "Free",
        status: "inactive",
        lastActive: "2 weeks ago",
    },
    {
        id: 8,
        name: "David Miller",
        email: "david@example.com",
        role: "user",
        packageName: "Pro",
        status: "active",
        lastActive: "30 minutes ago",
    },
    {
        id: 9,
        name: "Emma Davis",
        email: "emma@example.com",
        role: "user",
        packageName: "Essential",
        status: "invited",
        lastActive: "—",
    },
    {
        id: 10,
        name: "Frank Wilson",
        email: "frank@example.com",
        role: "user",
        packageName: "Free",
        status: "active",
        lastActive: "3 days ago",
    },
    {
        id: 11,
        name: "Grace Moore",
        email: "grace@example.com",
        role: "user",
        packageName: "Pro",
        status: "active",
        lastActive: "1 hour ago",
    },
    {
        id: 12,
        name: "Henry Taylor",
        email: "henry@example.com",
        role: "user",
        packageName: "Essential",
        status: "active",
        lastActive: "6 hours ago",
    },
];

export default function AdminUsersPage() {
    const [users, setUsers] = useState<AdminUser[]>(DUMMY_USERS);
    const [search, setSearch] = useState("");
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);

    const handleRoleChange = (id: number, role: Role) => {
        setUsers((prev) =>
            prev.map((user) =>
                user.id === id
                    ? {
                        ...user,
                        role,
                    }
                    : user
            )
        );
    };

    const filtered = useMemo(() => {
        return users.filter((user) => {
            const query = search.toLowerCase();
            return (
                user.name.toLowerCase().includes(query) ||
                user.email.toLowerCase().includes(query) ||
                user.packageName.toLowerCase().includes(query)
            );
        });
    }, [users, search]);

    const paginatedUsers = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return filtered.slice(startIndex, endIndex);
    }, [filtered, currentPage, itemsPerPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-gray-50">
                <AdminNavbar />
                <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 pt-28">
                    <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                        <div>
                            <h1 className="text-3xl font-semibold text-[#335386] mb-2">
                                Users & Roles
                            </h1>
                            <p className="text-sm text-gray-600 max-w-2xl">
                                See who is using the platform, which package they are on, and promote
                                or demote users to admin as needed.
                            </p>
                        </div>
                        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
                            <input
                                type="text"
                                placeholder="Search by name, email, or package"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue"
                            />
                        </div>
                    </div>

                    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-4 sm:p-6 lg:p-8">
                        <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900">
                                    All users
                                </h2>
                                <p className="text-xs text-gray-600">
                                    {filtered.length} user{filtered.length !== 1 ? "s" : ""} in view
                                </p>
                            </div>
                        </div>

                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                                            User
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                                            Package
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                                            Role
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                                            Status
                                        </th>
                                        <th className="px-4 py-2 text-left font-medium text-gray-600">
                                            Last active
                                        </th>
                                        <th className="px-4 py-2 text-right font-medium text-gray-600">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {paginatedUsers.map((user) => (
                                        <tr key={user.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2">
                                                <div className="flex flex-col">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {user.name}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {user.email}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-4 py-2 text-gray-700">
                                                {user.packageName}
                                            </td>
                                            <td className="px-4 py-2">
                                                <select
                                                    value={user.role}
                                                    onChange={(e) =>
                                                        handleRoleChange(
                                                            user.id,
                                                            e.target.value as Role
                                                        )
                                                    }
                                                    className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue"
                                                >
                                                    <option value="user">User</option>
                                                    <option value="admin">Admin</option>
                                                </select>
                                            </td>
                                            <td className="px-4 py-2">
                                                <span
                                                    className={
                                                        user.status === "active"
                                                            ? "inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                                                            : user.status === "invited"
                                                                ? "inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                                                                : "inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                                                    }
                                                >
                                                    {user.status.charAt(0).toUpperCase() +
                                                        user.status.slice(1)}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2 text-gray-700">
                                                {user.lastActive}
                                            </td>
                                            <td className="px-4 py-2 text-right">
                                                <button
                                                    className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                                                    onClick={() => setSelectedUser(user)}
                                                >
                                                    View details
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden space-y-3">
                            {paginatedUsers.map((user) => (
                                <div
                                    key={user.id}
                                    className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div>
                                            <p className="text-sm font-semibold text-gray-900">
                                                {user.name}
                                            </p>
                                            <p className="text-xs text-gray-500">{user.email}</p>
                                        </div>
                                        <span
                                            className={
                                                user.status === "active"
                                                    ? "inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700"
                                                    : user.status === "invited"
                                                        ? "inline-flex rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700"
                                                        : "inline-flex rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-700"
                                            }
                                        >
                                            {user.status.charAt(0).toUpperCase() +
                                                user.status.slice(1)}
                                        </span>
                                    </div>
                                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-gray-600">
                                        <div>
                                            <p className="font-medium text-gray-800">Package</p>
                                            <p>{user.packageName}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">Last active</p>
                                            <p>{user.lastActive}</p>
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-800">Role</p>
                                            <select
                                                value={user.role}
                                                onChange={(e) =>
                                                    handleRoleChange(
                                                        user.id,
                                                        e.target.value as Role
                                                    )
                                                }
                                                className="mt-1 w-full rounded-lg border border-gray-300 bg-white px-2 py-1 text-xs text-gray-900 focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue"
                                            >
                                                <option value="user">User</option>
                                                <option value="admin">Admin</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mt-3 flex justify-end">
                                        <button
                                            className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                                            onClick={() => setSelectedUser(user)}
                                        >
                                            View details
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        <Pagination
                            totalItems={filtered.length}
                            itemsPerPage={itemsPerPage}
                            currentPage={currentPage}
                            onPageChange={handlePageChange}
                            onItemsPerPageChange={handleItemsPerPageChange}
                            showItemsPerPage={true}
                        />
                    </section>

                    {selectedUser && (
                        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
                            <div className="w-full max-w-md rounded-2xl bg-white shadow-xl border border-gray-200">
                                <div className="flex items-center justify-between border-b border-gray-200 px-5 py-3">
                                    <h2 className="text-base font-semibold text-gray-900">
                                        User details
                                    </h2>
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="text-sm text-gray-500 hover:text-gray-800 cursor-pointer"
                                    >
                                        ✕
                                    </button>
                                </div>

                                <div className="px-5 py-4 space-y-3 text-sm">
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Name
                                        </p>
                                        <p className="text-gray-900">{selectedUser.name}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                            Email
                                        </p>
                                        <p className="text-gray-900 break-all">{selectedUser.email}</p>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Role
                                            </p>
                                            <p className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-medium text-gray-800">
                                                {selectedUser.role === "admin" ? "Admin" : "User"}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Package
                                            </p>
                                            <p className="text-gray-900">{selectedUser.packageName}</p>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Status
                                            </p>
                                            <p className="inline-flex items-center rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                                {selectedUser.status.charAt(0).toUpperCase() +
                                                    selectedUser.status.slice(1)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                                Last active
                                            </p>
                                            <p className="text-gray-900">{selectedUser.lastActive}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2 border-t border-gray-200 px-5 py-3">
                                    <button
                                        onClick={() => setSelectedUser(null)}
                                        className="rounded-lg border border-gray-300 bg-white px-4 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer"
                                    >
                                        Close
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </main>
            </div>
        </AdminGuard>
    );
}



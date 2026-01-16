"use client";

import Link from "next/link";
import { AdminNavbar } from "@/shared/components/navbar/AdminNavbar";
import AdminGuard from "@/shared/components/auth/AdminGuard";
import { useAuth } from "@/shared/context/AuthContext";

export default function AdminPage() {
    const { user } = useAuth();

    const cards = [
        {
            href: "/admin/kb",
            title: "Admin - KB Ingestion",
            description: "Ingest PDFs, documents, and knowledge sources to power the optimizer.",
            badge: "Knowledge Base",
        },
        {
            href: "/admin/packages",
            title: "Manage Subscription Packages & Permissions",
            description: "Design plans, toggle permissions, and control feature access.",
            badge: "Billing & Access",
        },
        {
            href: "/admin/users",
            title: "Manage Users & Roles",
            description: "View users, update roles, and see who has access to what.",
            badge: "User Management",
        },
        {
            href: "/admin/library",
            title: "Manage Prompt Library",
            description: "Review and manage prompts shared by users.",
            badge: "Prompt Library",
        },
    ];

    return (
        <AdminGuard>
            <div className="min-h-screen bg-gray-50">
                <AdminNavbar />
                <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pt-28">
                    <div className="mb-10">
                        <p className="text-sm font-semibold uppercase tracking-wide text-jet-blue mb-2">
                            Admin Console
                        </p>
                        <h1 className="text-3xl md:text-4xl font-semibold text-[#335386] mb-3">
                            Welcome back, {user?.name || user?.email}
                        </h1>
                        <p className="text-gray-600 max-w-2xl">
                            Use the admin tools below to manage knowledge base ingestion, subscription
                            packages and permissions, and user access across the platform.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                        {cards.map((card) => (
                            <Link
                                key={card.href}
                                href={card.href}
                                className="group flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md cursor-pointer"
                            >
                                <div>
                                    <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-medium text-jet-blue mb-3">
                                        {card.badge}
                                    </span>
                                    <h2 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-jet-blue">
                                        {card.title}
                                    </h2>
                                    <p className="text-sm text-gray-600">
                                        {card.description}
                                    </p>
                                </div>
                                <div className="mt-4 flex items-center justify-between text-sm text-jet-blue">
                                    <span className="font-semibold">Open</span>
                                    <span className="transform transition-transform group-hover:translate-x-1">
                                        →
                                    </span>
                                </div>
                            </Link>
                        ))}
                    </div>
                </main>
            </div>
        </AdminGuard>
    );
}

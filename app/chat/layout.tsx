"use client";

import React, { useState } from 'react';
import Sidebar from '@/shared/components/Chat/Sidebar';
import { cn } from '@/shared/lib/cn';
import AuthGuard from '@/shared/components/auth/AuthGuard';
import AppointmentWidget from '@/shared/components/Homepage/AppointmentWidget';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <AuthGuard>
            <div className="flex min-h-screen w-full bg-white">
                <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

                {/* Mobile overlay when sidebar is open */}
                {isSidebarOpen && (
                    <div
                        className="fixed inset-0 z-30 bg-black/30 md:hidden"
                        onClick={() => setIsSidebarOpen(false)}
                        aria-hidden="true"
                    />
                )}

                <main
                    className={cn(
                        "flex flex-1 flex-col transition-all duration-300 ease-in-out bg-white w-full",
                        isSidebarOpen ? "md:ml-64" : "md:ml-16",
                        "ml-0"
                    )}
                >
                    {/* Header / Top Bar */}
                    <div className="sticky top-0 z-20 flex items-center justify-between bg-white px-4 py-3 border-b border-gray-100">
                        <button
                            onClick={toggleSidebar}
                            className="inline-flex items-center justify-center rounded-lg border border-gray-200 p-2 text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-jet-blue focus:ring-offset-1 md:hidden"
                            aria-label="Toggle chat sidebar"
                        >
                            <svg
                                className="h-5 w-5"
                                xmlns="http://www.w3.org/2000/svg"
                                fill="none"
                                viewBox="0 0 24 24"
                                stroke="currentColor"
                                strokeWidth={1.8}
                            >
                                {isSidebarOpen ? (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                ) : (
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
                                )}
                            </svg>
                        </button>
                        <div className="font-medium text-gray-600 text-sm md:text-base">Jet 1.0</div>
                        <div className="w-10 md:w-12" aria-hidden="true" />
                    </div>

                    <div className="flex-1 flex flex-col overflow-hidden">
                        {children}
                    </div>
                </main>
                
                {/* Hide appointment widget on small screens to keep chat focused */}
                <div className="hidden lg:block">
                    <AppointmentWidget />
                </div>
            </div>
        </AuthGuard>
    );
}

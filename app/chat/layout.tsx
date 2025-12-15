"use client";

import React, { useState } from 'react';
import Sidebar from '@/shared/components/Chat/Sidebar';
import { cn } from '@/shared/lib/cn';
import { PanelLeftClose } from '@/shared/components/icons';
import UserDropdown from '@/shared/components/Chat/UserDropdown';

export default function ChatLayout({ children }: { children: React.ReactNode }) {
    const [isSidebarOpen, setIsSidebarOpen] = useState(true);
    const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

    return (
        <div className="flex h-screen bg-white">
            <Sidebar isOpen={isSidebarOpen} toggleSidebar={toggleSidebar} />

            <main
                className={cn(
                    "flex flex-1 flex-col transition-all duration-300 ease-in-out",
                    isSidebarOpen ? "ml-64" : "ml-0"
                )}
            >
                {/* Header / Top Bar */}
                <div className="sticky top-0 z-10 flex items-center justify-between bg-white p-4">
                    {!isSidebarOpen && (
                        <button
                            onClick={toggleSidebar}
                            className="rounded-md p-2 hover:bg-gray-100"
                        >
                            <PanelLeftClose />
                        </button>
                    )}
                    <div className="flex-1 text-center font-medium text-gray-500">
                        Jet 1.0
                    </div>
                    <div className="flex items-center justify-end min-w-[40px]">
                        <UserDropdown />
                    </div>
                </div>

                {children}
            </main>
        </div>
    );
}

"use client";

import React from 'react';
import Link from 'next/link';
import { cn } from '@/shared/lib/cn';
import { PanelLeftClose, SquarePen, ChevronDown } from '@/shared/components/icons';
import { SidebarProps } from '@/shared/types/chat';

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
    // Mock chat history
    const history = [
        { id: 1, title: 'Optimize my prompt at a Basic Level', date: 'Today' },
        { id: 2, title: 'Learn FastAPI backend', date: 'Yesterday' },
        { id: 3, title: 'React component structure', date: 'Previous 7 Days' },
    ];

    return (
        <div
            className={cn(
                "fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-900 text-white transition-all duration-300 ease-in-out",
                isOpen ? "w-64" : "w-0 overflow-hidden"
            )}
        >
            <div className="flex items-center justify-between p-4">
                <button
                    onClick={toggleSidebar}
                    className="rounded-md p-2 hover:bg-gray-800 focus:outline-none"
                >
                    <PanelLeftClose />
                </button>
            </div>

            <div className="px-4 pb-4">
                <Link
                    href="/chat"
                    className="flex items-center gap-3 rounded-md border border-gray-700 bg-gray-800 px-4 py-3 text-sm font-medium hover:bg-gray-700 transition-colors"
                >
                    <SquarePen className="h-4 w-4" />
                    <span>New Chat</span>
                </Link>
            </div>

            <div className="flex-1 overflow-y-auto px-2">
                <div className="mb-2 px-2">
                    <button className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-300">
                        <span>History</span>
                        <ChevronDown className="h-3 w-3" />
                    </button>
                </div>

                <div className="mb-4">
                    <p className="px-2 py-2 text-xs font-semibold text-gray-500">Today</p>
                    {history.filter(h => h.date === 'Today').map(chat => (
                        <Link
                            key={chat.id}
                            href={`/chat/${chat.id}`}
                            className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-gray-800 truncate"
                        >
                            {chat.title}
                        </Link>
                    ))}
                </div>
                <div className="mb-4">
                    <p className="px-2 py-2 text-xs font-semibold text-gray-500">Yesterday</p>
                    {history.filter(h => h.date === 'Yesterday').map(chat => (
                        <Link
                            key={chat.id}
                            href={`/chat/${chat.id}`}
                            className="block w-full rounded-md px-2 py-2 text-left text-sm hover:bg-gray-800 truncate"
                        >
                            {chat.title}
                        </Link>
                    ))}
                </div>
            </div>

            <div className="border-t border-gray-800 p-4">
                <button className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-gray-800">
                    <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center">
                        <span className="text-xs">GL</span>
                    </div>
                    <div className="text-left">
                        <p className="text-sm font-medium">Gerald Leonard</p>
                        <p className="text-xs text-gray-400">Pro Plan</p>
                    </div>
                </button>
            </div>
        </div>
    );
}

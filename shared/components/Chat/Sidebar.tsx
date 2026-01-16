"use client";

import React, { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { cn } from '@/shared/lib/cn';
import { PanelLeftClose, SquarePen, ChevronDown } from '@/shared/components/icons';
import { LogOut } from '@/shared/components/icons/user-icons';
import { SidebarProps, Chat } from '@/shared/types/chat';
import { useAuth } from '@/shared/context/AuthContext';
import { getChatList, deleteChat } from '@/shared/api/chat';
import { groupChatsByDate } from '@/shared/utils/dateUtils';
import { logError } from '@/shared/utils/errorHandler';
import { APP_ROUTES } from '@/config/navigation';
import DeleteChatModal from '@/shared/components/Modal/DeleteChatModal';

export default function Sidebar({ isOpen, toggleSidebar }: SidebarProps) {
    const { user, logout } = useAuth();
    const pathname = usePathname();
    const router = useRouter();
    const [groupedChats, setGroupedChats] = useState<ReturnType<typeof groupChatsByDate>>({
        today: [],
        yesterday: [],
        previous7Days: [],
        older: [],
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [chatToDelete, setChatToDelete] = useState<Chat | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [hoveredChatId, setHoveredChatId] = useState<string | null>(null);
    const dropdownRef = useRef<HTMLDivElement>(null);

    const handleLogout = async () => {
        await logout();
        router.push('/login');
    };

    const fetchChats = React.useCallback(async () => {
        if (!user?.user_id) {
            setIsLoading(false);
            return;
        }

        try {
            setIsLoading(true);
            const response = await getChatList(user.user_id);
            const grouped = groupChatsByDate(response.chats);
            setGroupedChats(grouped);
        } catch (error) {
            logError(error, 'Sidebar.fetchChats');
        } finally {
            setIsLoading(false);
        }
    }, [user?.user_id]);

    useEffect(() => {
        fetchChats();
    }, [fetchChats]);

    useEffect(() => {
        if (pathname && pathname.startsWith('/chat/') && pathname !== '/chat/new' && pathname !== '/chat') {
            fetchChats();
        }
    }, [pathname, fetchChats]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsDropdownOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    const handleDeleteClick = (e: React.MouseEvent, chat: Chat) => {
        e.preventDefault();
        e.stopPropagation();
        setChatToDelete(chat);
        setShowDeleteModal(true);
    };

    const handleConfirmDelete = async () => {
        if (!user || !chatToDelete) return;

        try {
            setIsDeleting(true);
            await deleteChat(user.user_id, chatToDelete.id);
            setShowDeleteModal(false);
            setChatToDelete(null);
            
            // Refresh chat list
            await fetchChats();
            
            // If deleted chat was active, redirect to new chat
            if (pathname === `/chat/${chatToDelete.id}`) {
                router.push('/chat/new');
            }
        } catch (error: any) {
            console.error('Failed to delete chat:', error);
            alert(error.message || 'Failed to delete chat. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    const renderChatGroup = (
        chats: Chat[],
        label: string,
        showLabel: boolean = true
    ) => {
        if (chats.length === 0) return null;

        return (
            <div className="mb-4" key={label}>
                {showLabel && (
                    <p className="px-2 py-2 text-xs font-semibold text-gray-500">
                        {label}
                    </p>
                )}
                {chats.map((chat) => {
                    const isActive = pathname === `/chat/${chat.id}`;
                    const isHovered = hoveredChatId === chat.id;
                    return (
                        <div
                            key={chat.id}
                            className={cn(
                                "group flex items-center rounded-md px-2 py-2 text-left text-sm hover:bg-gray-800 transition-colors",
                                isActive && "bg-gray-800"
                            )}
                            onMouseEnter={() => setHoveredChatId(chat.id)}
                            onMouseLeave={() => setHoveredChatId(null)}
                        >
                            <Link
                                href={`/chat/${chat.id}`}
                                className="flex-1 truncate min-w-0"
                            >
                                {chat.chat_title}
                            </Link>
                            <button
                                onClick={(e) => handleDeleteClick(e, chat)}
                                className={cn(
                                    "ml-2 p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-red-400 transition-colors flex-shrink-0",
                                    isHovered || isActive ? "opacity-100" : "opacity-0"
                                )}
                                title="Delete chat"
                                aria-label="Delete chat"
                            >
                                <svg
                                    className="w-4 h-4"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                                    />
                                </svg>
                            </button>
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <>
            <DeleteChatModal
                isOpen={showDeleteModal}
                onClose={() => {
                    setShowDeleteModal(false);
                    setChatToDelete(null);
                }}
                onConfirm={handleConfirmDelete}
                isLoading={isDeleting}
            />
            <div
                className={cn(
                    "fixed inset-y-0 left-0 z-50 flex flex-col bg-gray-900 text-white transition-all duration-300 ease-in-out",
                    isOpen ? "w-64" : "w-16"
                )}
            >
            {/* Toggle button - always visible, left-aligned */}
            <div className="flex items-center p-4">
                <button
                    onClick={toggleSidebar}
                    className="rounded-md p-2 hover:bg-gray-800 focus:outline-none flex items-center justify-center"
                    title={isOpen ? "Close sidebar" : "Open sidebar"}
                >
                    <PanelLeftClose className={cn(
                        "transition-transform duration-300",
                        !isOpen && "rotate-180"
                    )} />
                </button>
            </div>

            {/* New Chat Button */}
            <div className={cn(
                "pb-2 transition-all duration-300",
                isOpen ? "px-4" : "px-2"
            )}>
                <Link
                    href="/chat"
                    className={cn(
                        "flex items-center rounded-md border border-gray-700 bg-gray-800 text-sm font-medium hover:bg-gray-700 transition-colors",
                        isOpen ? "gap-3 px-4 py-3" : "justify-center p-3"
                    )}
                    title={!isOpen ? "New Chat" : undefined}
                >
                    <SquarePen className="h-4 w-4 flex-shrink-0" />
                    {isOpen && <span>New Chat</span>}
                </Link>
            </div>

            {/* Libraries Button */}
            <div className={cn(
                "pb-4 transition-all duration-300",
                isOpen ? "px-4" : "px-2"
            )}>
                <Link
                    href="/library"
                    className={cn(
                        "flex items-center rounded-md border border-gray-700 bg-gray-800 text-sm font-medium hover:bg-gray-700 transition-colors",
                        isOpen ? "gap-3 px-4 py-3" : "justify-center p-3"
                    )}
                    title={!isOpen ? "Libraries" : undefined}
                >
                    <svg 
                        className="h-4 w-4 flex-shrink-0" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path 
                            strokeLinecap="round" 
                            strokeLinejoin="round" 
                            strokeWidth={2} 
                            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
                        />
                    </svg>
                    {isOpen && <span>Libraries</span>}
                </Link>
            </div>

            {/* Chat History - hidden when collapsed */}
            {isOpen && (
                <>
                    <div className="flex-1 overflow-y-auto px-2">
                        <div className="mb-2 px-2">
                            <button className="flex items-center gap-2 text-xs font-semibold text-gray-500 hover:text-gray-300">
                                <span>History</span>
                                <ChevronDown className="h-3 w-3" />
                            </button>
                        </div>

                        {isLoading ? (
                            <div className="px-2 py-4 text-sm text-gray-500">Loading chats...</div>
                        ) : (
                            <>
                                {renderChatGroup(groupedChats.today, 'Today')}
                                {renderChatGroup(groupedChats.yesterday, 'Yesterday')}
                                {renderChatGroup(groupedChats.previous7Days, 'Previous 7 Days')}
                                {renderChatGroup(groupedChats.older, 'Older')}
                                {groupedChats.today.length === 0 &&
                                 groupedChats.yesterday.length === 0 &&
                                 groupedChats.previous7Days.length === 0 &&
                                 groupedChats.older.length === 0 && (
                                    <div className="px-2 py-4 text-sm text-gray-500">
                                        No chat history
                                    </div>
                                )}
                            </>
                        )}
                    </div>

                    {/* User Profile - hidden when collapsed */}
                    <div className="border-t border-gray-800 p-4">
                        <div className="relative" ref={dropdownRef}>
                            <button 
                                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                                className="flex w-full items-center gap-3 rounded-md px-2 py-2 hover:bg-gray-800"
                            >
                            <div className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center flex-shrink-0">
                                <span className="text-xs">
                                    {user?.name
                                        ? user.name
                                            .split(' ')
                                            .map(n => n[0])
                                            .join('')
                                            .toUpperCase()
                                            .slice(0, 2)
                                        : user?.email?.[0]?.toUpperCase() || 'U'}
                                </span>
                            </div>
                            <div className="text-left min-w-0 flex-1">
                                <p className="text-sm font-medium truncate">
                                    {user?.name || user?.email || 'User'}
                                </p>
                                <p className="text-xs text-gray-400 capitalize">
                                    {user?.package_name || 'Free'} Plan
                                </p>
                            </div>
                                <ChevronDown className={cn(
                                    "h-4 w-4 text-gray-400 transition-transform",
                                    isDropdownOpen && "rotate-180"
                                )} />
                            </button>

                            {isDropdownOpen && (
                                <div className="absolute bottom-full left-0 mb-2 w-full rounded-md bg-gray-800 border border-gray-700 shadow-lg z-50 overflow-hidden">
                                    <div className="px-4 py-4 border-b border-gray-700">
                                        <p className="text-sm font-medium text-white truncate mb-1">
                                            {user?.name || user?.email || 'User'}
                                        </p>
                                        <p className="text-xs text-gray-400 truncate mb-2">
                                            {user?.email}
                                        </p>
                                        <p className="text-xs text-gray-400 capitalize">
                                            {user?.package_name || 'Free'} Plan
                                        </p>
                                    </div>
                                    
                                    <div className="py-1">
                                        <Link
                                            href={APP_ROUTES.home}
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                                        >
                                            <span>Home</span>
                                        </Link>

                                        <Link
                                            href={APP_ROUTES.pricing}
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                                        >
                                            <span>Pricing</span>
                                        </Link>

                                        {user?.role === 'admin' && (
                                            <Link
                                                href="/admin"
                                                onClick={() => setIsDropdownOpen(false)}
                                                className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                                            >
                                                <span>Admin Panel</span>
                                            </Link>
                                        )}

                                        <button
                                            onClick={handleLogout}
                                            className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                                        >
                                            <LogOut className="h-4 w-4" />
                                            <span>Sign out</span>
                        </button>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </>
            )}
            
            {/* Collapsed state - show minimal user info */}
            {!isOpen && (
                <div className="flex-1 flex flex-col items-center justify-end pb-4">
                    <div className="relative" ref={dropdownRef}>
                    <button 
                            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                        className="h-8 w-8 rounded-full bg-gray-700 flex items-center justify-center hover:bg-gray-600 transition-colors"
                        title={user?.name || user?.email || 'User Profile'}
                    >
                        <span className="text-xs">
                            {user?.name
                                ? user.name
                                    .split(' ')
                                    .map(n => n[0])
                                    .join('')
                                    .toUpperCase()
                                    .slice(0, 2)
                                : user?.email?.[0]?.toUpperCase() || 'U'}
                        </span>
                    </button>

                        {isDropdownOpen && (
                            <div className="absolute bottom-full left-0 mb-2 w-56 rounded-md bg-gray-800 border border-gray-700 shadow-lg z-50 overflow-hidden">
                                <div className="px-4 py-4 border-b border-gray-700">
                                    <p className="text-sm font-medium text-white truncate mb-1">
                                        {user?.name || user?.email || 'User'}
                                    </p>
                                    <p className="text-xs text-gray-400 truncate mb-2">
                                        {user?.email}
                                    </p>
                                    <p className="text-xs text-gray-400 capitalize">
                                        {user?.package_name || 'Free'} Plan
                                    </p>
                                </div>
                                
                                <div className="py-1">
                                    <Link
                                        href={APP_ROUTES.home}
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                                    >
                                        <span>Home</span>
                                    </Link>

                                    <Link
                                        href={APP_ROUTES.pricing}
                                        onClick={() => setIsDropdownOpen(false)}
                                        className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                                    >
                                        <span>Pricing</span>
                                    </Link>

                                    {user?.role === 'admin' && (
                                        <Link
                                            href="/admin"
                                            onClick={() => setIsDropdownOpen(false)}
                                            className="flex items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                                        >
                                            <span>Admin Panel</span>
                                        </Link>
                                    )}

                                    <button
                                        onClick={handleLogout}
                                        className="flex w-full items-center gap-3 px-4 py-3 text-sm text-gray-300 hover:bg-gray-700 transition-colors"
                                    >
                                        <LogOut className="h-4 w-4" />
                                        <span>Sign out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
        </>
    );
}

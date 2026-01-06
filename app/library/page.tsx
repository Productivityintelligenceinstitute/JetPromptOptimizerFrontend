"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { getLibraryPrompts, SharedPrompt } from '@/shared/api/library';
import AuthGuard from '@/shared/components/auth/AuthGuard';
import Pagination from '@/shared/components/admin/Pagination';
import { useRouter } from 'next/navigation';
import { formatAssistantMessage } from '@/shared/utils/messageFormatter';

export default function LibraryPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [prompts, setPrompts] = useState<SharedPrompt[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [copiedPromptId, setCopiedPromptId] = useState<number | null>(null);

    useEffect(() => {
        if (user) {
            fetchPrompts();
        }
    }, [user]);

    const fetchPrompts = async () => {
        if (!user) return;

        try {
            setIsLoading(true);
            setError(null);
            const data = await getLibraryPrompts(user.user_id);
            setPrompts(data);
        } catch (err: any) {
            setError(err.message || 'Failed to load prompts from library');
        } finally {
            setIsLoading(false);
        }
    };

    const handleCopy = async (content: string, index: number) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedPromptId(index);
            setTimeout(() => {
                setCopiedPromptId(null);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    const paginatedPrompts = prompts.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    return (
        <AuthGuard>
            <div className="min-h-screen bg-gray-50">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 pt-24">
                    <div className="mb-8">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h1 className="text-3xl font-semibold text-[#335386] mb-2">
                                    Prompt Library
                                </h1>
                                <p className="text-gray-600">
                                    Discover and use prompts shared by the community
                                </p>
                            </div>
                            <button
                                onClick={() => router.push('/chat')}
                                className="px-4 py-2 bg-jet-blue text-white rounded-lg hover:bg-jet-blue/90 transition-colors cursor-pointer"
                            >
                                Create New Prompt
                            </button>
                        </div>
                    </div>

                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {isLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="text-center">
                                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-jet-blue border-r-transparent"></div>
                                <p className="mt-4 text-sm text-gray-600">Loading prompts...</p>
                            </div>
                        </div>
                    ) : prompts.length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                            <p className="text-gray-600 mb-2">No prompts in the library yet</p>
                            <p className="text-sm text-gray-500">Be the first to share a prompt!</p>
                        </div>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-6 mb-6">
                                {paginatedPrompts.map((prompt, index) => {
                                    const globalIndex = (currentPage - 1) * itemsPerPage + index;
                                    const formattedContent = formatAssistantMessage(prompt.content);
                                    return (
                                        <div
                                            key={globalIndex}
                                            className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <div className="h-8 w-8 rounded-full bg-jet-blue/10 flex items-center justify-center">
                                                            <span className="text-jet-blue text-xs font-semibold">
                                                                {prompt.email.charAt(0).toUpperCase()}
                                                            </span>
                                                        </div>
                                                        <span className="text-sm text-gray-600">
                                                            {prompt.email}
                                                        </span>
                                                        {prompt.created_at && (
                                                            <span className="text-xs text-gray-400">
                                                                • {new Date(prompt.created_at).toLocaleDateString()}
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <button
                                                    onClick={() => handleCopy(prompt.content, globalIndex)}
                                                    className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                                                    title="Copy prompt"
                                                >
                                                    {copiedPromptId === globalIndex ? (
                                                        <svg
                                                            className="w-5 h-5 text-green-600"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M5 13l4 4L19 7"
                                                            />
                                                        </svg>
                                                    ) : (
                                                        <svg
                                                            className="w-5 h-5"
                                                            fill="none"
                                                            stroke="currentColor"
                                                            viewBox="0 0 24 24"
                                                        >
                                                            <path
                                                                strokeLinecap="round"
                                                                strokeLinejoin="round"
                                                                strokeWidth={2}
                                                                d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                                                            />
                                                        </svg>
                                                    )}
                                                </button>
                                            </div>
                                            <div className="prose prose-sm max-w-none">
                                                {formattedContent.split('\n').map((line, i) => {
                                                    const trimmed = line.trim();
                                                    if (!trimmed) {
                                                        return null;
                                                    }

                                                    // List items that start with ✓
                                                    if (trimmed.startsWith('✓')) {
                                                        return (
                                                            <div key={i} className="mb-1.5 flex items-start gap-2">
                                                                <span className="text-green-600 mt-0.5">✓</span>
                                                                <span className="text-gray-700">
                                                                    {trimmed.substring(1).trim()}
                                                                </span>
                                                            </div>
                                                        );
                                                    }

                                                    // Section headers wrapped in ** **
                                                    if (trimmed.startsWith('**') && trimmed.endsWith('**')) {
                                                        const headerText = trimmed.slice(2, -2);
                                                        return (
                                                            <h3
                                                                key={i}
                                                                className="mt-4 mb-2 text-base font-semibold text-gray-900 first:mt-0"
                                                            >
                                                                {headerText}
                                                            </h3>
                                                        );
                                                    }

                                                    // Regular paragraph with inline bold
                                                    const parts = line.split(/(\*\*.*?\*\*)/g);
                                                    return (
                                                        <p key={i} className="mb-2 text-gray-700 last:mb-0">
                                                            {parts.map((part, j) => {
                                                                if (part.startsWith('**') && part.endsWith('**')) {
                                                                    return (
                                                                        <strong
                                                                            key={j}
                                                                            className="font-semibold text-gray-900"
                                                                        >
                                                                            {part.slice(2, -2)}
                                                                        </strong>
                                                                    );
                                                                }
                                                                return <span key={j}>{part}</span>;
                                                            })}
                                                        </p>
                                                    );
                                                })}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <Pagination
                                totalItems={prompts.length}
                                itemsPerPage={itemsPerPage}
                                currentPage={currentPage}
                                onPageChange={handlePageChange}
                                onItemsPerPageChange={handleItemsPerPageChange}
                                showItemsPerPage={true}
                            />
                        </>
                    )}
                </div>
            </div>
        </AuthGuard>
    );
}


"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/shared/context/AuthContext";
import { getLibraryPrompts, SharedPrompt, removeFromLibrary } from "@/shared/api/library";
import AdminGuard from "@/shared/components/auth/AdminGuard";
import { AdminNavbar } from "@/shared/components/navbar/AdminNavbar";
import Pagination from "@/shared/components/admin/Pagination";
import { useRouter, useSearchParams } from "next/navigation";
import { formatAssistantMessage } from "@/shared/utils/messageFormatter";

export default function AdminLibraryPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [prompts, setPrompts] = useState<SharedPrompt[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const initialPage = Number(searchParams.get("page") || "1") || 1;
  const initialSize = Number(searchParams.get("size") || "10") || 10;
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialSize);
  const [copiedPromptId, setCopiedPromptId] = useState<number | null>(null);
  const [totalItems, setTotalItems] = useState(0);
  const initialSearch = searchParams.get("q") || "";
  const [search, setSearch] = useState(initialSearch);
  const [searchInput, setSearchInput] = useState(initialSearch);

  useEffect(() => {
    if (user) {
      fetchPrompts(currentPage, itemsPerPage, search);
    }
  }, [user, currentPage, itemsPerPage, search]);

  const fetchPrompts = async (page: number, size: number, query: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      setError(null);
      const data = await getLibraryPrompts(user.user_id, page, size, query);
      setPrompts(data.items);
      setTotalItems(data.total);
    } catch (err: any) {
      setError(err.message || "Failed to load prompts from library");
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
      console.error("Failed to copy text:", err);
    }
  };

  const handleDelete = async (messageId: string) => {
    if (!window.confirm("Are you sure you want to remove this prompt from the library?")) {
      return;
    }
    try {
      await removeFromLibrary(user!.user_id, messageId);
      await fetchPrompts(currentPage, itemsPerPage, search);
    } catch (err: any) {
      alert(err.message || "Failed to remove prompt from library.");
    }
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", String(page));
    params.set("size", String(itemsPerPage));
    if (search) params.set("q", search);
    else params.delete("q");
    router.push(`/admin/library?${params.toString()}`);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1);
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", "1");
    params.set("size", String(newItemsPerPage));
    if (search) params.set("q", search);
    else params.delete("q");
    router.push(`/admin/library?${params.toString()}`);
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
    router.push(`/admin/library?${params.toString()}`);
  };

  return (
    <AdminGuard>
      <div className="min-h-screen bg-gray-50">
        <AdminNavbar />
        <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pt-28">
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h1 className="text-3xl font-semibold text-[#335386] mb-2">
                  Admin - Prompt Library
                </h1>
                <p className="text-gray-600">
                  Review and manage prompts shared by users.
                </p>
              </div>
              <form onSubmit={handleSearchSubmit} className="flex items-center gap-2">
                <input
                  type="text"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  placeholder="Search prompts..."
                  className="w-56 rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-900 focus:outline-none focus:ring-1 focus:ring-jet-blue focus:border-jet-blue"
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

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-jet-blue border-r-transparent" />
                <p className="mt-4 text-sm text-gray-600">Loading prompts...</p>
              </div>
            </div>
          ) : prompts.length === 0 ? (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-600 mb-2">No prompts in the library yet</p>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 gap-6 mb-6">
                {prompts.map((prompt, index) => {
                  const formattedContent = formatAssistantMessage(prompt.content);
                  return (
                    <div
                      key={`${prompt.message_id}-${index}`}
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
                            <span className="text-sm text-gray-600">{prompt.email}</span>
                            {prompt.created_at && (
                              <span className="text-xs text-gray-400">
                                • {new Date(prompt.created_at).toLocaleDateString()}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => handleCopy(prompt.content, index)}
                            className="p-2 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                            title="Copy prompt"
                          >
                            {copiedPromptId === index ? (
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
                          <button
                            onClick={() => handleDelete(prompt.message_id)}
                            className="p-2 rounded-md hover:bg-red-50 text-red-500 hover:text-red-700 transition-colors text-sm"
                            title="Remove from library"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                      <div className="prose prose-sm max-w-none">
                        {formattedContent.split("\n").map((line, i) => {
                          const trimmed = line.trim();
                          if (!trimmed) return null;

                          if (trimmed.startsWith("✓")) {
                            return (
                              <div key={i} className="mb-1.5 flex items-start gap-2">
                                <span className="text-green-600 mt-0.5">✓</span>
                                <span className="text-gray-700">
                                  {trimmed.substring(1).trim()}
                                </span>
                              </div>
                            );
                          }

                          if (trimmed.startsWith("**") && trimmed.endsWith("**")) {
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

                          const parts = line.split(/(\*\*.*?\*\*)/g);
                          return (
                            <p key={i} className="mb-2 text-gray-700 last:mb-0">
                              {parts.map((part, j) => {
                                if (part.startsWith("**") && part.endsWith("**")) {
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
                totalItems={totalItems}
                itemsPerPage={itemsPerPage}
                currentPage={currentPage}
                onPageChange={handlePageChange}
                onItemsPerPageChange={handleItemsPerPageChange}
                showItemsPerPage={true}
              />
            </>
          )}
        </main>
      </div>
    </AdminGuard>
  );
}



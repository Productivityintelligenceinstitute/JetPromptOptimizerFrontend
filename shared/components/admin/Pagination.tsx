"use client";

import { useState } from "react";

interface PaginationProps {
    totalItems: number;
    itemsPerPage: number;
    currentPage: number;
    onPageChange: (page: number) => void;
    onItemsPerPageChange?: (itemsPerPage: number) => void;
    showItemsPerPage?: boolean;
}

const ITEMS_PER_PAGE_OPTIONS = [10, 25, 50, 100];

export default function Pagination({
    totalItems,
    itemsPerPage,
    currentPage,
    onPageChange,
    onItemsPerPageChange,
    showItemsPerPage = true,
}: PaginationProps) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startItem = totalItems === 0 ? 0 : (currentPage - 1) * itemsPerPage + 1;
    const endItem = Math.min(currentPage * itemsPerPage, totalItems);

    const handlePrevious = () => {
        if (currentPage > 1) {
            onPageChange(currentPage - 1);
        }
    };

    const handleNext = () => {
        if (currentPage < totalPages) {
            onPageChange(currentPage + 1);
        }
    };

    const getPageNumbers = () => {
        const pages: (number | string)[] = [];
        const maxVisible = 5;

        if (totalPages <= maxVisible) {
            for (let i = 1; i <= totalPages; i++) {
                pages.push(i);
            }
        } else {
            if (currentPage <= 3) {
                for (let i = 1; i <= 4; i++) {
                    pages.push(i);
                }
                pages.push("ellipsis");
                pages.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                pages.push(1);
                pages.push("ellipsis");
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    pages.push(i);
                }
            } else {
                pages.push(1);
                pages.push("ellipsis");
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                    pages.push(i);
                }
                pages.push("ellipsis");
                pages.push(totalPages);
            }
        }

        return pages;
    };

    if (totalItems === 0) {
        return null;
    }

    return (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between border-t border-gray-200 pt-4 mt-4">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
                <p className="text-sm text-gray-700">
                    Showing <span className="font-medium">{startItem}</span> to{" "}
                    <span className="font-medium">{endItem}</span> of{" "}
                    <span className="font-medium">{totalItems}</span> results
                </p>

                {showItemsPerPage && onItemsPerPageChange && (
                    <div className="flex items-center gap-2">
                        <label htmlFor="itemsPerPage" className="text-sm text-gray-700">
                            Show:
                        </label>
                        <select
                            id="itemsPerPage"
                            value={itemsPerPage}
                            onChange={(e) => onItemsPerPageChange(Number(e.target.value))}
                            className="rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-900 focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue"
                        >
                            {ITEMS_PER_PAGE_OPTIONS.map((option) => (
                                <option key={option} value={option}>
                                    {option}
                                </option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            <div className="flex items-center gap-2">
                <button
                    onClick={handlePrevious}
                    disabled={currentPage === 1}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                    Previous
                </button>

                <div className="hidden sm:flex items-center gap-1">
                    {getPageNumbers().map((page, index) => {
                        if (page === "ellipsis") {
                            return (
                                <span
                                    key={`ellipsis-${index}`}
                                    className="px-2 py-1 text-sm text-gray-500"
                                >
                                    ...
                                </span>
                            );
                        }

                        const pageNum = page as number;
                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`rounded-lg px-3 py-2 text-sm font-medium transition-colors cursor-pointer ${
                                    currentPage === pageNum
                                        ? "bg-jet-blue text-white"
                                        : "border border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>

                <div className="sm:hidden text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                </div>

                <button
                    onClick={handleNext}
                    disabled={currentPage === totalPages}
                    className="rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                >
                    Next
                </button>
            </div>
        </div>
    );
}


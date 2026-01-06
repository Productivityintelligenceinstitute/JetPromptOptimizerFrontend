"use client";

import { useMemo, useRef, useState, useCallback } from "react";
import AdminGuard from "@/shared/components/auth/AdminGuard";
import { AdminNavbar } from "@/shared/components/navbar/AdminNavbar";
import Pagination from "@/shared/components/admin/Pagination";
import { ingestFile, IngestFileResponse } from "@/shared/api/kbIngestion";

interface IngestionJob {
    id: string;
    fileName: string;
    fileSize: number;
    chunks: number;
    vectors: number;
    status: string;
    ingestedAt: string;
}

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_FILE_TYPES = [".pdf", ".txt", ".md", ".doc", ".docx"];

export default function AdminKbPage() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const dropZoneRef = useRef<HTMLDivElement | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<IngestFileResponse | null>(null);
    const [ingestions, setIngestions] = useState<IngestionJob[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [isDragging, setIsDragging] = useState(false);

    const paginatedIngestions = useMemo(() => {
        const startIndex = (currentPage - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        return ingestions.slice(startIndex, endIndex);
    }, [ingestions, currentPage, itemsPerPage]);

    const handlePageChange = (page: number) => {
        setCurrentPage(page);
    };

    const handleItemsPerPageChange = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    const validateFile = (file: File): string | null => {
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
        
        if (!ACCEPTED_FILE_TYPES.includes(fileExtension)) {
            return `File type ${fileExtension} is not supported. Please upload PDF, DOCX, Markdown, or plain text files.`;
        }
        
        if (file.size > MAX_FILE_SIZE) {
            return `File size (${(file.size / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum limit of 20 MB.`;
        }
        
        return null;
    };

    const processFile = useCallback(async (file: File) => {
        const validationError = validateFile(file);
        if (validationError) {
            setUploadError(validationError);
            return;
        }

        try {
            setIsUploading(true);
            setUploadError(null);

            const data = await ingestFile(file);
            setLastResult(data);

            const job: IngestionJob = {
                id: crypto.randomUUID(),
                fileName: data.file,
                fileSize: file.size,
                chunks: data.chunks,
                vectors: data.vectors,
                status: data.status,
                ingestedAt: new Date().toISOString(),
            };

            setIngestions((prev) => [job, ...prev]);
        } catch (error: any) {
            setUploadError(error?.message || "Failed to ingest file. Please try again.");
        } finally {
            setIsUploading(false);
        }
    }, []);

    const handleChooseFilesClick = () => {
        if (fileInputRef.current && !isUploading) {
            fileInputRef.current.click();
        }
    };

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) {
            return;
        }

        await processFile(file);
        
        // Reset input so same file can be selected again
        if (event.target) {
            event.target.value = "";
        }
    };

    const handleDragEnter = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!isUploading) {
            setIsDragging(true);
        }
    };

    const handleDragLeave = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
    };

    const handleDrop = async (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragging(false);

        if (isUploading) {
            return;
        }

        const file = e.dataTransfer.files?.[0];
        if (file) {
            await processFile(file);
        }
    };
    return (
        <AdminGuard>
            <div className="min-h-screen bg-gray-50">
                <AdminNavbar />
                <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 pt-28">
                    <div className="mb-8">
                        <h1 className="text-3xl font-semibold text-[#335386] mb-2">
                            Knowledge Base Ingestion
                        </h1>
                        <p className="text-gray-600 max-w-2xl">
                            Upload and manage knowledge sources that Jet can use for reasoning and
                            prompt optimization. This is where you connect documentation, FAQs, and
                            internal playbooks.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
                        <section className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Ingest new knowledge
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Drag and drop files or connect a source. Supported formats include PDF,
                                DOCX, Markdown, and plain text.
                            </p>

                            <div className="mt-4">
                                <div
                                    ref={dropZoneRef}
                                    className={`flex flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-10 text-center cursor-pointer transition-colors ${
                                        isDragging
                                            ? "border-jet-blue bg-blue-50"
                                            : isUploading
                                            ? "border-gray-300 bg-gray-100 cursor-not-allowed"
                                            : "border-gray-300 bg-gray-50 hover:bg-gray-100"
                                    }`}
                                    onClick={handleChooseFilesClick}
                                    onDragEnter={handleDragEnter}
                                    onDragOver={handleDragOver}
                                    onDragLeave={handleDragLeave}
                                    onDrop={handleDrop}
                                    onKeyDown={(e) => {
                                        if ((e.key === "Enter" || e.key === " ") && !isUploading) {
                                            e.preventDefault();
                                            handleChooseFilesClick();
                                        }
                                    }}
                                    role="button"
                                    tabIndex={0}
                                    aria-disabled={isUploading}
                                >
                                    {isUploading ? (
                                        <>
                                            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-jet-blue border-r-transparent mb-3" />
                                            <p className="text-sm font-medium text-gray-800 mb-2">
                                                Uploading and processing file...
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                Please wait while we ingest your document
                                            </p>
                                        </>
                                    ) : (
                                        <>
                                            <p className="text-sm font-medium text-gray-800 mb-2">
                                                Drop files here or click to browse
                                            </p>
                                            <p className="text-xs text-gray-500 mb-4">
                                                PDFs, DOCX, MD, TXT up to 20MB each
                                            </p>
                                            <button
                                                type="button"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleChooseFilesClick();
                                                }}
                                                className="rounded-lg bg-jet-blue px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-jet-blue/90 cursor-pointer"
                                                disabled={isUploading}
                                            >
                                                Choose file
                                            </button>
                                        </>
                                    )}
                                    <input
                                        ref={fileInputRef}
                                        type="file"
                                        className="hidden"
                                        onChange={handleFileChange}
                                        accept=".pdf,.txt,.md,.doc,.docx"
                                        multiple={false}
                                        disabled={isUploading}
                                    />
                                </div>

                                {uploadError && (
                                    <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                                        {uploadError}
                                    </div>
                                )}

                                {!uploadError && lastResult && (
                                    <div className="mt-4 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
                                        File <span className="font-semibold">{lastResult.file}</span> ingested successfully with{" "}
                                        <span className="font-semibold">{lastResult.chunks}</span> chunks and{" "}
                                        <span className="font-semibold">{lastResult.vectors}</span> vectors.
                                    </div>
                                )}
                            </div>

                            <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                        Chunking & Embeddings
                                    </h3>
                                    <p className="text-xs text-gray-600">
                                        Documents are automatically chunked and embedded for fast
                                        retrieval in optimization workflows.
                                    </p>
                                </div>
                                <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
                                    <h3 className="text-sm font-semibold text-gray-900 mb-1">
                                        Access Control
                                    </h3>
                                    <p className="text-xs text-gray-600">
                                        Future versions will let you scope datasets to specific
                                        packages, teams, or customers.
                                    </p>
                                </div>
                            </div>
                        </section>

                        <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Ingestion status
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                                Simple status of the current upload. Backend does not expose a history API, so we only show the latest result.
                            </p>

                            <div className="space-y-3">
                                {isUploading && (
                                    <div className="flex items-center justify-between rounded-xl border border-blue-100 bg-blue-50 px-4 py-3">
                                        <div>
                                            <p className="text-sm font-medium text-gray-900">
                                                Ingesting file...
                                            </p>
                                            <p className="text-xs text-gray-600">
                                                Please wait while we process and ingest your document.
                                            </p>
                                        </div>
                                        <div className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-solid border-jet-blue border-r-transparent" />
                                    </div>
                                )}

                                {!isUploading && lastResult && (
                                    <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3">
                                        <p className="text-sm font-medium text-green-900 mb-1">
                                            Ingestion completed
                                        </p>
                                        <p className="text-xs text-green-800">
                                            File <span className="font-semibold">{lastResult.file}</span> ingested successfully.
                                        </p>
                                    </div>
                                )}

                                {!isUploading && !lastResult && (
                                    <div className="rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-6 text-center">
                                        <p className="text-sm font-medium text-gray-800 mb-1">
                                            No ingestion yet
                                        </p>
                                        <p className="text-xs text-gray-600">
                                            Upload a document on the left to see the latest ingestion result here.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </section>
                    </div>

                    <section className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Ingestion history (this session)
                                </h2>
                                <p className="text-sm text-gray-600">
                                    Recent files ingested through the admin console. This reflects calls to the{" "}
                                    <span className="font-mono text-xs text-gray-800">POST /ingest-file</span> API in this browser session.
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button className="hidden sm:inline-flex rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                                    Filter
                                </button>
                                <button className="hidden sm:inline-flex rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-semibold text-gray-700 hover:bg-gray-50 cursor-pointer">
                                    Export
                                </button>
                            </div>
                        </div>

                        {ingestions.length === 0 ? (
                            <div className="mt-4 rounded-xl border border-dashed border-gray-200 bg-gray-50 px-4 py-8 text-center text-sm text-gray-600">
                                No ingestions have been run in this session yet.
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="px-4 py-2 text-left font-medium text-gray-600">
                                                    File
                                                </th>
                                                <th className="px-4 py-2 text-left font-medium text-gray-600">
                                                    Size
                                                </th>
                                                <th className="px-4 py-2 text-left font-medium text-gray-600">
                                                    Chunks
                                                </th>
                                                <th className="px-4 py-2 text-left font-medium text-gray-600">
                                                    Vectors
                                                </th>
                                                <th className="px-4 py-2 text-left font-medium text-gray-600">
                                                    Status
                                                </th>
                                                <th className="px-4 py-2 text-left font-medium text-gray-600">
                                                    Ingested at
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-100">
                                            {paginatedIngestions.map((job) => (
                                                <tr key={job.id} className="hover:bg-gray-50">
                                                    <td className="px-4 py-2 text-gray-900 font-medium">
                                                        {job.fileName}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-600">
                                                        {(job.fileSize / (1024 * 1024)).toFixed(2)} MB
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-600">
                                                        {job.chunks}
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-600">
                                                        {job.vectors}
                                                    </td>
                                                    <td className="px-4 py-2">
                                                        <span className="inline-flex rounded-full bg-green-50 px-2.5 py-1 text-xs font-medium text-green-700">
                                                            {job.status}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-2 text-gray-600">
                                                        {new Date(job.ingestedAt).toLocaleString()}
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                <Pagination
                                    totalItems={ingestions.length}
                                    itemsPerPage={itemsPerPage}
                                    currentPage={currentPage}
                                    onPageChange={handlePageChange}
                                    onItemsPerPageChange={handleItemsPerPageChange}
                                    showItemsPerPage={true}
                                />
                            </>
                        )}
                    </section>
                </main>
            </div>
        </AdminGuard>
    );
}



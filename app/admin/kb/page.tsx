"use client";

import { useRef, useState, useCallback } from "react";
import AdminGuard from "@/shared/components/auth/AdminGuard";
import { AdminNavbar } from "@/shared/components/navbar/AdminNavbar";
import { ingestFile, IngestFileResponse } from "@/shared/api/kbIngestion";

const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB
const ACCEPTED_FILE_TYPES = [".txt", ".md", ".json", ".docx", ".pdf"];

export default function AdminKbPage() {
    const fileInputRef = useRef<HTMLInputElement | null>(null);
    const dropZoneRef = useRef<HTMLDivElement | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);
    const [lastResult, setLastResult] = useState<IngestFileResponse | null>(null);
    const [isDragging, setIsDragging] = useState(false);

    const validateFile = (file: File): string | null => {
        const fileExtension = "." + file.name.split(".").pop()?.toLowerCase();
        
        if (!ACCEPTED_FILE_TYPES.includes(fileExtension)) {
            return `File type ${fileExtension} is not supported. Please upload .txt, .md, .json, .docx, or .pdf files only.`;
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
            setLastResult(null); // Clear previous result

            const data = await ingestFile(file);
            setLastResult(data);
        } catch (error: any) {
            setUploadError(error?.message || "Failed to ingest file. Please try again.");
            setLastResult(null); // Clear previous result on error
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

                    <section className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Ingest new knowledge
                            </h2>
                            <p className="text-sm text-gray-600 mb-4">
                            Drag and drop files or connect a source. Supported formats: TXT, MD, JSON, DOCX, and PDF.
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
                                                TXT, MD, JSON, DOCX, PDF up to 20MB each
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
                                        accept=".txt,.md,.json,.docx,.pdf"
                                        multiple={false}
                                        disabled={isUploading}
                                    />
                                </div>

                                {uploadError && (
                                    <div className="mt-4 rounded-lg border-2 border-red-300 bg-red-50 px-4 py-4 text-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-red-900 mb-1">
                                                    Upload failed
                                                </p>
                                                <p className="text-red-800">
                                        {uploadError}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {!uploadError && lastResult && (
                                    <div className="mt-4 rounded-lg border-2 border-green-300 bg-green-50 px-4 py-4 text-sm">
                                        <div className="flex items-start gap-3">
                                            <div className="flex-shrink-0">
                                                <svg className="h-5 w-5 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <div className="flex-1">
                                                <p className="font-semibold text-green-900 mb-1">
                                                    File ingested successfully!
                                                </p>
                                                <p className="text-green-800">
                                                    <span className="font-semibold">{lastResult.file}</span> has been processed and ingested into the knowledge base with{" "}
                                        <span className="font-semibold">{lastResult.chunks}</span> chunks and{" "}
                                        <span className="font-semibold">{lastResult.vectors}</span> vectors.
                                                </p>
                                            </div>
                                        </div>
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
                </main>
            </div>
        </AdminGuard>
    );
}



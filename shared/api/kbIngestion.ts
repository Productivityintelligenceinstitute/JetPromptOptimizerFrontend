import apiClient from "./client";
import { normalizeError, logError } from "@/shared/utils/errorHandler";

export interface IngestFileResponse {
    file: string;
    chunks: number;
    vectors: number;
    status: string;
}

/**
 * Upload and ingest a file into the knowledge base
 * @param file - The file to upload (PDF, DOCX, Markdown, or plain text)
 * @returns Response containing file name, chunks count, vectors count, and status
 */
export const ingestFile = async (file: File): Promise<IngestFileResponse> => {
    try {
        const formData = new FormData();
        formData.append("file", file);

        const response = await apiClient.post<IngestFileResponse>(
            "/ingest-file",
            formData,
            {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                timeout: 120000, // 2 minutes timeout for large files
            }
        );

        return response.data;
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "ingestFile");
        
        // Extract user-friendly error message
        let errorMessage = "Failed to ingest file. Please try again.";
        if (normalizedError.response?.data?.detail) {
            errorMessage = normalizedError.response.data.detail;
        } else if (normalizedError.message) {
            errorMessage = normalizedError.message;
        }
        
        throw new Error(errorMessage);
    }
};


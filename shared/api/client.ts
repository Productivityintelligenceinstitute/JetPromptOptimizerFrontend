import axios, { AxiosError, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import Cookies from "js-cookie";
import { auth } from "@/shared/lib/firebase";
import { AUTH_COOKIE_NAME } from "@/shared/constants/auth";
import { normalizeError } from "@/shared/utils/errorHandler";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

if (!API_BASE_URL) {
    console.warn('NEXT_PUBLIC_API_URL is not defined');
}

const apiClient = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        "Content-Type": "application/json",
    },
    timeout: 30000, // 30 seconds timeout
});

const getBearerToken = async (): Promise<string | null> => {
    const firebaseUser = auth.currentUser;
    if (firebaseUser) {
        try {
            return await firebaseUser.getIdToken();
        } catch (error) {
            console.warn("Failed to read Firebase auth token, falling back to cached token if available:", error);
        }
    }

    const cachedToken = Cookies.get(AUTH_COOKIE_NAME);
    return cachedToken || null;
};

/**
 * Request interceptor to attach authentication token
 */
apiClient.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        const token = await getBearerToken();
        if (token && config.headers) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        
        // If data is FormData, remove Content-Type to let browser set it with boundary
        if (config.data instanceof FormData && config.headers) {
            delete config.headers["Content-Type"];
        }
        
        return config;
    },
    (error: AxiosError) => {
        return Promise.reject(error);
    }
);

/**
 * Response interceptor for centralized error handling
 */
apiClient.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
        // Normalize error before rejecting
        const normalizedError = normalizeError(error);
        return Promise.reject(normalizedError);
    }
);

export default apiClient;

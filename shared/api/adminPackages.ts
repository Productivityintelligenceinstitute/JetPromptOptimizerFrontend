import apiClient from "./client";
import { normalizeError, logError } from "@/shared/utils/errorHandler";

export interface Package {
    package_id: number;
    package_name: string;
    is_custom: boolean;
    created_at?: string;
}

export interface Permission {
    permission_id: number;
    permission_name: string;
    created_at?: string;
}

export interface PackagePermission {
    id?: number;
    package_id: number;
    permission_id: number;
    is_enabled: boolean;
    query_limit: number | null;
}

export interface CreatePackageRequest {
    package_name: string;
    is_custom: boolean;
}

export interface AssignPermissionRequest {
    package_name: string;
    permission_name: string;
    query_limit?: number | null;
    is_enabled?: boolean;
}

/**
 * Get all packages
 */
export const getPackages = async (): Promise<Package[]> => {
    try {
        const response = await apiClient.get<{ packages: Package[] }>("/packages");
        return response.data.packages;
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "getPackages");
        throw new Error("Failed to fetch packages. Please try again.");
    }
};

/**
 * Create a new package
 */
export const createPackage = async (data: CreatePackageRequest): Promise<Package> => {
    try {
        const response = await apiClient.post<Package>("/packages/add", data);
        
        // If backend returns the package directly, use it
        if (response.data && 'package_id' in response.data) {
            return response.data;
        }
        
        // Otherwise, refetch to get the created package
        await new Promise(resolve => setTimeout(resolve, 100));
        const packages = await getPackages();
        const newPackage = packages.find(p => p.package_name === data.package_name);
        
        if (newPackage) {
            return newPackage;
        }
        
        throw new Error("Package created but could not be retrieved");
    } catch (error: any) {
        const normalizedError = normalizeError(error);
        
        if (error.message === "Package created but could not be retrieved") {
            throw error;
        }
        
        logError(normalizedError, "createPackage");
        
        if (normalizedError.response?.data?.status === "Package already exists") {
            throw new Error("A package with this name already exists.");
        }
        
        throw new Error("Failed to create package. Please try again.");
    }
};

/**
 * Delete a package
 */
export const deletePackage = async (packageId: number): Promise<void> => {
    try {
        await apiClient.delete<{ status: string }>(`/packages/${packageId}`);
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "deletePackage");
        
        if (normalizedError.response?.data?.status === "Package not found") {
            throw new Error("Package not found.");
        }
        
        throw new Error("Failed to delete package. Please try again.");
    }
};

/**
 * Get all permissions
 */
export const getPermissions = async (): Promise<Permission[]> => {
    try {
        const response = await apiClient.get<Permission[]>("/permissions");
        return response.data;
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "getPermissions");
        throw new Error("Failed to fetch permissions. Please try again.");
    }
};

/**
 * Get all package permissions
 */
export const getPackagePermissions = async (): Promise<Array<{
    package_name: string;
    permission_name: string;
    query_limit: number | null;
    is_enabled: boolean;
}>> => {
    try {
        const response = await apiClient.get<Array<{
            package_name: string;
            permission_name: string;
            query_limit: number | null;
            is_enabled: boolean;
        }>>("/package-permissions");
        return response.data;
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "getPackagePermissions");
        throw new Error("Failed to fetch package permissions. Please try again.");
    }
};

/**
 * Get permissions for a specific package by package name
 */
export const getPackagePermissionsByPackageName = async (packageName: string): Promise<Array<{
    package_name: string;
    permission_name: string;
    query_limit: number | null;
    is_enabled: boolean;
}>> => {
    try {
        const allPermissions = await getPackagePermissions();
        return allPermissions.filter(pp => pp.package_name === packageName);
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "getPackagePermissionsByPackageName");
        throw new Error("Failed to fetch package permissions. Please try again.");
    }
};

/**
 * Assign a permission to a package
 */
export const assignPermissionToPackage = async (data: AssignPermissionRequest): Promise<void> => {
    try {
        await apiClient.post<{ status: string }>("/package-permissions/add", {
            package_name: data.package_name,
            permission_name: data.permission_name,
            query_limit: data.query_limit ?? null,
            is_enabled: data.is_enabled ?? true,
        });
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "assignPermissionToPackage");
        
        if (normalizedError.response?.data?.status === "Permission already assigned to package") {
            throw new Error("This permission is already assigned to the package.");
        }
        
        throw new Error("Failed to assign permission to package. Please try again.");
    }
};

/**
 * Remove a permission from a package
 * Note: Backend expects package_id and permission_id as path parameters
 * We need to get these from package_name and permission_name
 */
export const removePermissionFromPackage = async (packageId: number, permissionId: number): Promise<void> => {
    try {
        await apiClient.delete<{ status: string }>(`/package-permissions/remove/${packageId}/${permissionId}`);
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "removePermissionFromPackage");
        
        if (normalizedError.response?.data?.status === "Package-Permission entry not found") {
            throw new Error("Permission assignment not found.");
        }
        
        throw new Error("Failed to remove permission from package. Please try again.");
    }
};


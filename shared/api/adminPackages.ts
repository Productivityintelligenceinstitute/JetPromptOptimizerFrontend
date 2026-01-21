import apiClient from "./client";
import { normalizeError, logError } from "@/shared/utils/errorHandler";

export interface Package {
    id: string; // UUID from backend
    package_name: string;
    is_custom: boolean;
    created_at?: string;
}

export interface Permission {
    id: string; // UUID from backend
    permission_name: string;
    created_at?: string;
}

// Relation as returned by backend `/package-permissions` endpoints
export interface PackagePermissionRelation {
    id: string;
    package_id: string;
    permission_id: string;
    query_limit: number | null;
    is_enabled: boolean;
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
 * Backend: POST /packages/add with CreatePackageRequest
 * Response: status/message only, so we refetch and locate by name.
 */
export const createPackage = async (data: CreatePackageRequest): Promise<Package> => {
    try {
        await apiClient.post("/packages/add", data);

        // Refetch to get the created package (which includes its UUID `id`)
        await new Promise((resolve) => setTimeout(resolve, 100));
        const packages = await getPackages();
        const newPackage = packages.find((p) => p.package_name === data.package_name);

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

        if (normalizedError.response?.data?.detail === "Package with this name already exists") {
            throw new Error("A package with this name already exists.");
        }

        throw new Error("Failed to create package. Please try again.");
    }
};

/**
 * Delete a package
 */
export const deletePackage = async (packageId: string): Promise<void> => {
    try {
        await apiClient.delete<{ status: string }>(`/packages/${packageId}`);
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "deletePackage");

        if (
            normalizedError.response?.data?.detail === "Package not found" ||
            normalizedError.response?.data?.status === "Package not found"
        ) {
            throw new Error("Package not found.");
        }

        throw new Error("Failed to delete package. Please try again.");
    }
};

/**
 * Get all permissions
 * Backend: GET /permissions -> { permissions: [...] }
 */
export const getPermissions = async (): Promise<Permission[]> => {
    try {
        const response = await apiClient.get<{ permissions: Permission[] }>("/permissions");
        return response.data.permissions;
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "getPermissions");
        throw new Error("Failed to fetch permissions. Please try again.");
    }
};

/**
 * Get all package permissions
 * Backend: GET /package-permissions -> { package_permissions: [...] }
 */
export const getPackagePermissions = async (): Promise<PackagePermissionRelation[]> => {
    try {
        const response = await apiClient.get<{ package_permissions: PackagePermissionRelation[] }>("/package-permissions");
        return response.data.package_permissions;
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "getPackagePermissions");
        throw new Error("Failed to fetch package permissions. Please try again.");
    }
};

/**
 * Get permissions for a specific package by package id (UUID)
 */
export const getPackagePermissionsByPackageId = async (
    packageId: string,
): Promise<PackagePermissionRelation[]> => {
    try {
        const allPermissions = await getPackagePermissions();
        return allPermissions.filter((pp) => pp.package_id === packageId);
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "getPackagePermissionsByPackageId");
        throw new Error("Failed to fetch package permissions. Please try again.");
    }
};

/**
 * Assign a permission to a package
 * Backend: POST /package-permissions/add with names
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

        const detail = normalizedError.response?.data?.detail;
        if (
            detail === "Permission already assigned to package" ||
            normalizedError.response?.data?.status === "Permission already assigned to package"
        ) {
            throw new Error("This permission is already assigned to the package.");
        }

        throw new Error("Failed to assign permission to package. Please try again.");
    }
};

/**
 * Remove a permission from a package
 * Backend: DELETE /package-permissions/remove/{package_id}/{permission_id}
 */
export const removePermissionFromPackage = async (packageId: string, permissionId: string): Promise<void> => {
    try {
        await apiClient.delete<{ status: string }>(`/package-permissions/remove/${packageId}/${permissionId}`);
    } catch (error) {
        const normalizedError = normalizeError(error);
        logError(normalizedError, "removePermissionFromPackage");

        const detail = normalizedError.response?.data?.detail;
        if (
            detail === "Package-Permission mapping not found" ||
            normalizedError.response?.data?.status === "Package-Permission entry not found"
        ) {
            throw new Error("Permission assignment not found.");
        }

        throw new Error("Failed to remove permission from package. Please try again.");
    }
};


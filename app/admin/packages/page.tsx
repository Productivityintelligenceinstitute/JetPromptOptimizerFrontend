"use client";

import { useState } from 'react';
import AdminGuard from '@/shared/components/auth/AdminGuard';
import { useAuth } from '@/shared/context/AuthContext';
import { AdminNavbar } from '@/shared/components/navbar/AdminNavbar';

interface Package {
    package_id: number;
    package_name: string;
    is_custom: boolean;
    created_at?: string;
}

interface Permission {
    permission_id: number;
    permission_name: string;
    display_name: string;
    description: string;
}

interface PackagePermission {
    permission_id: number;
    is_enabled: boolean;
    query_limit: number | null;
}

interface CreatePackageRequest {
    package_name: string;
    is_custom: boolean;
    permissions: PackagePermission[];
}

const DUMMY_PERMISSIONS: Permission[] = [
    {
        permission_id: 1,
        permission_name: 'BASIC_OPT',
        display_name: 'Basic Optimization',
        description: 'Basic level prompt optimization'
    },
    {
        permission_id: 2,
        permission_name: 'STRUCT_OPT',
        display_name: 'Structured Optimization',
        description: 'Structured level prompt optimization with techniques and tips'
    },
    {
        permission_id: 3,
        permission_name: 'MASTER_OPT',
        display_name: 'Master Optimization',
        description: 'Master level optimization with interactive Q&A'
    },
    {
        permission_id: 4,
        permission_name: 'SYS_OPT',
        display_name: 'System Optimization',
        description: 'System level optimization for comprehensive prompt engineering'
    },
    {
        permission_id: 5,
        permission_name: 'LIB',
        display_name: 'Library Access',
        description: 'Access to prompt library and templates'
    }
];

const DUMMY_PACKAGES: Package[] = [
    {
        package_id: 1,
        package_name: 'Free',
        is_custom: false,
        created_at: '2024-01-01T00:00:00Z'
    },
    {
        package_id: 2,
        package_name: 'Essential',
        is_custom: false,
        created_at: '2024-01-01T00:00:00Z'
    },
    {
        package_id: 3,
        package_name: 'Pro',
        is_custom: false,
        created_at: '2024-01-01T00:00:00Z'
    },
    {
        package_id: 4,
        package_name: 'Enterprise',
        is_custom: true,
        created_at: '2024-02-15T10:30:00Z'
    },
    {
        package_id: 5,
        package_name: 'Custom Plan A',
        is_custom: true,
        created_at: '2024-03-20T14:45:00Z'
    }
];

export default function AdminPackagesPage() {
    const { user } = useAuth();
    const [packages, setPackages] = useState<Package[]>(DUMMY_PACKAGES);
    const [isLoading, setIsLoading] = useState(false);
    const [isCreating, setIsCreating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [editingPackageId, setEditingPackageId] = useState<number | null>(null);
    const [newPackageName, setNewPackageName] = useState('');
    const [editPackageName, setEditPackageName] = useState('');
    const [isCustom, setIsCustom] = useState(true);
    const [editIsCustom, setEditIsCustom] = useState(true);
    const [selectedPermissions, setSelectedPermissions] = useState<Record<number, PackagePermission>>({});
    const [editSelectedPermissions, setEditSelectedPermissions] = useState<Record<number, PackagePermission>>({});
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    const fetchPackages = async () => {
        try {
            setIsLoading(true);
            setPackages(DUMMY_PACKAGES);
        } catch (err: any) {
            setError(err.message || 'Failed to fetch packages');
        } finally {
            setIsLoading(false);
        }
    };

    const handleEditPackage = (pkg: Package) => {
        setEditingPackageId(pkg.package_id);
        setEditPackageName(pkg.package_name);
        setEditIsCustom(pkg.is_custom);
        setIsEditing(true);
        setError(null);
        setSuccess(null);
        
        // TODO: Load actual permissions for this package from API
        // For now, initialize with empty permissions
        setEditSelectedPermissions({});
    };

    const handleCancelEdit = () => {
        setIsEditing(false);
        setEditingPackageId(null);
        setEditPackageName('');
        setEditIsCustom(true);
        setEditSelectedPermissions({});
        setError(null);
        setSuccess(null);
    };

    const handleUpdatePackage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingPackageId) return;
        
        if (!editPackageName.trim()) {
            setError('Package name is required');
            return;
        }

        const enabledPermissions = Object.values(editSelectedPermissions).filter(p => p.is_enabled);
        if (enabledPermissions.length === 0) {
            setError('Please select at least one permission');
            return;
        }

        try {
            setIsCreating(true);
            setError(null);
            setSuccess(null);
            
            const packageData: CreatePackageRequest = {
                package_name: editPackageName.trim(),
                is_custom: editIsCustom,
                permissions: enabledPermissions
            };

            // TODO: Replace with actual API calls
            // Step 1: Update package
            // await updatePackage(editingPackageId, {
            //     package_name: packageData.package_name,
            //     is_custom: packageData.is_custom
            // });

            // Step 2: Update permissions
            // await updatePackagePermissions(editingPackageId, packageData.permissions);

            // For now, update local state
            setPackages(packages.map(pkg => 
                pkg.package_id === editingPackageId
                    ? { ...pkg, package_name: editPackageName.trim(), is_custom: editIsCustom }
                    : pkg
            ));
            
            setSuccess('Package updated successfully!');
            handleCancelEdit();
        } catch (err: any) {
            setError(err.message || 'Failed to update package');
        } finally {
            setIsCreating(false);
        }
    };

    const handlePermissionToggle = (permissionId: number, enabled: boolean, isEdit: boolean = false) => {
        if (isEdit) {
            setEditSelectedPermissions(prev => ({
                ...prev,
                [permissionId]: {
                    permission_id: permissionId,
                    is_enabled: enabled,
                    query_limit: enabled ? (prev[permissionId]?.query_limit || null) : null
                }
            }));
        } else {
            setSelectedPermissions(prev => ({
                ...prev,
                [permissionId]: {
                    permission_id: permissionId,
                    is_enabled: enabled,
                    query_limit: enabled ? (prev[permissionId]?.query_limit || null) : null
                }
            }));
        }
    };

    const handleQueryLimitChange = (permissionId: number, value: string, isEdit: boolean = false) => {
        const limit = value === '' ? null : parseInt(value, 10);
        if (limit !== null && (isNaN(limit) || limit < 0)) {
            return;
        }
        if (isEdit) {
            setEditSelectedPermissions(prev => ({
                ...prev,
                [permissionId]: {
                    permission_id: permissionId,
                    is_enabled: prev[permissionId]?.is_enabled || false,
                    query_limit: limit
                }
            }));
        } else {
            setSelectedPermissions(prev => ({
                ...prev,
                [permissionId]: {
                    permission_id: permissionId,
                    is_enabled: prev[permissionId]?.is_enabled || false,
                    query_limit: limit
                }
            }));
        }
    };

    const handleCreatePackage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newPackageName.trim()) {
            setError('Package name is required');
            return;
        }

        const enabledPermissions = Object.values(selectedPermissions).filter(p => p.is_enabled);
        if (enabledPermissions.length === 0) {
            setError('Please select at least one permission');
            return;
        }

        try {
            setIsCreating(true);
            setError(null);
            setSuccess(null);
            
            const packageData: CreatePackageRequest = {
                package_name: newPackageName.trim(),
                is_custom: isCustom,
                permissions: enabledPermissions
            };

            const newPackage: Package = {
                package_id: packages.length + 1,
                package_name: newPackageName.trim(),
                is_custom: isCustom,
                created_at: new Date().toISOString()
            };
            setPackages([...packages, newPackage]);
            setSuccess('Package created successfully!');
            setNewPackageName('');
            setIsCustom(true);
            setSelectedPermissions({});
        } catch (err: any) {
            setError(err.message || 'Failed to create package');
        } finally {
            setIsCreating(false);
        }
    };

    return (
        <AdminGuard>
            <div className="min-h-screen bg-gray-50">
                <AdminNavbar />
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 pt-24">
                    <div className="mb-8">
                        <h1 className="text-3xl font-semibold text-[#335386] mb-2">
                            Admin Panel
                        </h1>
                        <p className="text-gray-600">
                            Welcome, {user?.email}. Manage custom packages and permissions.
                        </p>
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 lg:p-8 mb-8">
                        <div className="mb-6">
                            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
                                Custom Packages
                            </h2>
                            <p className="text-sm text-gray-600">
                                Create and manage custom subscription packages for users.
                            </p>
                        </div>

                        {/* Edit Package Form */}
                        {isEditing && (
                            <div className="mb-8 p-6 bg-blue-50 rounded-xl border-2 border-jet-blue">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Edit Package
                                    </h3>
                                    <button
                                        onClick={handleCancelEdit}
                                        className="text-sm text-gray-600 hover:text-gray-900"
                                    >
                                        Cancel
                                    </button>
                                </div>
                                <form onSubmit={handleUpdatePackage} className="space-y-4">
                                    <div>
                                        <label htmlFor="editPackageName" className="block text-sm font-medium text-gray-700 mb-2">
                                            Package Name
                                        </label>
                                        <input
                                            type="text"
                                            id="editPackageName"
                                            value={editPackageName}
                                            onChange={(e) => setEditPackageName(e.target.value)}
                                            placeholder="Enter package name"
                                            className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue"
                                            disabled={isCreating}
                                        />
                                    </div>

                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="editIsCustom"
                                            checked={editIsCustom}
                                            onChange={(e) => setEditIsCustom(e.target.checked)}
                                            className="h-4 w-4 rounded border-gray-300 text-jet-blue focus:ring-jet-blue"
                                            disabled={isCreating}
                                        />
                                        <label htmlFor="editIsCustom" className="ml-2 text-sm text-gray-700">
                                            This is a custom package
                                        </label>
                                    </div>

                                    <div className="mt-6">
                                        <label className="block text-sm font-medium text-gray-700 mb-3">
                                            Permissions
                                        </label>
                                        <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
                                            {DUMMY_PERMISSIONS.map((permission) => {
                                                const isEnabled = editSelectedPermissions[permission.permission_id]?.is_enabled || false;
                                                const queryLimit = editSelectedPermissions[permission.permission_id]?.query_limit;

                                                return (
                                                    <div key={permission.permission_id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                                                        <div className="flex items-start gap-3">
                                                            <input
                                                                type="checkbox"
                                                                id={`edit-permission-${permission.permission_id}`}
                                                                checked={isEnabled}
                                                                onChange={(e) => handlePermissionToggle(permission.permission_id, e.target.checked, true)}
                                                                className="mt-1 h-4 w-4 rounded border-gray-300 text-jet-blue focus:ring-jet-blue"
                                                                disabled={isCreating}
                                                            />
                                                            <div className="flex-1">
                                                                <label
                                                                    htmlFor={`edit-permission-${permission.permission_id}`}
                                                                    className="text-sm font-medium text-gray-900 cursor-pointer"
                                                                >
                                                                    {permission.display_name}
                                                                </label>
                                                                <p className="text-xs text-gray-500 mt-0.5">
                                                                    {permission.description}
                                                                </p>
                                                                {isEnabled && (
                                                                    <div className="mt-3">
                                                                        <label
                                                                            htmlFor={`edit-limit-${permission.permission_id}`}
                                                                            className="block text-xs font-medium text-gray-700 mb-1"
                                                                        >
                                                                            Daily Query Limit (optional)
                                                                        </label>
                                                                        <input
                                                                            type="number"
                                                                            id={`edit-limit-${permission.permission_id}`}
                                                                            min="0"
                                                                            value={queryLimit || ''}
                                                                            onChange={(e) => handleQueryLimitChange(permission.permission_id, e.target.value, true)}
                                                                            placeholder="Unlimited if empty"
                                                                            className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue"
                                                                            disabled={isCreating}
                                                                        />
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            Leave empty for unlimited queries
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {error && (
                                        <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                            <p className="text-sm text-red-600">{error}</p>
                                        </div>
                                    )}

                                    {success && (
                                        <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                            <p className="text-sm text-green-600">{success}</p>
                                        </div>
                                    )}

                                    <div className="flex gap-3">
                                        <button
                                            type="submit"
                                            disabled={isCreating || !editPackageName.trim()}
                                            className="flex-1 rounded-lg bg-jet-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-jet-blue/90 focus:outline-none focus:ring-2 focus:ring-jet-blue focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                        >
                                            {isCreating ? (
                                                <>
                                                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                                    Updating...
                                                </>
                                            ) : (
                                                <>
                                                    Update Package
                                                    <span>→</span>
                                                </>
                                            )}
                                        </button>
                                        <button
                                            type="button"
                                            onClick={handleCancelEdit}
                                            className="px-6 py-3 text-sm font-semibold text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        )}

                        {/* Create Package Form */}
                        {!isEditing && (
                            <div className="mb-8 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                    Create New Package
                                </h3>
                            <form onSubmit={handleCreatePackage} className="space-y-4">
                                <div>
                                    <label htmlFor="packageName" className="block text-sm font-medium text-gray-700 mb-2">
                                        Package Name
                                    </label>
                                    <input
                                        type="text"
                                        id="packageName"
                                        value={newPackageName}
                                        onChange={(e) => setNewPackageName(e.target.value)}
                                        placeholder="Enter package name (e.g., Enterprise, Custom Plan)"
                                        className="w-full rounded-lg border border-gray-300 bg-white px-4 py-3 text-gray-900 shadow-sm focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue"
                                        disabled={isCreating}
                                    />
                                </div>

                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="isCustom"
                                        checked={isCustom}
                                        onChange={(e) => setIsCustom(e.target.checked)}
                                        className="h-4 w-4 rounded border-gray-300 text-jet-blue focus:ring-jet-blue"
                                        disabled={isCreating}
                                    />
                                    <label htmlFor="isCustom" className="ml-2 text-sm text-gray-700">
                                        This is a custom package
                                    </label>
                                </div>

                                <div className="mt-6">
                                    <label className="block text-sm font-medium text-gray-700 mb-3">
                                        Permissions
                                    </label>
                                    <div className="space-y-4 p-4 bg-white rounded-lg border border-gray-200">
                                        {DUMMY_PERMISSIONS.map((permission) => {
                                            const isEnabled = selectedPermissions[permission.permission_id]?.is_enabled || false;
                                            const queryLimit = selectedPermissions[permission.permission_id]?.query_limit;

                                            return (
                                                <div key={permission.permission_id} className="border-b border-gray-100 last:border-0 pb-4 last:pb-0">
                                                    <div className="flex items-start gap-3">
                                                        <input
                                                            type="checkbox"
                                                            id={`permission-${permission.permission_id}`}
                                                            checked={isEnabled}
                                                            onChange={(e) => handlePermissionToggle(permission.permission_id, e.target.checked)}
                                                            className="mt-1 h-4 w-4 rounded border-gray-300 text-jet-blue focus:ring-jet-blue"
                                                            disabled={isCreating}
                                                        />
                                                        <div className="flex-1">
                                                            <label
                                                                htmlFor={`permission-${permission.permission_id}`}
                                                                className="text-sm font-medium text-gray-900 cursor-pointer"
                                                            >
                                                                {permission.display_name}
                                                            </label>
                                                            <p className="text-xs text-gray-500 mt-0.5">
                                                                {permission.description}
                                                            </p>
                                                            {isEnabled && (
                                                                <div className="mt-3">
                                                                    <label
                                                                        htmlFor={`limit-${permission.permission_id}`}
                                                                        className="block text-xs font-medium text-gray-700 mb-1"
                                                                    >
                                                                        Daily Query Limit (optional)
                                                                    </label>
                                                                    <input
                                                                        type="number"
                                                                        id={`limit-${permission.permission_id}`}
                                                                        min="0"
                                                                        value={queryLimit || ''}
                                                                        onChange={(e) => handleQueryLimitChange(permission.permission_id, e.target.value)}
                                                                        placeholder="Unlimited if empty"
                                                                        className="w-full max-w-xs rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue"
                                                                        disabled={isCreating}
                                                                    />
                                                                    <p className="text-xs text-gray-500 mt-1">
                                                                        Leave empty for unlimited queries
                                                                    </p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>

                                {error && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                                        <p className="text-sm text-red-600">{error}</p>
                                    </div>
                                )}

                                {success && (
                                    <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                                        <p className="text-sm text-green-600">{success}</p>
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={isCreating || !newPackageName.trim()}
                                    className="w-full rounded-lg bg-jet-blue px-6 py-3 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-jet-blue/90 focus:outline-none focus:ring-2 focus:ring-jet-blue focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {isCreating ? (
                                        <>
                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                                            Creating...
                                        </>
                                    ) : (
                                        <>
                                            Create Package
                                            <span>→</span>
                                        </>
                                    )}
                                </button>
                            </form>
                            </div>
                        )}

                        <div>
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">
                                Existing Packages
                            </h3>
                            
                            {isLoading ? (
                                <div className="flex items-center justify-center py-12">
                                    <div className="text-center">
                                        <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-jet-blue border-r-transparent"></div>
                                        <p className="mt-4 text-sm text-gray-600">Loading packages...</p>
                                    </div>
                                </div>
                            ) : packages.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border border-gray-200">
                                    <p className="text-gray-600 mb-2">No packages found</p>
                                    <p className="text-sm text-gray-500">Create your first custom package above</p>
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {packages.map((pkg) => (
                                        <div
                                            key={pkg.package_id}
                                            className="p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-shadow"
                                        >
                                            <div className="flex items-start justify-between mb-2">
                                                <h4 className="text-lg font-semibold text-gray-900">
                                                    {pkg.package_name}
                                                </h4>
                                                <div className="flex items-center gap-2">
                                                    {pkg.is_custom && (
                                                        <span className="px-2 py-1 text-xs font-medium bg-orange-100 text-orange-700 rounded-full">
                                                            Custom
                                                        </span>
                                                    )}
                                                    <button
                                                        onClick={() => handleEditPackage(pkg)}
                                                        className="px-3 py-1 text-xs font-medium text-jet-blue hover:bg-jet-blue/10 rounded-lg transition-colors"
                                                    >
                                                        Edit
                                                    </button>
                                                </div>
                                            </div>
                                            <p className="text-sm text-gray-500">
                                                ID: {pkg.package_id}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AdminGuard>
    );
}


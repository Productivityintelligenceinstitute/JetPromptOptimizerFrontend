"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AdminGuard from '@/shared/components/auth/AdminGuard';

export default function AdminPage() {
    const router = useRouter();

    useEffect(() => {
        router.replace('/admin/packages');
    }, [router]);

    return (
        <AdminGuard>
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-jet-blue border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">Redirecting...</p>
                </div>
            </div>
        </AdminGuard>
    );
}

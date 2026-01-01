"use client";

import { useAuth } from '@/shared/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

interface AdminGuardProps {
    children: React.ReactNode;
}

export default function AdminGuard({ children }: AdminGuardProps) {
    const { user, isInitialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (isInitialized && (!user || user.role !== 'admin')) {
            router.push('/');
        }
    }, [user, isInitialized, router]);

    if (!isInitialized) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-jet-blue border-r-transparent"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    if (!user || user.role !== 'admin') {
        return null;
    }

    return <>{children}</>;
}


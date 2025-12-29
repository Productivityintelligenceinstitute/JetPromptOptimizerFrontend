"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/context/AuthContext';
import LoadingSpinner from '@/shared/components/ui/LoadingSpinner';

interface AuthGuardProps {
    children: React.ReactNode;
}

export default function AuthGuard({ children }: AuthGuardProps) {
    const { user, isLoading, isInitialized } = useAuth();
    const router = useRouter();

    useEffect(() => {
        // Only redirect if auth state is initialized AND user is not authenticated
        // This prevents redirecting during page reload while Firebase auth state is being restored
        if (isInitialized && !isLoading && !user) {
            router.push('/login');
        }
    }, [user, isLoading, isInitialized, router]);

    // Show loading while Firebase auth state is being restored or backend sync is in progress
    if (!isInitialized || isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    // If initialized but no user, redirect will happen in useEffect
    if (!user) {
        return null;
    }

    return <>{children}</>;
}

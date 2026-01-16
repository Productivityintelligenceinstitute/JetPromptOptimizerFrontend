"use client";

import React, { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/context/AuthContext";
import LoadingSpinner from "@/shared/components/ui/LoadingSpinner";

interface GuestGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function GuestGuard({ children, redirectTo = "/chat" }: GuestGuardProps) {
  const { user, isInitialized, isLoading } = useAuth();
  const router = useRouter();
  const redirectingRef = useRef(false);

  useEffect(() => {
    // Only redirect once - prevent multiple redirects
    if (isInitialized && !isLoading && user && !redirectingRef.current) {
      redirectingRef.current = true;
      router.replace(redirectTo);
    }
  }, [user, isInitialized, isLoading, redirectTo, router]);

  // While auth is initializing, show loading spinner instead of blank screen
  if (!isInitialized || isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-soft-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  // If user is present, show loading while redirect happens
  // This prevents the login/signup form from briefly flashing
  if (user) {
    return (
      <div className="flex h-screen items-center justify-center bg-soft-white">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return <>{children}</>;
}



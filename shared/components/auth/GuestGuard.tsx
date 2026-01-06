"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/shared/context/AuthContext";

interface GuestGuardProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export default function GuestGuard({ children, redirectTo = "/chat" }: GuestGuardProps) {
  const { user, isInitialized, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (isInitialized && !isLoading && user) {
      router.replace(redirectTo);
    }
  }, [user, isInitialized, isLoading, redirectTo, router]);

  // While auth is initializing, or if user is present (redirect in progress), don't render the page
  if (!isInitialized || isLoading || user) {
    return null;
  }

  return <>{children}</>;
}



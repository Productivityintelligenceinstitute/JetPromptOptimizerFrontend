"use client";

import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
import Cookies from 'js-cookie';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from 'firebase/auth';
import { auth } from '@/shared/lib/firebase';
import { syncUserWithBackend, SyncedUser } from '@/shared/services/userSyncService';
import { AUTH_COOKIE_NAME, AUTH_COOKIE_EXPIRY_DAYS } from '@/shared/constants/auth';
import { logError } from '@/shared/utils/errorHandler';

/**
 * User interface matching backend user data structure
 */
export interface User {
  id: string; // Firebase UID (kept for backward compatibility)
  user_id: string; // Backend user ID - use this for API calls
  email: string;
  name?: string;
  token: string;
  role: string;
  package_name?: string; // Active subscription package name
}

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  isInitialized: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * Converts SyncedUser to User interface
 */
const mapSyncedUserToUser = (syncedUser: SyncedUser, firebaseUid: string): User => {
  return {
    id: firebaseUid,
    user_id: syncedUser.userId,
    email: syncedUser.email,
    name: syncedUser.name,
    token: syncedUser.token,
    role: syncedUser.role,
    package_name: syncedUser.packageName,
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  
  // Use ref to track current sync operation and prevent race conditions
  const syncInProgressRef = useRef<string | null>(null);
  const mountedRef = useRef(true);

  /**
   * Handles user synchronization with backend
   * Prevents race conditions by tracking sync operations
   */
  const handleUserSync = useCallback(async (firebaseUser: FirebaseUser): Promise<void> => {
    const currentUid = firebaseUser.uid;
    
    // Prevent concurrent syncs for the same user
    if (syncInProgressRef.current === currentUid) {
      return;
    }

    syncInProgressRef.current = currentUid;

    try {
      const token = await firebaseUser.getIdToken();
      Cookies.set(AUTH_COOKIE_NAME, token, { expires: AUTH_COOKIE_EXPIRY_DAYS });

      const syncResult = await syncUserWithBackend(firebaseUser, token);

      if (!mountedRef.current) {
        return;
      }

      if (syncResult.success && syncResult.user) {
        // Successful sync - use backend user data
        setUser(mapSyncedUserToUser(syncResult.user, firebaseUser.uid));
      } else if (syncResult.user) {
        // Fallback user provided (graceful degradation)
        // Backend sync failed but Firebase user exists - keep user logged in with fallback data
        setUser(mapSyncedUserToUser(syncResult.user, firebaseUser.uid));
        if (syncResult.error) {
          logError(syncResult.error, 'AuthProvider.handleUserSync');
        }
      } else {
        // Complete failure - but Firebase says user is authenticated
        // Don't log out - use Firebase data as fallback
        // Only log out if Firebase itself says user is not authenticated
        logError(syncResult.error || new Error('User sync failed'), 'AuthProvider.handleUserSync');
        // Create fallback user from Firebase data
        const fallbackToken = await firebaseUser.getIdToken();
        Cookies.set(AUTH_COOKIE_NAME, fallbackToken, { expires: AUTH_COOKIE_EXPIRY_DAYS });
        setUser({
          id: firebaseUser.uid,
          user_id: firebaseUser.uid,
          email: firebaseUser.email || '',
          name: firebaseUser.displayName || undefined,
          token: fallbackToken,
          role: 'user',
        });
      }
    } catch (error) {
      if (!mountedRef.current) {
        return;
      }
      logError(error, 'AuthProvider.handleUserSync');
      // On error, still set a fallback user to allow app to function
      const token = await firebaseUser.getIdToken();
      setUser({
        id: firebaseUser.uid,
        user_id: firebaseUser.uid,
        email: firebaseUser.email || '',
        name: firebaseUser.displayName || undefined,
        token,
        role: 'user',
      });
    } finally {
      if (syncInProgressRef.current === currentUid) {
        syncInProgressRef.current = null;
      }
    }
  }, []);

  /**
   * Handles user logout
   */
  const handleLogout = useCallback(() => {
    setUser(null);
    Cookies.remove(AUTH_COOKIE_NAME);
    syncInProgressRef.current = null;
  }, []);

  // Initialize auth state listener
  useEffect(() => {
    mountedRef.current = true;
    setIsInitialized(false);
    setIsLoading(true);

    // onAuthStateChanged fires immediately with current auth state (null if not authenticated)
    // and then again whenever auth state changes
    const unsubscribe = onAuthStateChanged(
      auth,
      async (firebaseUser) => {
        if (!mountedRef.current) {
          return;
        }

        try {
          if (firebaseUser) {
            // User is authenticated in Firebase - sync with backend
            await handleUserSync(firebaseUser);
          } else {
            // User is not authenticated in Firebase - clear local state
            // Only clear if we're sure Firebase auth state is null (not just initializing)
            handleLogout();
          }
        } catch (error) {
          // If sync fails but Firebase user exists, keep Firebase auth state
          // Don't log out the user if Firebase says they're authenticated
          logError(error, 'AuthProvider.onAuthStateChanged');
          if (firebaseUser) {
            // Firebase says user is authenticated, so keep them logged in
            // Use fallback user data from Firebase
            const token = await firebaseUser.getIdToken();
            Cookies.set(AUTH_COOKIE_NAME, token, { expires: AUTH_COOKIE_EXPIRY_DAYS });
            setUser({
              id: firebaseUser.uid,
              user_id: firebaseUser.uid,
              email: firebaseUser.email || '',
              name: firebaseUser.displayName || undefined,
              token,
              role: 'user',
              package_name: 'free',
            });
          }
        } finally {
          if (mountedRef.current) {
            setIsInitialized(true);
            setIsLoading(false);
          }
        }
      },
      (error) => {
        // Error callback - Firebase auth initialization failed
        if (mountedRef.current) {
          logError(error, 'AuthProvider.onAuthStateChanged.error');
          // Don't clear user on auth error - might be temporary
          // Only mark as initialized so UI can render
          setIsInitialized(true);
          setIsLoading(false);
        }
      }
    );

    return () => {
      mountedRef.current = false;
      unsubscribe();
    };
  }, [handleUserSync, handleLogout]);

  const login = useCallback(async (email: string, password: string): Promise<void> => {
    setIsLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // Auth state change will handle user sync
    } catch (error) {
      logError(error, 'AuthProvider.login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const signup = useCallback(async (email: string, password: string, name?: string): Promise<void> => {
    setIsLoading(true);
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      // Auth state change will handle user sync
    } catch (error) {
      logError(error, 'AuthProvider.signup');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(async (): Promise<void> => {
    setIsLoading(true);
    try {
      await signOut(auth);
      // Auth state change will handle cleanup
    } catch (error) {
      logError(error, 'AuthProvider.logout');
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ 
      user, 
      login, 
      signup, 
      logout, 
      isLoading,
      isInitialized,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
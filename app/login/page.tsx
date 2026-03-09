"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/shared/context/AuthContext';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { LogoIcon } from '@/shared/components/icons/user-icons';
import GuestGuard from '@/shared/components/auth/GuestGuard';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '@/shared/lib/firebase';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoading, loginRejectedReason, clearLoginRejectedReason } = useAuth();
  const [loginSuccess, setLoginSuccess] = useState(false);
  const [resetMessage, setResetMessage] = useState<string | null>(null);
  const [showResetForm, setShowResetForm] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
    clearErrors,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    clearLoginRejectedReason();
    clearErrors('root');
    setResetMessage(null);
    setResetError(null);
    try {
      await login(data.email, data.password);
      // Mark login as successful - GuestGuard will handle redirect once user sync completes
      setLoginSuccess(true);
    } catch (error) {
      setError('root', { message: 'Invalid credentials' });
      setLoginSuccess(false);
    }
  };

  const handlePasswordReset = async () => {
    clearLoginRejectedReason();
    setResetMessage(null);
    setResetError(null);

    const email = resetEmail.trim();
    if (!email) {
      setResetError('Please enter your email.');
      return;
    }

    // Basic email format validation using the same schema
    try {
      loginSchema.shape.email.parse(email);
    } catch {
      setResetError('Please enter a valid email address.');
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      setResetMessage(
        'If an account exists with this email, we have sent a reset link. Please check your inbox.'
      );
    } catch (error) {
      setResetError('Could not send reset email. Please try again in a moment.');
    }
  };

  // When backend rejected login (e.g. soft-deleted user), show message and clear the flag
  useEffect(() => {
    if (loginRejectedReason) {
      setLoginSuccess(false);
      setError('root', { message: loginRejectedReason });
      clearLoginRejectedReason();
    }
  }, [loginRejectedReason, setError, clearLoginRejectedReason]);

  return (
    <GuestGuard>
      <main className="relative flex items-center justify-center min-h-screen bg-soft-white px-4">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <Link href="/" className="inline-block mb-6">
              <LogoIcon />
            </Link>
            <h1 className="text-3xl font-semibold text-jet-blue">Sign In</h1>
            <p className="mt-2 text-sm text-gray-700">
              Welcome back! Please sign in to your account.
            </p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue text-gray-900"
                placeholder="Enter your email"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue text-gray-900"
                placeholder="Enter your password"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
            </div>

            <div className="mt-2 space-y-2">
              {!showResetForm ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowResetForm(true);
                    setResetError(null);
                    setResetMessage(null);
                    setResetEmail('');
                  }}
                  disabled={isLoading}
                  className="text-xs font-medium text-signal-orange hover:text-signal-orange/80 underline disabled:opacity-60"
                >
                  Forgot your password?
                </button>
              ) : (
                <div className="space-y-2 text-left">
                  <p className="text-xs text-gray-700">
                    Enter the email address where we should send your password reset link.
                  </p>
                  <input
                    type="email"
                    value={resetEmail}
                    onChange={(e) => setResetEmail(e.target.value)}
                    className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 text-xs shadow-sm focus:border-jet-blue focus:outline-none focus:ring-1 focus:ring-jet-blue text-gray-900"
                    placeholder="you@example.com"
                  />
                  {resetError && (
                    <p className="text-xs text-red-600">
                      {resetError}
                    </p>
                  )}
                  {resetMessage && (
                    <p className="text-xs text-gray-600">
                      {resetMessage}
                    </p>
                  )}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handlePasswordReset}
                      disabled={isLoading}
                      className="inline-flex items-center justify-center rounded-md border border-signal-orange px-3 py-1 text-xs font-medium text-signal-orange hover:bg-signal-orange/5 disabled:opacity-60"
                    >
                      Send reset email
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setShowResetForm(false);
                        setResetEmail('');
                        setResetError(null);
                        setResetMessage(null);
                      }}
                      className="text-[11px] text-gray-500 hover:text-gray-700"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>

            {errors.root && (
              <p className="text-sm text-red-600">{errors.root.message}</p>
            )}

            <button
              type="submit"
              disabled={isLoading || loginSuccess}
              className="w-full inline-flex items-center justify-center gap-2 rounded-md bg-jet-blue px-4 py-2 text-sm font-medium text-soft-white shadow-sm transition hover:bg-jet-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jet-blue focus-visible:ring-offset-2 disabled:opacity-60"
              aria-live="polite"
            >
              {(isLoading || loginSuccess) && (
                <span
                  className="h-4 w-4 animate-spin rounded-full border-2 border-white/60 border-t-white"
                  aria-hidden="true"
                />
              )}
              <span>
                {loginSuccess ? 'Signing you in...' : isLoading ? 'Signing in...' : 'Sign In'}
              </span>
            </button>
          </form>

          <div className="text-center">
            <p className="text-sm text-gray-700">
              Don't have an account?{' '}
              {isLoading || loginSuccess ? (
                <span className="font-medium text-gray-400 cursor-not-allowed">
                  Sign up
                </span>
              ) : (
                <Link
                  href="/signup"
                  className="font-medium text-signal-orange hover:text-signal-orange/80"
                >
                  Sign up
                </Link>
              )}
            </p>
          </div>
        </div>
      </main>
    </GuestGuard>
  );
}
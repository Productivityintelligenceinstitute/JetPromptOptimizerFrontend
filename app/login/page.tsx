"use client";

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '@/shared/context/AuthContext';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';
import { LogoIcon } from '@/shared/components/icons/user-icons';
import GuestGuard from '@/shared/components/auth/GuestGuard';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login, isLoading, user, isInitialized } = useAuth();
  const router = useRouter();
  const [loginSuccess, setLoginSuccess] = useState(false);
  const {
    register,
    handleSubmit,
    formState: { errors },
    setError,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      await login(data.email, data.password);
      // Mark login as successful - wait for user sync to complete
      setLoginSuccess(true);
      // The useEffect will handle the redirect once user is available
    } catch (error) {
      setError('root', { message: 'Invalid credentials' });
      setLoginSuccess(false);
    }
  };

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

          {errors.root && (
            <p className="text-sm text-red-600">{errors.root.message}</p>
          )}

          <button
            type="submit"
            disabled={isLoading || loginSuccess}
            className="w-full inline-flex items-center justify-center rounded-md bg-jet-blue px-4 py-2 text-sm font-medium text-soft-white shadow-sm transition hover:bg-jet-blue/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-jet-blue focus-visible:ring-offset-2 disabled:opacity-50"
          >
            {loginSuccess ? 'Signing you in...' : isLoading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <div className="text-center">
          <p className="text-sm text-gray-700">
            Don't have an account?{' '}
            <Link href="/signup" className="font-medium text-signal-orange hover:text-signal-orange/80">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
    </GuestGuard>
  );
}
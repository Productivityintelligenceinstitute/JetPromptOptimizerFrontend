"use client";
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import EmptyState from '@/shared/components/Chat/EmptyState';
import Notification from '@/shared/components/Notification/Notification';
import { useAuth } from '@/shared/context/AuthContext';
import { getCurrentUser } from '@/shared/api/user';

export default function NewChatPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { user, refreshUser } = useAuth();
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

    // Handle success message from Stripe redirect - verify with backend
    useEffect(() => {
        const success = searchParams.get('success');
        if (success) {
            // Verify subscription status from backend
            const verifySubscription = async () => {
                try {
                    // Refresh user data from backend to get latest subscription status
                    await refreshUser();
                    
                    // Fetch updated user data to show in notification
                    const userData = await getCurrentUser();

                    // Show success notification based on backend response
                    const packageName = userData.package_name || 'free';
                    if (packageName.toLowerCase() !== 'free') {
                        setNotification({
                            message: `Payment successful! Your ${packageName} subscription is now active. You can now use your new package features.`,
                            type: 'success'
                        });
                    } else {
                        setNotification({
                            message: 'Payment processed. Please wait a moment for your subscription to activate.',
                            type: 'info'
                        });
                    }
                } catch (error) {
                    console.error('Error verifying subscription:', error);
                    setNotification({
                        message: 'Payment was successful, but we couldn\'t verify your subscription status. Please refresh the page or contact support if the issue persists.',
                        type: 'error'
                    });
                } finally {
                    // Clean up URL
                    router.replace('/chat');
                }
            };

            verifySubscription();
        }
    }, [searchParams, router, refreshUser]);

    const handleSuggestionClick = (suggestion: string) => {
        // Navigate to new chat route - chat will be created by backend on first message
        router.push('/chat/new');
    };

    return (
        <div className="flex-1 overflow-hidden flex flex-col">
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
            <div className="flex-1 flex items-center justify-center">
                <EmptyState onSuggestionClick={handleSuggestionClick} />
            </div>
        </div>
    );
}

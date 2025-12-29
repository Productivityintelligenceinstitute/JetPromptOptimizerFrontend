"use client";
import { useRouter } from 'next/navigation';
import EmptyState from '@/shared/components/Chat/EmptyState';

export default function NewChatPage() {
    const router = useRouter();

    const handleSuggestionClick = (suggestion: string) => {
        // Navigate to new chat route - chat will be created by backend on first message
        router.push('/chat/new');
    };

    return (
        <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 flex items-center justify-center">
                <EmptyState onSuggestionClick={handleSuggestionClick} />
            </div>
        </div>
    );
}

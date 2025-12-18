"use client";
import { useRouter } from 'next/navigation';
import EmptyState from '@/shared/components/Chat/EmptyState';

export default function NewChatPage() {
    const router = useRouter();

    const handleSuggestionClick = (suggestion: string) => {
        // Just navigate to a new chat - don't send the message yet
        const newChatId = crypto.randomUUID();
        router.push(`/chat/${newChatId}`);
    };

    return (
        <div className="flex-1 overflow-hidden flex flex-col">
            <div className="flex-1 flex items-center justify-center">
                <EmptyState onSuggestionClick={handleSuggestionClick} />
            </div>
        </div>
    );
}

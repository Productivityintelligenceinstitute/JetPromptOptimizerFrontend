"use client";
import { useRouter } from 'next/navigation';
import EmptyState from '@/shared/components/Chat/EmptyState';


export default function NewChatPage() {
    const router = useRouter();

    const handleSendMessage = (message: string) => {
        const newChatId = crypto.randomUUID();
        router.push(`/chat/${newChatId}?initial=${encodeURIComponent(message)}`);
    };

    const handleSuggestionClick = (suggestion: string) => {
        // Auto-send suggestion
        handleSendMessage(suggestion);
    };

    return (
        <>
            <div className="flex-1 overflow-hidden">
                <EmptyState onSuggestionClick={handleSuggestionClick} />
            </div>
        </>
    );
}

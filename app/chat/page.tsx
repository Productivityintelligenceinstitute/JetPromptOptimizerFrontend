"use client";
import { useRouter } from 'next/navigation';
import EmptyState from '@/shared/components/Chat/EmptyState';


import ChatInput from '@/shared/components/Chat/ChatInput';

import { useState } from 'react';

export default function NewChatPage() {
    const router = useRouter();
    const [inputValue, setInputValue] = useState("");

    const handleSendMessage = (message: string) => {
        const newChatId = crypto.randomUUID();
        router.push(`/chat/${newChatId}?initial=${encodeURIComponent(message)}`);
    };

    const handleSuggestionClick = (suggestion: string) => {
        setInputValue(suggestion);
    };

    return (
        <>
            <div className="flex-1 overflow-hidden flex flex-col">
                <div className="flex-1 flex items-center justify-center">
                    <EmptyState onSuggestionClick={handleSuggestionClick} />
                </div>
                <ChatInput
                    onSendMessage={handleSendMessage}
                    initialValue={inputValue}
                    // Force re-render when initialValue changes if the component doesn't handle prop updates internally
                    key={inputValue}
                />
            </div>
        </>
    );
}

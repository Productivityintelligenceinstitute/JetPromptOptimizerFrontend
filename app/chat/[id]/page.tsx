    "use client";

import React, { useState, useEffect } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import ChatArea from '@/shared/components/Chat/ChatArea';
import ChatInput from '@/shared/components/Chat/ChatInput';
import { Message } from '@/shared/types/chat';

export default function ChatSessionPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);

    // Load initial message if present
    useEffect(() => {
        const initialMsg = searchParams.get('initial');
        if (initialMsg && messages.length === 0) {
            const userMsg: Message = {
                id: crypto.randomUUID(),
                role: 'user',
                content: initialMsg
            };
            setMessages([userMsg]);

            // Simulate AI response
            setTimeout(() => {
                const aiResponse: Message = {
                    id: crypto.randomUUID(),
                    role: 'assistant',
                    content: "This is a simulated response for the new chat session.",
                };
                setMessages(prev => [...prev, aiResponse]);
            }, 1000);
        } else if (messages.length === 0) {
            // If no initial message, maybe fetch history based on params.id
            // For demo, we just show a welcome or fetch mock history
            // Mock history for existing chat
            const mockHistory: Message[] = [
                { id: '1', role: 'user', content: 'Previous message in this chat' },
                { id: '2', role: 'assistant', content: 'Previous response' }
            ];
            setMessages(mockHistory);
        }
    }, [searchParams, params.id]);

    const handleSendMessage = (content: string) => {
        const newMessage: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
        };
        setMessages(prev => [...prev, newMessage]);

        // Simulate AI response
        setTimeout(() => {
            const aiResponse: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "I am a simulated AI response.",
            };
            setMessages(prev => [...prev, aiResponse]);
        }, 1000);
    };

    return (
        <>
            <ChatArea messages={messages} />
            <ChatInput onSendMessage={handleSendMessage} />
        </>
    );
}

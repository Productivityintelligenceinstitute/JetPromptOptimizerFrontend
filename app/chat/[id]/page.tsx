"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams, useParams } from 'next/navigation';
import ChatArea from '@/shared/components/Chat/ChatArea';
import ChatInput from '@/shared/components/Chat/ChatInput';
import { Message } from '@/shared/types/chat';
import { useOptimizePrompt } from '@/shared/hooks/useChat';
import { useAuth } from '@/shared/context/AuthContext';

export default function ChatSessionPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [chatId, setChatId] = useState<string | undefined>(params.id as string);
    const { mutate: optimize, isPending } = useOptimizePrompt();
    const { user } = useAuth();
    const initialProcessed = useRef(false);

    // Load initial message if present
    useEffect(() => {
        const initialMsg = searchParams.get('initial');
        if (initialMsg && !initialProcessed.current) {
            initialProcessed.current = true;
            handleSendMessage(initialMsg);
        }
    }, [searchParams]);

    const handleSendMessage = (content: string) => {
        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
        };
        setMessages((prev) => [...prev, userMsg]);

        if (!user) {
            console.error("User not authenticated");
            return;
        }

        optimize(
            { user_prompt: content, chat_id: chatId, user_id: user.id },
            {
                onSuccess: (data) => {
                    if (!chatId && data.chat_id) {
                        setChatId(data.chat_id);
                        // Optionally update URL without reload if needed, but might not be strictly necessary for flow
                        window.history.replaceState(null, '', `/chat/${data.chat_id}`);
                    }

                    const aiResponse: Message = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: data.response.share_message + "\n\n" + data.response.optimized_prompt,
                    };
                    setMessages((prev) => [...prev, aiResponse]);
                },
                onError: (error) => {
                    console.error("Optimization error:", error);
                    const errorMsg: Message = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: "Sorry, something went wrong while optimizing your prompt.",
                    };
                    setMessages((prev) => [...prev, errorMsg]);
                },
            }
        );
    };

    return (
        <>
            <ChatArea messages={messages} />
            <ChatInput onSendMessage={handleSendMessage} isLoading={isPending} />
        </>
    );
}

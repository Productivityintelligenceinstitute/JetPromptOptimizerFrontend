"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import ChatArea from '@/shared/components/Chat/ChatArea';
import ChatInput from '@/shared/components/Chat/ChatInput';
import { Message } from '@/shared/types/chat';
import { useOptimizePrompt } from '@/shared/hooks/useChat';
import { useAuth } from '@/shared/context/AuthContext';

export default function ChatSessionPage() {
    const params = useParams();
    const [messages, setMessages] = useState<Message[]>([]);
    // Only set chatId if we have a valid ID from params (not "new")
    const [chatId, setChatId] = useState<string | undefined>(
        params.id && params.id !== 'new' ? (params.id as string) : undefined
    );
    const { mutate: optimize, isPending } = useOptimizePrompt();
    const { user } = useAuth();
    const chatAreaRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom when new messages arrive
    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (content: string) => {
        // Add user message to chat
        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
        };
        setMessages((prev) => [...prev, userMsg]);

        // Check authentication
        if (!user) {
            console.error("User not authenticated");
            const errorMsg: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "Please log in to use the chat feature.",
            };
            setMessages((prev) => [...prev, errorMsg]);
            return;
        }

        // Call API to optimize prompt
        // Only pass chat_id if it exists (existing chat), otherwise backend will create new chat
        optimize(
            {
                user_prompt: content,
                chat_id: chatId || undefined, // Only pass if chatId exists
                user_id: user.user_id
            },
            {
                onSuccess: (data) => {
                    // Update chat ID if this is a new chat (backend created it)
                    if (!chatId && data.chat_id) {
                        setChatId(data.chat_id);
                        // Update URL to include the chat_id from backend
                        window.history.replaceState(null, '', `/chat/${data.chat_id}`);
                    }

                    // Format the AI response
                    const responseContent = [
                        data.response.share_message,
                        '',
                        '**Optimized Prompt:**',
                        data.response.optimized_prompt,
                        '',
                        data.response.changes_made && data.response.changes_made.length > 0
                            ? '**Changes Made:**\n' + data.response.changes_made.map(change => `• ${change}`).join('\n')
                            : ''
                    ].filter(Boolean).join('\n');

                    const aiResponse: Message = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: responseContent,
                    };
                    setMessages((prev) => [...prev, aiResponse]);
                },
                onError: (error) => {
                    console.error("Optimization error:", error);
                    const errorMsg: Message = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: "Sorry, something went wrong while optimizing your prompt. Please try again.",
                    };
                    setMessages((prev) => [...prev, errorMsg]);
                },
            }
        );
    };

    return (
        <div className="flex flex-col h-full">
            <ChatArea messages={messages} isLoading={isPending} ref={chatAreaRef} />
            <ChatInput onSendMessage={handleSendMessage} isLoading={isPending} />
        </div>
    );
}

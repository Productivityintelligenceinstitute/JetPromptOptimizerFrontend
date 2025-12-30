"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams } from 'next/navigation';
import ChatArea from '@/shared/components/Chat/ChatArea';
import ChatInput from '@/shared/components/Chat/ChatInput';
import { Message } from '@/shared/types/chat';
import { useOptimizePrompt } from '@/shared/hooks/useChat';
import { useAuth } from '@/shared/context/AuthContext';
import { getChatMessages } from '@/shared/api/chat';
import { logError } from '@/shared/utils/errorHandler';
import { formatMessage } from '@/shared/utils/messageFormatter';

export default function ChatSessionPage() {
    const params = useParams();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    // Only set chatId if we have a valid ID from params (not "new")
    const [chatId, setChatId] = useState<string | undefined>(
        params.id && params.id !== 'new' ? (params.id as string) : undefined
    );
    const { mutate: optimize, isPending } = useOptimizePrompt();
    const { user } = useAuth();
    const chatAreaRef = useRef<HTMLDivElement>(null);

    // Load messages when chatId changes
    useEffect(() => {
        const loadMessages = async () => {
            if (!chatId || chatId === 'new') {
                setMessages([]);
                return;
            }

            try {
                setIsLoadingMessages(true);
                const response = await getChatMessages(chatId);
                // Messages come in reverse order (newest first), so reverse to show oldest first
                const formattedMessages: Message[] = response.items
                    .reverse()
                    .map((msg) => ({
                        id: crypto.randomUUID(), // Generate ID for frontend
                        role: msg.role as 'user' | 'assistant',
                        content: formatMessage(msg.role, msg.content), // Format the content
                    }));
                setMessages(formattedMessages);
            } catch (error) {
                logError(error, 'ChatSessionPage.loadMessages');
                // Don't clear messages on error, just log it
            } finally {
                setIsLoadingMessages(false);
            }
        };

        loadMessages();
    }, [chatId]);

    // Update chatId when params change
    useEffect(() => {
        const newChatId = params.id && params.id !== 'new' ? (params.id as string) : undefined;
        if (newChatId !== chatId) {
            setChatId(newChatId);
        }
    }, [params.id]);

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
                onSuccess: async (data) => {
                    // Update chat ID if this is a new chat (backend created it)
                    const isNewChat = !chatId && data.chat_id;
                    if (isNewChat) {
                        setChatId(data.chat_id);
                        // Update URL to include the chat_id from backend
                        window.history.replaceState(null, '', `/chat/${data.chat_id}`);
                        // Reload messages to get the saved messages from backend
                        // This ensures we have the correct messages with proper IDs
                        try {
                            const response = await getChatMessages(data.chat_id);
                            const formattedMessages: Message[] = response.items
                                .reverse()
                                .map((msg) => ({
                                    id: crypto.randomUUID(),
                                    role: msg.role as 'user' | 'assistant',
                                    content: formatMessage(msg.role, msg.content), // Format the content
                                }));
                            setMessages(formattedMessages);
                            return; // Exit early since we've loaded messages from backend
                        } catch (error) {
                            logError(error, 'ChatSessionPage.onSuccess.reloadMessages');
                            // Fall through to add message optimistically if reload fails
                        }
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
            <ChatArea 
                messages={messages} 
                isLoading={isPending || isLoadingMessages} 
                ref={chatAreaRef} 
            />
            <ChatInput onSendMessage={handleSendMessage} isLoading={isPending} />
        </div>
    );
}

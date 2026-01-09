"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ChatArea from '@/shared/components/Chat/ChatArea';
import ChatInput from '@/shared/components/Chat/ChatInput';
import { Message } from '@/shared/types/chat';
import { useOptimizePrompt, useOptimizeStructuredPrompt, useOptimizeMasterPrompt, useOptimizeSystemPrompt } from '@/shared/hooks/useChat';
import { useAuth } from '@/shared/context/AuthContext';
import { getChatMessages } from '@/shared/api/chat';
import { getMyLibrary } from '@/shared/api/library';
import { logError } from '@/shared/utils/errorHandler';
import { formatMessage, formatAssistantMessage, formatSystemLevelResponse, formatMasterLevelResponse } from '@/shared/utils/messageFormatter';
import { ApiError } from '@/shared/types/errors';
import UpgradeRequiredModal from '@/shared/components/Modal/UpgradeRequiredModal';
import DailyLimitExceededModal from '@/shared/components/Modal/DailyLimitExceededModal';
import SharePromptModal from '@/shared/components/Modal/SharePromptModal';
import DeleteChatModal from '@/shared/components/Modal/DeleteChatModal';
import { detectOptimizationLevel, getLevelDisplayName, OPTIMIZATION_LEVELS, OptimizationLevel } from '@/shared/utils/optimizationLevel';
import { generateOptimizationLevelMessage } from '@/shared/utils/optimizationLevelMessage';
import { addToLibrary } from '@/shared/api/library';
import { deleteChat } from '@/shared/api/chat';
import { useRouter } from 'next/navigation';

export default function ChatSessionPage() {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    
    // Immediately redirect if route param is invalid
    useEffect(() => {
        const id = params.id as string | undefined;
        if (id === 'undefined' || id === 'null') {
            router.replace('/chat/new');
            return;
        }
    }, [params.id, router]);
    
    const [chatId, setChatId] = useState<string | undefined>(() => {
        const id = params.id as string | undefined;
        // Validate that id is a valid UUID format, not 'new', 'undefined', or 'null'
        if (id && id !== 'new' && id !== 'undefined' && id !== 'null') {
            return id;
        }
        return undefined;
    });
    
    const levelParam = searchParams.get('level');
    const optimizationLevel = levelParam && levelParam in OPTIMIZATION_LEVELS 
        ? OPTIMIZATION_LEVELS[levelParam as OptimizationLevel]
        : null;
    
    // Track the effective level for this chat so it persists even when reopened without ?level
    const [chatLevel, setChatLevel] = useState<typeof OPTIMIZATION_LEVELS[OptimizationLevel] | null>(
        optimizationLevel
    );
    const effectiveLevel = chatLevel || optimizationLevel;
    
    const isStructuredLevel = effectiveLevel?.level === 'structured';
    const isMasteryLevel = effectiveLevel?.level === 'mastery';
    const isSystemLevel = effectiveLevel?.level === 'system';
    const { mutate: optimize, isPending: isPendingBasic } = useOptimizePrompt();
    const { mutate: optimizeStructured, isPending: isPendingStructured } = useOptimizeStructuredPrompt();
    const { mutate: optimizeMaster, isPending: isPendingMaster } = useOptimizeMasterPrompt();
    const { mutate: optimizeSystem, isPending: isPendingSystem } = useOptimizeSystemPrompt();
    
    const optimizeFn = isStructuredLevel ? optimizeStructured 
        : isMasteryLevel ? optimizeMaster 
        : isSystemLevel ? optimizeSystem 
        : optimize;
    const isPending = isStructuredLevel ? isPendingStructured 
        : isMasteryLevel ? isPendingMaster 
        : isSystemLevel ? isPendingSystem 
        : isPendingBasic;
    const { user } = useAuth();
    const chatAreaRef = useRef<HTMLDivElement>(null);
    
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [showLimitModal, setShowLimitModal] = useState(false);
    const [showShareModal, setShowShareModal] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [featureName, setFeatureName] = useState<string>('');
    const [sharePromptContent, setSharePromptContent] = useState<string>('');
    const [shareMessageId, setShareMessageId] = useState<string>('');
    const [isSharing, setIsSharing] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [sharedMessageIds, setSharedMessageIds] = useState<Set<string>>(new Set());
    
    // Track the previous chatId to detect when we're switching to a different chat
    const prevChatIdRef = useRef<string | undefined>(undefined);
    
    // When switching to a different chat (not just setting chatId for the first time), reset chatLevel
    // This allows URL level to take priority when opening a new chat, but preserves level once chat is established
    useEffect(() => {
        // Only reset if we're switching to a completely different chat
        // If prevChatIdRef.current is undefined and chatId is set, that's the first time setting it (don't reset)
        // If prevChatIdRef.current !== chatId and both are defined, that's switching chats (reset)
        if (prevChatIdRef.current !== undefined && prevChatIdRef.current !== chatId && chatId !== undefined) {
            // Switching to a different chat - reset level to URL level
            setChatLevel(optimizationLevel);
        } else if (prevChatIdRef.current === undefined && chatId === undefined && optimizationLevel) {
            // New chat starting with a level in URL - set it
            setChatLevel(optimizationLevel);
        }
        prevChatIdRef.current = chatId;
    }, [chatId, optimizationLevel]);
    
    // Redirect free (non-admin) users away from structured level chat
    useEffect(() => {
        if (!effectiveLevel || !user) return;
        // Allow admins to access all levels regardless of package
        const isAdmin = user.role === 'admin';
        if (isStructuredLevel && user.package_name === 'free' && !isAdmin) {
            router.replace('/chat');
        }
    }, [effectiveLevel, isStructuredLevel, user?.package_name, user, router]);

    // Load user's shared message ids once
    useEffect(() => {
        if (!user) return;
        const loadShared = async () => {
            try {
                // fetch a generous page size to cover typical usage
                const myLibrary = await getMyLibrary(user.user_id, 1, 500);
                setSharedMessageIds(new Set(myLibrary.items.map((item) => item.message_id)));
            } catch (error) {
                // Don't block chat if library fetch fails
                logError(error, 'ChatSessionPage.loadSharedLibrary');
            }
        };
        loadShared();
    }, [user?.user_id]);
    useEffect(() => {
        const isNewChat = !chatId || chatId === 'new';
        const hasLevelMessage = messages.some(msg => msg.id === 'optimization-level-info');
        
        if (isNewChat && !hasLevelMessage && optimizationLevel !== null && user) {
            const levelMessage: Message = {
                id: 'optimization-level-info',
                role: 'assistant',
                content: generateOptimizationLevelMessage(optimizationLevel, user.package_name, user.role),
            };
            setMessages([levelMessage]);
        }
    }, [chatId, optimizationLevel, user?.package_name, user]);

    useEffect(() => {
        const loadMessages = async () => {
            // Validate chatId before making API call
            if (!chatId || chatId === 'new' || chatId === 'undefined' || chatId === 'null') {
                return;
            }

            try {
                setIsLoadingMessages(true);
                const response = await getChatMessages(chatId);
                const formattedMessages: Message[] = response.items
                    .reverse()
                    .map((msg: any) => {
                        const backendId = msg.id as string | undefined;
                        const isShared = !!backendId && sharedMessageIds.has(backendId);
                        return {
                            id: backendId || crypto.randomUUID(),
                        role: msg.role as 'user' | 'assistant',
                        content: formatMessage(msg.role, msg.content),
                            messageId: backendId,
                            isShared,
                        };
                    });
                setMessages(formattedMessages);
                
                // Detect level from raw content (before formatting) if we don't have a level yet
                // Find the first assistant message in chronological order (before reverse)
                if (!chatLevel && response.items.length > 0) {
                    // Find first assistant message in original order (not reversed)
                    const firstAssistant = response.items.find((msg: any) => msg.role === 'assistant');
                    if (firstAssistant && firstAssistant.content) {
                        // Use raw content for detection (before formatting)
                        const detected = detectOptimizationLevel(firstAssistant.content);
                        if (detected && detected.level !== 'basic') {
                            setChatLevel(detected);
                        }
                    }
                }
            } catch (error) {
                logError(error, 'ChatSessionPage.loadMessages');
                // Don't clear messages on error, just log it
            } finally {
                setIsLoadingMessages(false);
            }
        };

        loadMessages();
    }, [chatId]);

    // When messages load and we don't yet know the chat level, try to detect it once
    // Only detect if we're loading an existing chat (chatId exists) and don't have a level yet
    useEffect(() => {
        // Don't detect if we already have a locked-in level
        if (chatLevel || messages.length === 0) return;
        // Only detect when loading an existing chat, not when creating a new one
        if (!chatId || chatId === 'new') return;
        
        const firstAssistant = messages.find((msg) => msg.role === 'assistant');
        if (firstAssistant && firstAssistant.content) {
            const detected = detectOptimizationLevel(firstAssistant.content);
            if (detected) {
                setChatLevel(detected);
            }
        }
    }, [messages, chatLevel, chatId]);

    // When library shared IDs load, update message shared flags without refetching messages
    useEffect(() => {
        if (sharedMessageIds.size === 0 || messages.length === 0) return;
        setMessages((prev) =>
            prev.map((m) => {
                const backendId = m.messageId || m.id;
                if (!backendId) return m;
                return { ...m, isShared: sharedMessageIds.has(backendId) };
            })
        );
    }, [sharedMessageIds]);

    // Update chatId when params change
    useEffect(() => {
        const id = params.id as string | undefined;
        // Validate that id is a valid UUID format, not 'new', 'undefined', or 'null'
        const newChatId = id && id !== 'new' && id !== 'undefined' && id !== 'null' 
            ? id 
            : undefined;
        
        // If route has 'undefined', redirect to /chat/new
        if (id === 'undefined' || id === 'null') {
            router.replace('/chat/new');
            return;
        }
        
        // Don't overwrite an existing chatId with undefined when staying on the same page
        if (!newChatId) {
            return;
        }

        if (newChatId !== chatId) {
            setChatId(newChatId);
        }
    }, [params.id, chatId, router]);
    
    useEffect(() => {
        if (chatAreaRef.current) {
            chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
        }
    }, [messages]);

    const handleSendMessage = (content: string) => {
        // Lock in the level for this chat if it's the first message and we don't have a level yet
        // This ensures the level persists for all subsequent messages in this chat
        if (!chatId && !chatLevel && effectiveLevel) {
            setChatLevel(effectiveLevel);
        }
        
        // Add user message to chat optimistically
        const userMsg: Message = {
            id: crypto.randomUUID(),
            role: 'user',
            content,
        };
        setMessages((prev) => [...prev, userMsg]);

        // Check authentication
        if (!user) {
            // Remove the optimistically added message
            setMessages((prev) => prev.slice(0, -1));
            const errorMsg: Message = {
                id: crypto.randomUUID(),
                role: 'assistant',
                content: "Please log in to use the chat feature.",
            };
            setMessages((prev) => [...prev, errorMsg]);
            return;
        }

        optimizeFn(
            {
                user_prompt: content,
                chat_id: chatId || undefined, // Only pass if chatId exists
                user_id: user.user_id
            },
            {
                onSuccess: async (data) => {
                    // Validate chat_id before using it
                    const newChatId = data.chat_id;
                    const isNewChat = !chatId && newChatId && newChatId !== 'undefined' && newChatId !== 'null';

                    if (isNewChat) {
                        setChatId(newChatId);
                        // Preserve current query params (including level) when moving from /chat/new to /chat/{id}
                        const currentSearch = window.location.search || '';
                        const newUrl = currentSearch
                            ? `/chat/${newChatId}${currentSearch}`
                            : `/chat/${newChatId}`;
                        // Use Next.js router so params stay in sync instead of manual history.replaceState
                        router.replace(newUrl);
                        try {
                            const response = await getChatMessages(newChatId);
                            const formattedMessages: Message[] = response.items
                                .reverse()
                                .map((msg: any) => {
                                    const backendId = msg.id as string | undefined;
                                    const isShared = !!backendId && sharedMessageIds.has(backendId);
                                    return {
                                        id: backendId || crypto.randomUUID(),
                                    role: msg.role as 'user' | 'assistant',
                                    content: formatMessage(msg.role, msg.content),
                                        messageId: backendId,
                                        isShared,
                                    };
                                });
                            setMessages(formattedMessages);
                            return; // Exit early since we've loaded messages from backend
                        } catch (error) {
                            logError(error, 'ChatSessionPage.onSuccess.reloadMessages');
                            // Fall through to add message optimistically if reload fails
                        }
                    }

                    const response = data.response as any;
                    let responseContent: string;
                    
                    if (isMasteryLevel) {
                        responseContent = formatMasterLevelResponse(response);
                    } else if (isSystemLevel) {
                        responseContent = formatSystemLevelResponse(response);
                    } else {
                        // Convert response object to JSON string for formatAssistantMessage to parse
                        // formatAssistantMessage handles all the formatting logic including JSON parsing
                        const responseString = typeof response === 'string' 
                            ? response 
                            : JSON.stringify(response);
                        responseContent = formatAssistantMessage(responseString);
                    }

                    const backendId = (data as any).message_id || (data.response as any)?.message_id;
                    const isShared = !!backendId && sharedMessageIds.has(backendId);
                    const aiResponse: Message = {
                        // Prefer backend-provided id so share works; fallback to random UUID
                        id: backendId || crypto.randomUUID(),
                        role: 'assistant',
                        content: responseContent,
                        messageId: backendId, // keep backend id for sharing
                        isShared,
                    };
                    setMessages((prev) => [...prev, aiResponse]);
                },
                onError: (error) => {
                    setMessages((prev) => prev.slice(0, -1));
                    
                    if (error instanceof ApiError) {
                        if (error.statusCode === 403) {
                            const detectedLevel = detectOptimizationLevel(content);
                            setFeatureName(detectedLevel.displayName);
                            setShowUpgradeModal(true);
                            return;
                        }
                        
                        if (error.statusCode === 429) {
                            const detectedLevel = detectOptimizationLevel(content);
                            setFeatureName(detectedLevel.displayName);
                            setShowLimitModal(true);
                            return;
                        }
                    }
                    
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

    const handleShareClick = (promptContent: string, messageId: string) => {
        // Find the message; support both id and messageId just in case
        const message = messages.find(msg => msg.id === messageId || msg.messageId === messageId);
        const shareId = message?.messageId || message?.id;
        if (!shareId) {
            alert('Unable to share: Message ID not found. Please try again.');
            return;
        }
        
        setSharePromptContent(promptContent);
        setShareMessageId(shareId);
        setShowShareModal(true);
    };

    const handleConfirmShare = async () => {
        if (!user || !shareMessageId) return;

        try {
            setIsSharing(true);
            await addToLibrary(user.user_id, shareMessageId);
            // Mark message as shared in local state
            setSharedMessageIds((prev) => {
                const next = new Set(prev);
                next.add(shareMessageId);
                return next;
            });
            setMessages((prev) =>
                prev.map((m) => {
                    const id = m.messageId || m.id;
                    if (id === shareMessageId) {
                        return { ...m, isShared: true };
                    }
                    return m;
                })
            );
            setShowShareModal(false);
            router.push('/library');
        } catch (error: any) {
            console.error('Failed to share prompt:', error);
            alert(error.message || 'Failed to share prompt. Please try again.');
        } finally {
            setIsSharing(false);
        }
    };

    const handleDeleteChat = async () => {
        if (!user || !chatId || chatId === 'new') return;

        try {
            setIsDeleting(true);
            await deleteChat(user.user_id, chatId);
            setShowDeleteModal(false);
            router.push('/chat/new');
        } catch (error: any) {
            console.error('Failed to delete chat:', error);
            alert(error.message || 'Failed to delete chat. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            <UpgradeRequiredModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName={featureName}
            />
            <DailyLimitExceededModal
                isOpen={showLimitModal}
                onClose={() => setShowLimitModal(false)}
                featureName={featureName}
            />
            <SharePromptModal
                isOpen={showShareModal}
                onClose={() => setShowShareModal(false)}
                onConfirm={handleConfirmShare}
                isLoading={isSharing}
            />
            <DeleteChatModal
                isOpen={showDeleteModal}
                onClose={() => setShowDeleteModal(false)}
                onConfirm={handleDeleteChat}
                isLoading={isDeleting}
            />
            <ChatArea 
                messages={messages} 
                isLoading={isPending || isLoadingMessages} 
                ref={chatAreaRef}
                onShare={handleShareClick}
                onGoToLibrary={(messageId: string) =>
                    router.push(`/library?message_id=${encodeURIComponent(messageId)}`)
                }
            />
            <ChatInput onSendMessage={handleSendMessage} isLoading={isPending} />
        </div>
    );
}

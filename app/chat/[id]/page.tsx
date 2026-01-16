"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import ChatArea from '@/shared/components/Chat/ChatArea';
import ChatInput from '@/shared/components/Chat/ChatInput';
import { Message } from '@/shared/types/chat';
import { useAuth } from '@/shared/context/AuthContext';
import { getChatMessages, deleteChat } from '@/shared/api/chat';
import { getMyLibrary, addToLibrary } from '@/shared/api/library';
import { logError } from '@/shared/utils/errorHandler';
import { formatMessage, formatAssistantMessage, formatMasterLevelResponse, formatSystemLevelResponse } from '@/shared/utils/messageFormatter';
import { detectOptimizationLevel, getLevelDisplayName, OPTIMIZATION_LEVELS, OptimizationLevel } from '@/shared/utils/optimizationLevel';
import { generateOptimizationLevelMessage } from '@/shared/utils/optimizationLevelMessage';
import UpgradeRequiredModal from '@/shared/components/Modal/UpgradeRequiredModal';
import DailyLimitExceededModal from '@/shared/components/Modal/DailyLimitExceededModal';
import SharePromptModal from '@/shared/components/Modal/SharePromptModal';
import DeleteChatModal from '@/shared/components/Modal/DeleteChatModal';
import Notification from '@/shared/components/Notification/Notification';
import { createOptimizationSocket, OptimizationLevelKey, formatOptimizationResponse } from '@/shared/services/optimizationSocket';

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
    const { user } = useAuth();
    console.log({user});
    const chatAreaRef = useRef<HTMLDivElement>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const [isStreaming, setIsStreaming] = useState(false);
    const [streamMessageId, setStreamMessageId] = useState<string | null>(null);
    
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
    const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
    
    // Track the previous chatId to detect when we're switching to a different chat
    const prevChatIdRef = useRef<string | undefined>(undefined);
    
    // Helper function to preserve static message when updating messages
    const preserveStaticMessage = (newMessages: Message[]): Message[] => {
        const isNewChat = !chatId || chatId === 'new';
        // Only preserve static message for new chats
        if (!isNewChat) {
            // For existing chats, remove static message if it exists
            return newMessages.filter(msg => msg.id !== 'optimization-level-info');
        }
        
        // For new chats, ensure static message is at the beginning
        if (!optimizationLevel || !user) {
            return newMessages.filter(msg => msg.id !== 'optimization-level-info');
        }
        
        const levelMessage: Message = {
            id: 'optimization-level-info',
            role: 'assistant',
            content: generateOptimizationLevelMessage(optimizationLevel, user.package_name, user.role),
        };
        
        // Remove any existing static messages first to avoid duplicates
        const withoutStatic = newMessages.filter(msg => msg.id !== 'optimization-level-info');
        
        // Add static message at the beginning
        return [levelMessage, ...withoutStatic];
    };
    
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

    // Clean up websocket on unmount
    useEffect(() => {
        return () => {
            if (wsRef.current) {
                wsRef.current.close();
                wsRef.current = null;
            }
        };
    }, []);

    useEffect(() => {
        const isNewChat = !chatId || chatId === 'new';
        const hasLevelMessage = messages.some(msg => msg.id === 'optimization-level-info');
        
        if (isNewChat && !hasLevelMessage && optimizationLevel !== null && user) {
            // Use preserveStaticMessage to ensure no duplicates
            setMessages((prev) => preserveStaticMessage(prev));
        } else if (!isNewChat && hasLevelMessage) {
            // Remove static message when loading existing chats
            setMessages((prev) => prev.filter(msg => msg.id !== 'optimization-level-info'));
        }
    }, [chatId, optimizationLevel, user?.package_name, user]);

    useEffect(() => {
        const loadMessages = async () => {
            // Validate chatId before making the API call
            if (!chatId || chatId === 'new' || chatId === 'undefined' || chatId === 'null') {
                return;
            }

            try {
                setIsLoadingMessages(true);
                const response = await getChatMessages(chatId);
                
                // Determine the optimization level for formatting
                // First try to detect from the first assistant message
                let detectedLevel: OptimizationLevelKey = 'basic';
                const firstAssistant = response.items.find((msg: any) => msg.role === 'assistant');
                if (firstAssistant && firstAssistant.content) {
                    try {
                        const parsed = JSON.parse(firstAssistant.content);
                        if (parsed.overview || parsed.deconstruct || parsed.diagnose || parsed.develop || parsed.deliver) {
                            detectedLevel = 'mastery';
                        } else if (parsed.system_prompt || parsed.key_enhancements || parsed.role || parsed.objective || parsed.audience || parsed.context) {
                            // New system prompt structure or legacy format
                            detectedLevel = 'system';
                        } else if (parsed.techniques_applied || (parsed.optimized_prompt && typeof parsed.optimized_prompt === 'object')) {
                            detectedLevel = 'structured';
                        }
                    } catch {
                        // Not JSON, use level detection
                        const detected = detectOptimizationLevel(firstAssistant.content);
                        if (detected) {
                            detectedLevel = detected.level as OptimizationLevelKey;
                        }
                    }
                }
                
                // Use effective level if available, otherwise use detected level
                const levelKey: OptimizationLevelKey =
                    isStructuredLevel ? 'structured' :
                    isMasteryLevel ? 'mastery' :
                    isSystemLevel ? 'system' :
                    detectedLevel;
                
                const formattedMessages: Message[] = response.items
                    .reverse()
                    .map((msg: any) => {
                        const backendId = msg.id as string | undefined;
                        const isShared = !!backendId && sharedMessageIds.has(backendId);
                        
                        let content = msg.content;
                        
                        // For assistant messages, try to parse and format JSON according to level
                        if (msg.role === 'assistant' && typeof content === 'string') {
                            // Try to parse as JSON
                            try {
                                const parsed = JSON.parse(content);
                                // Auto-detect level if not set, then format
                                let actualLevel = levelKey;
                                if (parsed.overview || parsed.deconstruct || parsed.diagnose || parsed.develop || parsed.deliver) {
                                    actualLevel = 'mastery';
                                } else if (parsed.system_prompt || parsed.key_enhancements || parsed.role || parsed.objective || parsed.audience || parsed.context) {
                                    actualLevel = 'system';
                                } else if (parsed.techniques_applied || (parsed.optimized_prompt && typeof parsed.optimized_prompt === 'object')) {
                                    actualLevel = 'structured';
                                }
                                
                                // Format according to detected level
                                if (actualLevel === 'mastery') {
                                    content = formatMasterLevelResponse(parsed);
                                } else if (actualLevel === 'system') {
                                    content = formatSystemLevelResponse(parsed);
                                } else {
                                    content = formatOptimizationResponse(parsed, actualLevel);
                                }
                            } catch {
                                // Not JSON, use formatMessage as fallback
                                content = formatMessage(msg.role, content);
                            }
                        } else if (msg.role === 'assistant') {
                            // Already an object, format it
                            if (levelKey === 'mastery') {
                                content = formatMasterLevelResponse(content);
                            } else if (levelKey === 'system') {
                                content = formatSystemLevelResponse(content);
                            } else {
                                content = formatOptimizationResponse(content, levelKey);
                            }
                        } else {
                            // User messages - return as-is
                            content = formatMessage(msg.role, content);
                        }
                        
                        return {
                            id: backendId || crypto.randomUUID(),
                        role: msg.role as 'user' | 'assistant',
                            content: content,
                            messageId: backendId,
                            isShared,
                        };
                    });
                // Preserve static message when loading messages
                setMessages(preserveStaticMessage(formattedMessages));
                
                // Detect level from raw content (before formatting) if we don't have a level yet
                // Find the first assistant message in chronological order (before reverse)
                if (!chatLevel && response.items.length > 0) {
                    const firstAssistant = response.items.find((msg: any) => msg.role === 'assistant');
                    if (firstAssistant && firstAssistant.content) {
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

    const handleSendMessage = async (content: string) => {
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
        setMessages((prev) => preserveStaticMessage([...prev, userMsg]));

        // Check authentication
        if (!user) {
            // Remove the optimistically added message
            setMessages((prev) => prev.slice(0, -1));
            setNotification({
                message: "Please log in to use the chat feature.",
                type: 'error'
            });
            return;
        }

        // Close any existing websocket before opening a new one
        if (wsRef.current) {
            wsRef.current.close();
            wsRef.current = null;
        }

        setIsStreaming(true);
        setStreamMessageId(null);

        const levelKey: OptimizationLevelKey =
            isStructuredLevel ? 'structured' :
            isMasteryLevel ? 'mastery' :
            isSystemLevel ? 'system' :
            'basic';

        const socket = createOptimizationSocket({
            level: levelKey,
            userId: user.user_id,
            chatId: chatId || null,
            userPrompt: content,
            callbacks: {
                onToken: (partialText) => {
                    // Don't update UI with partial tokens during streaming
                    // The isLoading prop on ChatArea will show the loading indicator
                    // We'll only update the message when we have the final text
                },
                onCompleted: async (newChatId) => {
                    if (newChatId && newChatId !== 'undefined' && newChatId !== 'null') {
                        const isNewChat = !chatId;
                    if (isNewChat) {
                        setChatId(newChatId);
                        const currentSearch = window.location.search || '';
                        const newUrl = currentSearch
                            ? `/chat/${newChatId}${currentSearch}`
                            : `/chat/${newChatId}`;
                        router.replace(newUrl);
                        }
                        try {
                            const response = await getChatMessages(newChatId);
                            
                            // Determine the optimization level for formatting
                            const levelKey: OptimizationLevelKey =
                                isStructuredLevel ? 'structured' :
                                isMasteryLevel ? 'mastery' :
                                isSystemLevel ? 'system' :
                                'basic';
                            
                            const formattedMessages: Message[] = response.items
                                .reverse()
                                .map((msg: any) => {
                                    const backendId = msg.id as string | undefined;
                                    const isShared = !!backendId && sharedMessageIds.has(backendId);
                                    
                                    let content = msg.content;
                                    
                                    // For assistant messages, try to parse and format JSON according to level
                                    if (msg.role === 'assistant' && typeof content === 'string') {
                                        // Try to parse as JSON
                                        try {
                                            const parsed = JSON.parse(content);
                                            // Auto-detect level from content structure
                                            let actualLevel = levelKey;
                                            if (parsed.overview || parsed.deconstruct || parsed.diagnose || parsed.develop || parsed.deliver) {
                                                actualLevel = 'mastery';
                                            } else if (parsed.system_prompt || parsed.key_enhancements || parsed.role || parsed.objective || parsed.audience || parsed.context) {
                                                actualLevel = 'system';
                                            } else if (parsed.techniques_applied || (parsed.optimized_prompt && typeof parsed.optimized_prompt === 'object')) {
                                                actualLevel = 'structured';
                                            }
                                            
                                            // Format according to detected level
                                            if (actualLevel === 'mastery') {
                                                content = formatMasterLevelResponse(parsed);
                                            } else if (actualLevel === 'system') {
                                                content = formatSystemLevelResponse(parsed);
                                            } else {
                                                content = formatOptimizationResponse(parsed, actualLevel);
                                            }
                                        } catch {
                                            // Not JSON, use formatMessage as fallback
                                            content = formatMessage(msg.role, content);
                                        }
                                    } else if (msg.role === 'assistant') {
                                        // Already an object, auto-detect level and format it
                                        let actualLevel = levelKey;
                                        if (content.overview || content.deconstruct || content.diagnose || content.develop || content.deliver) {
                                            actualLevel = 'mastery';
                                        } else if (content.system_prompt || content.key_enhancements || content.role || content.objective || content.audience || content.context) {
                                            actualLevel = 'system';
                                        } else if (content.techniques_applied || (content.optimized_prompt && typeof content.optimized_prompt === 'object')) {
                                            actualLevel = 'structured';
                                        }
                                        
                                        if (actualLevel === 'mastery') {
                                            content = formatMasterLevelResponse(content);
                                        } else if (actualLevel === 'system') {
                                            content = formatSystemLevelResponse(content);
                                        } else {
                                            content = formatOptimizationResponse(content, actualLevel);
                                        }
                                    } else {
                                        // User messages - return as-is
                                        content = formatMessage(msg.role, content);
                                    }
                                    
                                    return {
                                        id: backendId || crypto.randomUUID(),
                                    role: msg.role as 'user' | 'assistant',
                                        content: content,
                                        messageId: backendId,
                                        isShared,
                                    };
                                });
                            // Preserve static message when reloading after completion
                            setMessages(preserveStaticMessage(formattedMessages));
                        } catch (err) {
                            logError(err, 'ChatSessionPage.ws.completed.reloadMessages');
                        }
                    }
                    setIsStreaming(false);
                },
                onFinalText: (finalText) => {
                    if (!finalText) return;
                    // Update the message with final formatted text
                    setMessages((prev) => {
                        let updated: Message[];
                        if (!streamMessageId) {
                            const newId = crypto.randomUUID();
                            setStreamMessageId(newId);
                            updated = [
                                ...prev,
                                {
                                    id: newId,
                                    role: 'assistant',
                                    content: finalText,
                                },
                            ];
                        } else {
                            updated = prev.map((m) =>
                                m.id === streamMessageId
                                    ? { ...m, content: finalText }
                                    : m
                            );
                        }
                        // Preserve static message
                        return preserveStaticMessage(updated);
                    });
                },
                onError: (messageText) => {
                    setIsStreaming(false);
                    // Remove optimistic user message but preserve static message
                    setMessages((prev) => preserveStaticMessage(prev.slice(0, -1)));
                    // Show error in toast notification instead of chat
                    setNotification({
                        message: messageText || "Sorry, something went wrong while optimizing your prompt. Please try again.",
                        type: 'error'
                    });
                },
                onCancelled: () => {
                    setIsStreaming(false);
                },
            },
        });

        if (!socket) {
            // Socket creation failed (e.g., missing base URL) – revert optimistic user message
            setIsStreaming(false);
            setMessages((prev) => preserveStaticMessage(prev.slice(0, -1)));
            setNotification({
                message: "WebSocket endpoint is not configured. Please contact support.",
                type: 'error'
            });
                            return;
                        }
                        
        wsRef.current = socket;
    };

    const handleShareClick = (promptContent: string, messageId: string) => {
        // Find the message; support both id and messageId just in case
        const message = messages.find(msg => msg.id === messageId || msg.messageId === messageId);
        const shareId = message?.messageId || message?.id;
        if (!shareId) {
            setNotification({
                message: 'Unable to share: Message ID not found. Please try again.',
                type: 'error'
            });
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
            setNotification({
                message: error.message || 'Failed to share prompt. Please try again.',
                type: 'error'
            });
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
            setNotification({
                message: error.message || 'Failed to delete chat. Please try again.',
                type: 'error'
            });
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
            {notification && (
                <Notification
                    message={notification.message}
                    type={notification.type}
                    onClose={() => setNotification(null)}
                />
            )}
            <ChatArea 
                messages={messages} 
                isLoading={isStreaming || isLoadingMessages} 
                ref={chatAreaRef}
                onShare={handleShareClick}
                onGoToLibrary={(messageId: string) =>
                    router.push(`/library?message_id=${encodeURIComponent(messageId)}`)
                }
            />
            <ChatInput onSendMessage={handleSendMessage} isLoading={isStreaming} />
        </div>
    );
}


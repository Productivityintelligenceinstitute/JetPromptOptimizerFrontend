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
import { formatMessage, formatAssistantMessage } from '@/shared/utils/messageFormatter';
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

/**
 * Formats system level response - parses system prompt sections and formats them
 */
function formatSystemLevelResponse(response: any): string {
    const sections: string[] = [];
    
    if (response.system_prompt) {
        const systemPrompt = response.system_prompt;
        const parsedSections: Record<string, string> = {};
        
        const sectionHeaders = [
            'ROLE:', 'OBJECTIVE:', 'CONTEXT:', 'CONSTRAINTS:', 'TASK:', 
            'OUTPUT_FORMAT:', 'QUALITY_RUBRIC:', 'COST_GUARDRAILS:', 'ACCEPTANCE_CRITERIA:'
        ];
        
        for (let i = 0; i < sectionHeaders.length; i++) {
            const header = sectionHeaders[i];
            const nextHeader = i < sectionHeaders.length - 1 ? sectionHeaders[i + 1] : null;
            
            const headerIndex = systemPrompt.indexOf(header);
            if (headerIndex !== -1) {
                const afterHeader = systemPrompt.substring(headerIndex + header.length).trim();
                let content = '';
                
                if (nextHeader) {
                    const nextIndex = systemPrompt.indexOf(nextHeader, headerIndex + header.length);
                    if (nextIndex !== -1) {
                        content = systemPrompt.substring(headerIndex + header.length, nextIndex).trim();
                    } else {
                        content = afterHeader;
                    }
                } else {
                    const keyEnhancementsIndex = systemPrompt.indexOf('Key Enhancements:', headerIndex);
                    if (keyEnhancementsIndex !== -1) {
                        content = systemPrompt.substring(headerIndex + header.length, keyEnhancementsIndex).trim();
                    } else {
                        content = afterHeader;
                    }
                }
                
                if (content) {
                    parsedSections[header.replace(':', '')] = content;
                }
            }
        }
        
        if (Object.keys(parsedSections).length > 0) {
            sections.push('**System Prompt:**\n');
            
            const sectionOrder = ['ROLE', 'OBJECTIVE', 'CONTEXT', 'CONSTRAINTS', 'TASK', 
                                 'OUTPUT_FORMAT', 'QUALITY_RUBRIC', 'COST_GUARDRAILS', 'ACCEPTANCE_CRITERIA'];
            
            const formatSectionName = (name: string): string => {
                return name
                    .split('_')
                    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                    .join(' ');
            };
            
            sectionOrder.forEach(sectionName => {
                if (parsedSections[sectionName]) {
                    const humanReadableName = formatSectionName(sectionName);
                    sections.push(`**${humanReadableName}:**\n${parsedSections[sectionName]}\n`);
                }
            });
        } else {
            sections.push('**System Prompt:**\n');
            let formattedPrompt = response.system_prompt;
            
            const headerMap: Record<string, string> = {
                'ROLE:': '**Role:**',
                'OBJECTIVE:': '**Objective:**',
                'CONTEXT:': '**Context:**',
                'CONSTRAINTS:': '**Constraints:**',
                'TASK:': '**Task:**',
                'OUTPUT_FORMAT:': '**Output Format:**',
                'QUALITY_RUBRIC:': '**Quality Rubric:**',
                'COST_GUARDRAILS:': '**Cost Guardrails:**',
                'ACCEPTANCE_CRITERIA:': '**Acceptance Criteria:**'
            };
            
            Object.keys(headerMap).forEach(oldHeader => {
                formattedPrompt = formattedPrompt.replace(
                    new RegExp(`(^|\\n)\\s*${oldHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'gm'),
                    `$1${headerMap[oldHeader]} `
                );
                formattedPrompt = formattedPrompt.replace(
                    new RegExp(oldHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                    headerMap[oldHeader]
                );
            });
            
            sections.push(formattedPrompt);
            sections.push('');
        }
    }
    
    if (response.key_enhancements) {
        let enhancements: string[] = [];
        
        if (Array.isArray(response.key_enhancements)) {
            enhancements = response.key_enhancements;
        } else if (typeof response.key_enhancements === 'string') {
            try {
                const parsed = JSON.parse(response.key_enhancements);
                if (Array.isArray(parsed)) {
                    enhancements = parsed;
                }
            } catch (e) {
                const trimmed = response.key_enhancements.trim();
                if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                    const arrayContent = trimmed.slice(1, -1).trim();
                    if (arrayContent.length > 0) {
                        const items: string[] = [];
                        let currentItem = '';
                        let inQuotes = false;
                        let quoteChar = '';
                        
                        for (let i = 0; i < arrayContent.length; i++) {
                            const char = arrayContent[i];
                            
                            if ((char === '"' || char === "'") && (i === 0 || arrayContent[i - 1] !== '\\')) {
                                if (!inQuotes) {
                                    inQuotes = true;
                                    quoteChar = char;
                                } else if (char === quoteChar) {
                                    inQuotes = false;
                                    quoteChar = '';
                                }
                                currentItem += char;
                            } else if (char === ',' && !inQuotes) {
                                const trimmedItem = currentItem.trim();
                                if (trimmedItem.length > 0) {
                                    const cleaned = trimmedItem.replace(/^['"]|['"]$/g, '').trim();
                                    if (cleaned.length > 0) {
                                        enhancements.push(cleaned);
                                    }
                                }
                                currentItem = '';
                            } else {
                                currentItem += char;
                            }
                        }
                        
                        if (currentItem.trim().length > 0) {
                            const trimmedItem = currentItem.trim();
                            const cleaned = trimmedItem.replace(/^['"]|['"]$/g, '').trim();
                            if (cleaned.length > 0) {
                                enhancements.push(cleaned);
                            }
                        }
                    }
                }
            }
        }
        
        if (enhancements.length > 0) {
            sections.push('**Key Enhancements:**\n');
            sections.push(enhancements.map((enhancement: string) => `• ${enhancement}`).join('\n'));
            sections.push('');
        }
    }
    
    if (response.platform_tip) {
        sections.push('**Platform Tip:**\n');
        sections.push(response.platform_tip);
        sections.push('');
    }
    
    if (response.compliance_statement) {
        sections.push('**Compliance Statement:**\n');
        sections.push(response.compliance_statement);
    }
    
    return sections.filter(s => s !== '').join('\n');
}

/**
 * Formats master level response - handles questions and final answers
 */
function formatMasterLevelResponse(response: any): string {
    const content = typeof response === 'string' ? response : String(response);
    
    const finalAnswerMatch = content.match(/Final Answer:\s*(\{[\s\S]*\})/);
    if (finalAnswerMatch) {
        try {
            const jsonStr = finalAnswerMatch[1];
            const parsed = JSON.parse(jsonStr);
            
            if (parsed.questions && Array.isArray(parsed.questions)) {
                const formattedQuestions = parsed.questions
                    .map((q: string, index: number) => `${index + 1}. ${q}`)
                    .join('\n');
                
                let formatted = '**Clarification Questions:**\n\n';
                formatted += formattedQuestions;
                formatted += '\n\n';
                
                if (parsed.note) {
                    formatted += `*${parsed.note}*`;
                }
                
                return formatted;
            }
            
            if (parsed.summary && parsed.updated_prompt) {
                let formatted = '';
                if (parsed.summary) {
                    formatted += '**Summary:**\n';
                    formatted += parsed.summary;
                    formatted += '\n\n';
                }
                if (parsed.updated_prompt) {
                    formatted += '**Updated Prompt:**\n';
                    formatted += parsed.updated_prompt;
                    formatted += '\n\n';
                }
                if (parsed.request) {
                    formatted += `*${parsed.request}*`;
                }
                return formatted;
            }
            
            if (parsed.master_prompt) {
                let formatted = '**Master-Level Optimized Prompt:**\n\n';
                formatted += parsed.master_prompt;
                if (parsed.evaluation) {
                    formatted += '\n\n**Evaluation:**\n';
                    formatted += parsed.evaluation;
                }
                if (parsed.note) {
                    formatted += '\n\n';
                    formatted += `*${parsed.note}*`;
                }
                return formatted;
            }
            
            return `**Response:**\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
        } catch (e) {
            return content;
        }
    }
    
    return content;
}

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
    
    const isStructuredLevel = optimizationLevel?.level === 'structured';
    const isMasteryLevel = optimizationLevel?.level === 'mastery';
    const isSystemLevel = optimizationLevel?.level === 'system';
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
    
    // Redirect free users away from structured level chat
    useEffect(() => {
        if (!optimizationLevel || !user) return;
        if (isStructuredLevel && user.package_name === 'free') {
            router.replace('/chat');
        }
    }, [optimizationLevel, isStructuredLevel, user?.package_name, user, router]);

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
            } catch (error) {
                logError(error, 'ChatSessionPage.loadMessages');
                // Don't clear messages on error, just log it
            } finally {
                setIsLoadingMessages(false);
            }
        };

        loadMessages();
    }, [chatId, sharedMessageIds]);

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
                        window.history.replaceState(null, '', `/chat/${newChatId}`);
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

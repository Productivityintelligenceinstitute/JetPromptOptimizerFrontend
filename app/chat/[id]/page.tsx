"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import ChatArea from '@/shared/components/Chat/ChatArea';
import ChatInput from '@/shared/components/Chat/ChatInput';
import { Message } from '@/shared/types/chat';
import { useOptimizePrompt, useOptimizeStructuredPrompt, useOptimizeMasterPrompt, useOptimizeSystemPrompt } from '@/shared/hooks/useChat';
import { useAuth } from '@/shared/context/AuthContext';
import { getChatMessages } from '@/shared/api/chat';
import { logError } from '@/shared/utils/errorHandler';
import { formatMessage } from '@/shared/utils/messageFormatter';
import { ApiError } from '@/shared/types/errors';
import UpgradeRequiredModal from '@/shared/components/Modal/UpgradeRequiredModal';
import DailyLimitExceededModal from '@/shared/components/Modal/DailyLimitExceededModal';
import { detectOptimizationLevel, getLevelDisplayName, OPTIMIZATION_LEVELS, OptimizationLevel } from '@/shared/utils/optimizationLevel';
import { generateOptimizationLevelMessage } from '@/shared/utils/optimizationLevelMessage';

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
    const [messages, setMessages] = useState<Message[]>([]);
    const [isLoadingMessages, setIsLoadingMessages] = useState(false);
    const [chatId, setChatId] = useState<string | undefined>(
        params.id && params.id !== 'new' ? (params.id as string) : undefined
    );
    
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
    const [featureName, setFeatureName] = useState<string>('');
    
    useEffect(() => {
        const isNewChat = !chatId || chatId === 'new';
        const hasLevelMessage = messages.some(msg => msg.id === 'optimization-level-info');
        
        if (isNewChat && !hasLevelMessage && optimizationLevel !== null && user) {
            const levelMessage: Message = {
                id: 'optimization-level-info',
                role: 'assistant',
                content: generateOptimizationLevelMessage(optimizationLevel, user.package_name),
            };
            setMessages([levelMessage]);
        }
    }, [chatId, optimizationLevel, user?.package_name, user]);

    useEffect(() => {
        const loadMessages = async () => {
            if (!chatId || chatId === 'new') {
                return;
            }

            try {
                setIsLoadingMessages(true);
                const response = await getChatMessages(chatId);
                const formattedMessages: Message[] = response.items
                    .reverse()
                    .map((msg) => ({
                        id: crypto.randomUUID(),
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
                    const isNewChat = !chatId && data.chat_id;
                    if (isNewChat) {
                        setChatId(data.chat_id);
                        window.history.replaceState(null, '', `/chat/${data.chat_id}`);
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

                    const response = data.response as any;
                    let responseContent: string;
                    
                    if (isMasteryLevel) {
                        responseContent = formatMasterLevelResponse(response);
                    } else if (isSystemLevel) {
                        responseContent = formatSystemLevelResponse(response);
                    } else {
                        const sections: string[] = [];
                        
                        if (response.share_message) {
                            sections.push(response.share_message);
                            sections.push('');
                        }
                        
                        if (response.optimized_prompt) {
                            sections.push('**Optimized Prompt:**');
                            sections.push(response.optimized_prompt);
                            sections.push('');
                        }
                        
                        if (response.changes_made && Array.isArray(response.changes_made) && response.changes_made.length > 0) {
                            sections.push('**Changes Made:**');
                            sections.push(response.changes_made.map((change: string) => `• ${change}`).join('\n'));
                            sections.push('');
                        }
                        
                        if (isStructuredLevel && response.techniques_applied && Array.isArray(response.techniques_applied) && response.techniques_applied.length > 0) {
                            sections.push('**Techniques Applied:**');
                            sections.push(response.techniques_applied.map((tech: string) => `• ${tech}`).join('\n'));
                            sections.push('');
                        }
                        
                        if (isStructuredLevel && response.pro_tip) {
                            sections.push('**Pro Tip:**');
                            sections.push(response.pro_tip);
                            sections.push('');
                        }
                        
                        responseContent = sections.filter(s => s !== '').join('\n');
                    }

                    const aiResponse: Message = {
                        id: crypto.randomUUID(),
                        role: 'assistant',
                        content: responseContent,
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
            <ChatArea 
                messages={messages} 
                isLoading={isPending || isLoadingMessages} 
                ref={chatAreaRef} 
            />
            <ChatInput onSendMessage={handleSendMessage} isLoading={isPending} />
        </div>
    );
}

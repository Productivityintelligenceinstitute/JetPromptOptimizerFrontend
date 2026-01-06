"use client";
import { forwardRef, useState } from 'react';
import { ChatAreaProps } from '@/shared/types/chat';

const CopyIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
    </svg>
);

const CheckIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 13l4 4L19 7"
        />
    </svg>
);

const ShareIcon = ({ className }: { className?: string }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"
        />
    </svg>
);

/**
 * Extracts the optimized prompt from formatted message content
 */
const extractOptimizedPrompt = (content: string): string => {
    // Try to find "Optimized Prompt:" section
    const optimizedPromptMatch = content.match(/\*\*Optimized Prompt:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/);
    if (optimizedPromptMatch) {
        return optimizedPromptMatch[1].trim();
    }
    
    // Try to find "Updated Prompt:" section (for mastery level)
    const updatedPromptMatch = content.match(/\*\*Updated Prompt:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/);
    if (updatedPromptMatch) {
        return updatedPromptMatch[1].trim();
    }
    
    // Try to find "Master-Level Optimized Prompt:" section
    const masterPromptMatch = content.match(/\*\*Master-Level Optimized Prompt:\*\*\s*\n([\s\S]*?)(?=\n\*\*|$)/);
    if (masterPromptMatch) {
        return masterPromptMatch[1].trim();
    }
    
    // If no specific section found, return the first substantial paragraph
    const lines = content.split('\n').filter(line => line.trim() && !line.trim().startsWith('**'));
    if (lines.length > 0) {
        return lines[0].trim();
    }
    
    // Fallback: return the content itself
    return content.trim();
};

interface ChatAreaWithShareProps extends ChatAreaProps {
    onShare?: (promptContent: string, messageId: string) => void;
    onGoToLibrary?: () => void;
}

const ChatArea = forwardRef<HTMLDivElement, ChatAreaWithShareProps>(
    ({ messages, isLoading, onShare, onGoToLibrary }, ref) => {
    const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);

    const handleCopy = async (content: string, messageId: string) => {
        try {
            await navigator.clipboard.writeText(content);
            setCopiedMessageId(messageId);
            setTimeout(() => {
                setCopiedMessageId(null);
            }, 2000);
        } catch (err) {
            console.error('Failed to copy text:', err);
        }
    };

    const handleShare = (content: string, messageId: string) => {
        if (onShare) {
            const optimizedPrompt = extractOptimizedPrompt(content);
            onShare(optimizedPrompt, messageId);
        }
    };

    return (
        <div ref={ref} className="flex-1 overflow-y-auto p-4">
            <div className="mx-auto max-w-3xl space-y-8">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex gap-4 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        {message.role === 'assistant' && (
                            <div className="relative h-8 w-8 flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-jet-blue flex items-center justify-center text-white text-xs">
                                    Jet
                                </div>
                            </div>
                        )}

                        <div
                            className={`group relative max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                ? 'bg-gray-100 text-gray-900'
                                : 'bg-transparent text-gray-900'
                                }`}
                        >
                            <div className="prose prose-sm max-w-none">
                                {message.content.split('\n').map((line, i, lines) => {
                                    // Skip empty lines
                                    if (!line.trim()) {
                                        return null;
                                    }
                                    
                                    // Check if this is a list item (starts with ✓)
                                    if (line.trim().startsWith('✓')) {
                                        return (
                                            <div key={i} className="mb-1.5 flex items-start gap-2">
                                                <span className="text-green-600 mt-0.5">✓</span>
                                                <span className="text-gray-700">{line.trim().substring(1).trim()}</span>
                                            </div>
                                        );
                                    }
                                    
                                    // Check if this is a section header (starts with ** and ends with **)
                                    if (line.trim().startsWith('**') && line.trim().endsWith('**')) {
                                        const headerText = line.trim().slice(2, -2);
                                        return (
                                            <h3 key={i} className="mt-4 mb-2 text-base font-semibold text-gray-900 first:mt-0">
                                                {headerText}
                                            </h3>
                                        );
                                    }
                                    
                                    // Regular paragraph with bold text support
                                    const parts = line.split(/(\*\*.*?\*\*)/g);
                                    return (
                                        <p key={i} className="mb-2 text-gray-700 last:mb-0">
                                            {parts.map((part, j) => {
                                                if (part.startsWith('**') && part.endsWith('**')) {
                                                    return <strong key={j} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong>;
                                                }
                                                return <span key={j}>{part}</span>;
                                            })}
                                        </p>
                                    );
                                })}
                            </div>
                            
                            {message.role === 'assistant' && (
                                <div className="absolute top-2 right-2 flex items-center gap-1">
                                    {message.isShared ? (
                                        <button
                                            onClick={onGoToLibrary}
                                            className="p-1.5 rounded-md hover:bg-gray-100 text-jet-blue hover:text-jet-blue transition-colors"
                                            title="View in library"
                                            aria-label="View in library"
                                        >
                                            {/* Shared state icon (could be a filled share icon) */}
                                            <ShareIcon className="w-4 h-4" />
                                        </button>
                                    ) : (
                                        onShare && (
                                            <button
                                                onClick={() => handleShare(message.content, message.id)}
                                                className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                                                title="Share to library"
                                                aria-label="Share to library"
                                            >
                                                <ShareIcon className="w-4 h-4" />
                                            </button>
                                        )
                                    )}
                                    <button
                                        onClick={() => handleCopy(message.content, message.id)}
                                        className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors"
                                        title="Copy response"
                                        aria-label="Copy response"
                                    >
                                        {copiedMessageId === message.id ? (
                                            <CheckIcon className="w-4 h-4 text-green-600" />
                                        ) : (
                                            <CopyIcon className="w-4 h-4" />
                                        )}
                                    </button>
                                </div>
                            )}
                        </div>

                        {message.role === 'user' && (
                            <div className="relative h-8 w-8 flex-shrink-0">
                                <div className="h-8 w-8 rounded-full bg-gray-300 flex items-center justify-center text-gray-600 text-xs">
                                    U
                                </div>
                            </div>
                        )}
                    </div>
                ))}

                {/* Loading indicator */}
                {isLoading && (
                    <div className="flex gap-4 justify-start">
                        <div className="relative h-8 w-8 flex-shrink-0">
                            <div className="h-8 w-8 rounded-full bg-jet-blue flex items-center justify-center text-white text-xs">
                                Jet
                            </div>
                        </div>
                        <div className="max-w-[80%] rounded-2xl px-4 py-3 bg-transparent text-gray-900">
                            <div className="flex gap-1">
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                                <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
});

ChatArea.displayName = 'ChatArea';

export default ChatArea;

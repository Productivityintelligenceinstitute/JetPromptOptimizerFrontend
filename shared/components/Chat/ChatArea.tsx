"use client";
import { forwardRef } from 'react';
import { ChatAreaProps } from '@/shared/types/chat';

const ChatArea = forwardRef<HTMLDivElement, ChatAreaProps>(({ messages, isLoading }, ref) => {
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
                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                                ? 'bg-gray-100 text-gray-900'
                                : 'bg-transparent text-gray-900'
                                }`}
                        >
                            <div className="prose prose-sm max-w-none">
                                {message.content.split('\n').map((line, i) => {
                                    // Simple markdown-like bold text support
                                    const parts = line.split(/(\*\*.*?\*\*)/g);
                                    return (
                                        <p key={i} className="mb-2 last:mb-0">
                                            {parts.map((part, j) => {
                                                if (part.startsWith('**') && part.endsWith('**')) {
                                                    return <strong key={j}>{part.slice(2, -2)}</strong>;
                                                }
                                                return part;
                                            })}
                                        </p>
                                    );
                                })}
                            </div>
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

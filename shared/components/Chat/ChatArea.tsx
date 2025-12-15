"use client";
import { ChatAreaProps } from '@/shared/types/chat';

export default function ChatArea({ messages }: ChatAreaProps) {
    return (
        <div className="flex-1 overflow-y-auto p-4">
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
                                {/* Simple rendering for now, can add markdown support later */}
                                {message.content.split('\n').map((line, i) => (
                                    <p key={i} className="mb-2 last:mb-0">{line}</p>
                                ))}
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
            </div>
        </div>
    );
}

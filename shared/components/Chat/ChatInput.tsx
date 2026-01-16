"use client";

import React, { useState, useEffect, useRef } from 'react';
import { SendHorizontal } from '@/shared/components/icons';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    initialValue?: string;
    placeholder?: string;
    isLoading?: boolean;
}

export default function ChatInput({ onSendMessage, initialValue = '', placeholder = "Message Jet...", isLoading = false }: ChatInputProps) {
    const [value, setValue] = useState(initialValue);
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    // Auto-resize textarea
    useEffect(() => {
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
            const scrollHeight = textareaRef.current.scrollHeight;
            // Set max height to ~6 lines (24px line height * 6 = 144px)
            const maxHeight = 144;
            textareaRef.current.style.height = `${Math.min(scrollHeight, maxHeight)}px`;
        }
    }, [value]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSendMessage(value);
        setValue('');
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Shift+Enter: new line
        // Enter: submit (if not Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e);
        }
    };

    return (
        <div className="p-4">
            <div className="mx-auto max-w-3xl">
                <form onSubmit={handleSubmit} className="relative">
                    <textarea
                        ref={textareaRef}
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={placeholder}
                        rows={1}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 pr-12 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-0 text-gray-900 resize-none overflow-y-auto min-h-[56px] max-h-[144px]"
                        style={{ lineHeight: '24px' }}
                    />
                    <button
                        type="submit"
                        disabled={!value.trim() || isLoading}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <SendHorizontal />
                    </button>
                </form>
                <p className="mt-2 text-center text-xs text-gray-400">
                    Jet can make mistakes. Check important info. Press Shift+Enter for new line.
                </p>
            </div>
        </div>
    );
}

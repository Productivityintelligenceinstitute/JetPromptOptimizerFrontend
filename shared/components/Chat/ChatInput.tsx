"use client";

import React, { useState, useEffect } from 'react';
import { SendHorizontal } from '@/shared/components/icons';

interface ChatInputProps {
    onSendMessage: (message: string) => void;
    initialValue?: string;
    placeholder?: string;
}

export default function ChatInput({ onSendMessage, initialValue = '', placeholder = "Message Jet..." }: ChatInputProps) {
    const [value, setValue] = useState(initialValue);

    useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!value.trim()) return;
        onSendMessage(value);
        setValue('');
    };

    return (
        <div className="p-4">
            <div className="mx-auto max-w-3xl">
                <form onSubmit={handleSubmit} className="relative">
                    <input
                        type="text"
                        value={value}
                        onChange={(e) => setValue(e.target.value)}
                        placeholder={placeholder}
                        className="w-full rounded-xl border border-gray-200 bg-white px-4 py-4 pr-12 shadow-sm focus:border-gray-300 focus:outline-none focus:ring-0"
                    />
                    <button
                        type="submit"
                        disabled={!value.trim()}
                        className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg bg-gray-100 p-2 text-gray-500 hover:bg-gray-200 disabled:opacity-50"
                    >
                        <SendHorizontal />
                    </button>
                </form>
                <p className="mt-2 text-center text-xs text-gray-400">
                    Jet can make mistakes. Check important info.
                </p>
            </div>
        </div>
    );
}

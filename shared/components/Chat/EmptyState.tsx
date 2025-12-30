"use client";

import React from 'react';
import Image from 'next/image';

import { EmptyStateProps } from '@/shared/types/chat';

export default function EmptyState({ onSuggestionClick }: EmptyStateProps) {
    const suggestions = [
        {
            title: "Optimize my prompt at a Basic Level",
            subtitle: "Fast Rewrite",
            prompt: "Optimize my prompt at a Basic Level - Fast Rewrite: {Please provide your custom Prompt}"
        },
        {
            title: "Optimize my prompt at a Structured Level",
            subtitle: "Detailed Analysis",
            prompt: "Optimize my prompt at a Structured Level: {Please provide your custom Prompt}"
        },
        {
            title: "Optimize my prompt at a Mastery Level",
            subtitle: "Expert Refinement",
            prompt: "Optimize my prompt at a Mastery Level: {Please provide your custom Prompt}"
        },
        {
            title: "Create and optimize a system prompt",
            subtitle: "Mastery Level for System Prompts",
            prompt: "Create and optimize a system prompt at a Mastery Level for: {Please provide your custom Prompt}"
        }
    ];

    return (
        <div className="flex h-full flex-col items-center justify-center px-4">
            <div className="mb-8 text-center">
                <h1 className="mb-2 text-balance text-3xl font-semibold leading-tight text-jet-blue sm:text-4xl md:text-5xl">Jet Prompt Optimizer</h1>
                <div className="flex items-center justify-center gap-2 text-gray-500">
                    <span>By Gerald Leonard</span>
                    <span className="bg-gray-200 text-xs px-1 rounded">in</span>
                </div>
            </div>

            <p className="mb-12 max-w-2xl text-center text-gray-600">
                Meet Jet, your AI prompt optimizer and reasoning partner. Jet transforms vague ideas into precise, expert-level prompts. It does for AI thinking what grammar checkers did for writing—helping professionals structure, reason, and communicate like true experts.
            </p>

            <div className="grid w-full max-w-4xl grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
                {suggestions.map((suggestion, index) => (
                    <button
                        key={index}
                        onClick={() => onSuggestionClick(suggestion.prompt)}
                        className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 cursor-pointer"
                    >
                        <span className="mb-1 font-medium text-gray-900">{suggestion.title}</span>
                        <span className="text-sm text-gray-500">{suggestion.subtitle}</span>
                    </button>
                ))}
            </div>
        </div>
    );
}

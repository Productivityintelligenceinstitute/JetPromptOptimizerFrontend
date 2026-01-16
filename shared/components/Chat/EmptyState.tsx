"use client";

import React, { useState } from 'react';
import { useAuth } from '@/shared/context/AuthContext';
import { EmptyStateProps } from '@/shared/types/chat';
import UpgradeRequiredModal from '@/shared/components/Modal/UpgradeRequiredModal';
import { detectOptimizationLevel, hasPermissionForLevel } from '@/shared/utils/optimizationLevel';

interface Suggestion {
    title: string;
    subtitle: string;
    prompt: string;
    level: 'basic' | 'structured' | 'mastery' | 'system';
}

export default function EmptyState({ onSuggestionClick }: EmptyStateProps) {
    const { user } = useAuth();
    const [showUpgradeModal, setShowUpgradeModal] = useState(false);
    const [selectedFeature, setSelectedFeature] = useState<string>('');

    const suggestions: Suggestion[] = [
        {
            title: "Optimize my prompt at a Basic Level",
            subtitle: "Fast Rewrite",
            prompt: "Optimize my prompt at a Basic Level - Fast Rewrite: {Please provide your custom Prompt}",
            level: 'basic'
        },
        {
            title: "Optimize my prompt at a Structured Level",
            subtitle: "Detailed Analysis",
            prompt: "Optimize my prompt at a Structured Level: {Please provide your custom Prompt}",
            level: 'structured'
        },
        {
            title: "Optimize my prompt at a Mastery Level",
            subtitle: "Expert Refinement",
            prompt: "Optimize my prompt at a Mastery Level: {Please provide your custom Prompt}",
            level: 'mastery'
        },
        {
            title: "Create and optimize a system prompt",
            subtitle: "Mastery Level for System Prompts",
            prompt: "Create and optimize a system prompt at a Mastery Level for: {Please provide your custom Prompt}",
            level: 'system'
        }
    ];

    const handleSuggestionClick = (suggestion: Suggestion) => {
        // Check if user has permission for this optimization level
        // Admin users have full access to all levels
        const hasPermission = hasPermissionForLevel(user?.package_name, suggestion.level, user?.role);
        
        if (!hasPermission) {
            // Show upgrade modal and don't proceed with navigation
            setSelectedFeature(suggestion.title);
            setShowUpgradeModal(true);
            return;
        }
        
        // User has permission, proceed with the click
        // Pass the level information via the callback
        onSuggestionClick(suggestion.prompt, suggestion.level);
    };

    return (
        <>
            <UpgradeRequiredModal
                isOpen={showUpgradeModal}
                onClose={() => setShowUpgradeModal(false)}
                featureName={selectedFeature}
            />
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
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="flex flex-col items-start rounded-xl border border-gray-200 bg-white p-4 text-left transition-colors hover:bg-gray-50 cursor-pointer"
                        >
                            <span className="mb-1 font-medium text-gray-900">{suggestion.title}</span>
                            <span className="text-sm text-gray-500">{suggestion.subtitle}</span>
                        </button>
                    ))}
                </div>
            </div>
        </>
    );
}

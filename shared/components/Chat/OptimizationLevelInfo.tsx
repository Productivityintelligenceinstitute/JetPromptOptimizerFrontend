"use client";

import React from 'react';
import { OptimizationLevelInfo } from '@/shared/utils/optimizationLevel';
import { useAuth } from '@/shared/context/AuthContext';

interface OptimizationLevelInfoProps {
  levelInfo: OptimizationLevelInfo;
}

const LEVEL_DESCRIPTIONS: Record<string, {
  title: string;
  description: string;
  features: string[];
  icon: string;
}> = {
  basic: {
    title: 'Basic Level Optimization',
    description: 'Fast and efficient prompt refinement for quick improvements',
    features: [
      'Quick grammar and clarity fixes',
      'Basic structure improvements',
      'Fast response time',
      'Perfect for simple prompts'
    ],
    icon: '⚡'
  },
  structured: {
    title: 'Structured Level Optimization',
    description: 'Detailed analysis with enhanced organization and flow',
    features: [
      'Comprehensive structure analysis',
      'Enhanced logical flow',
      'Improved clarity and coherence',
      'Better organization of ideas'
    ],
    icon: '📊'
  },
  mastery: {
    title: 'Mastery Level Optimization',
    description: 'Expert-level refinement with advanced reasoning and precision',
    features: [
      'Expert-level reasoning enhancement',
      'Advanced prompt engineering techniques',
      'Precision-crafted optimizations',
      'Professional-grade output'
    ],
    icon: '🎯'
  },
  system: {
    title: 'System Prompt Optimization',
    description: 'Mastery-level optimization specifically for system prompts',
    features: [
      'Specialized system prompt engineering',
      'Advanced AI behavior shaping',
      'Precision instruction crafting',
      'Expert-level system design'
    ],
    icon: '🔧'
  }
};

export default function OptimizationLevelInfoBanner({ levelInfo }: OptimizationLevelInfoProps) {
  const { user } = useAuth();
  const levelDetails = LEVEL_DESCRIPTIONS[levelInfo.level] || LEVEL_DESCRIPTIONS.basic;
  const packageName = user?.package_name?.toLowerCase() || 'free';

  // Determine query limits based on package and level
  const getQueryLimit = () => {
    if (levelInfo.level === 'basic') {
      if (packageName === 'free') return '5 queries per day';
      return 'Unlimited';
    }
    if (levelInfo.level === 'structured') {
      return 'Unlimited';
    }
    if (levelInfo.level === 'mastery') {
      if (packageName === 'pro') return '50 queries per day';
      return 'Upgrade to Pro';
    }
    if (levelInfo.level === 'system') {
      if (packageName === 'pro') return 'Unlimited';
      return 'Upgrade to Pro';
    }
    return 'Unlimited';
  };

  const queryLimit = getQueryLimit();

  return (
    <div className="mb-4 rounded-lg border border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50 p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 text-2xl">
            {levelDetails.icon}
          </div>
        </div>
        <div className="flex-1">
          <div className="mb-2">
            <h3 className="text-lg font-semibold text-gray-900">
              {levelDetails.title}
            </h3>
            <p className="mt-1 text-sm text-gray-600">
              {levelDetails.description}
            </p>
          </div>
          
          <div className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <svg className="h-4 w-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="font-medium">Query Limit:</span>
              <span className="text-gray-900">{queryLimit}</span>
            </div>
            
            <div className="mt-3">
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-gray-500">
                What You'll Get:
              </p>
              <ul className="space-y-1.5">
                {levelDetails.features.map((feature, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-gray-700">
                    <svg className="mt-0.5 h-4 w-4 flex-shrink-0 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


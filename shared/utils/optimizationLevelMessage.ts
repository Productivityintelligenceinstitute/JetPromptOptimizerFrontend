import { OptimizationLevelInfo } from './optimizationLevel';
import { useAuth } from '@/shared/context/AuthContext';

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

/**
 * Gets the query limit message based on package and level
 * Admin users have unlimited access to all levels
 */
export function getQueryLimitMessage(
  level: string,
  packageName: string | undefined | null,
  userRole?: string | null
): string {
  // Admin users have unlimited access to all levels
  if (userRole === 'admin') {
    return 'Unlimited';
  }
  
  const normalizedPackage = packageName?.toLowerCase() || 'free';
  
  if (level === 'basic') {
    if (normalizedPackage === 'free') return '5 queries per day';
    return 'Unlimited';
  }
  if (level === 'structured') {
    return 'Unlimited';
  }
  if (level === 'mastery') {
    if (normalizedPackage === 'pro') return '50 queries per day';
    return 'Upgrade to Pro';
  }
  if (level === 'system') {
    if (normalizedPackage === 'pro') return 'Unlimited';
    return 'Upgrade to Pro';
  }
  return 'Unlimited';
}

/**
 * Generates a markdown-formatted message about the optimization level
 */
export function generateOptimizationLevelMessage(
  levelInfo: OptimizationLevelInfo,
  packageName: string | undefined | null,
  userRole?: string | null
): string {
  const levelDetails = LEVEL_DESCRIPTIONS[levelInfo.level] || LEVEL_DESCRIPTIONS.basic;
  const queryLimit = getQueryLimitMessage(levelInfo.level, packageName, userRole);

  const message = `**${levelDetails.icon} ${levelDetails.title}**

${levelDetails.description}

**What You'll Get:**

${levelDetails.features.map(feature => `✓ ${feature}`).join('\n')}

I'm ready to help you optimize your prompts at this level. Just share your prompt and I'll enhance it for you!`;

  return message;
}


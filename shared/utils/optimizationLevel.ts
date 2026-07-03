/**
 * Utility functions for detecting and working with optimization levels
 */

export type OptimizationLevel = 'basic' | 'structured' | 'mastery' | 'system';

export interface OptimizationLevelInfo {
  level: OptimizationLevel;
  displayName: string;
  permissionName: string;
  endpoint: string;
}

export const OPTIMIZATION_LEVELS: Record<OptimizationLevel, OptimizationLevelInfo> = {
  basic: {
    level: 'basic',
    displayName: 'Basic Level Optimization',
    permissionName: 'BASIC_OPT',
    endpoint: '/basic-level-optimization',
  },
  structured: {
    level: 'structured',
    displayName: 'Structured Level Optimization',
    permissionName: 'STRUCT_OPT',
    endpoint: '/structured-level-optimization',
  },
  mastery: {
    level: 'mastery',
    displayName: 'Mastery Level Optimization',
    permissionName: 'MASTER_OPT',
    endpoint: '/master-level-optimization',
  },
  system: {
    level: 'system',
    displayName: 'System Prompt Optimization',
    permissionName: 'SYS_OPT',
    endpoint: '/system-level-optimization',
  },
};

/**
 * Detects the optimization level from a prompt string
 * Works with both raw and formatted content
 */
export function detectOptimizationLevel(prompt: string): OptimizationLevelInfo {
  const lowerPrompt = prompt.toLowerCase();
  
  // System level detection
  if (lowerPrompt.includes('system prompt') || lowerPrompt.includes('system-level') || 
      lowerPrompt.includes('**system prompt:**') || lowerPrompt.includes('optimized system prompt')) {
    return OPTIMIZATION_LEVELS.system;
  }
  
  // Mastery level detection - check for multiple patterns
  // Raw content patterns
  if (lowerPrompt.includes('mastery level') || lowerPrompt.includes('master level') || 
      lowerPrompt.includes('master-level') || lowerPrompt.includes('master_level')) {
    return OPTIMIZATION_LEVELS.mastery;
  }
  
  // Formatted content patterns (from formatted messages)
  if (lowerPrompt.includes('clarification questions') || 
      lowerPrompt.includes('final answer:') ||
      lowerPrompt.includes('**master-level optimized prompt:**') ||
      lowerPrompt.includes('**updated prompt:**') ||
      lowerPrompt.includes('**evaluation:**') ||
      lowerPrompt.includes('**exemplar rewrite:**') ||
      // Check for JSON structure that indicates mastery level
      (lowerPrompt.includes('"questions"') && lowerPrompt.includes('"note"')) ||
      (lowerPrompt.includes('"master_prompt"') && lowerPrompt.includes('"evaluation"'))) {
    return OPTIMIZATION_LEVELS.mastery;
  }
  
  // Structured level detection
  if (lowerPrompt.includes('structured level') || lowerPrompt.includes('structured-level') || 
      lowerPrompt.includes('struct') || lowerPrompt.includes('**structured')) {
    return OPTIMIZATION_LEVELS.structured;
  }
  
  // Default to basic
  return OPTIMIZATION_LEVELS.basic;
}

/**
 * Checks if a user has permission for a specific optimization level
 * Based on package permissions:
 * - Admin: Full access to all levels (no restrictions)
 * - Trial: BASIC_OPT (5/day), STRUCT_OPT (1/day), MASTER_OPT (5 total over 14 days)
 * - Essential: BASIC_OPT + STRUCT_OPT (unlimited)
 * - Pro: All levels (MASTER_OPT 50/day, SYS_OPT unlimited)
 * - Free / no subscription: No access (must subscribe)
 */
export function hasPermissionForLevel(
  packageName: string | undefined | null,
  level: OptimizationLevel,
  userRole?: string | null
): boolean {
  // Admin users have full access to all optimization levels
  if (userRole === 'admin') {
    return true;
  }
  
  const normalizedPackage = packageName?.toLowerCase() || 'free';
  
  // No access for free / no subscription
  if (normalizedPackage === 'free' || !packageName) {
    return level === 'basic'; // Basic only if backend assigns free (legacy)
  }
  
  // Basic level is available to all plans
  if (level === 'basic') {
    return true;
  }
  
  // Structured level: Trial (1/day), Essential, Pro
  if (level === 'structured') {
    return ['trial', 'essential', 'pro'].includes(normalizedPackage);
  }
  
  // Mastery: Trial (5 total over trial), Pro (50/day)
  if (level === 'mastery') {
    return normalizedPackage === 'pro' || normalizedPackage === 'trial';
  }
  
  // System level: Pro only
  if (level === 'system') {
    return normalizedPackage === 'pro';
  }
  
  return false;
}

/**
 * Gets the display name for an optimization level
 */
export function getLevelDisplayName(level: OptimizationLevel | string): string {
  const normalizedLevel = level.toLowerCase() as OptimizationLevel;
  return OPTIMIZATION_LEVELS[normalizedLevel]?.displayName || 'Optimization';
}


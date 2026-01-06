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
 */
export function detectOptimizationLevel(prompt: string): OptimizationLevelInfo {
  const lowerPrompt = prompt.toLowerCase();
  
  if (lowerPrompt.includes('system prompt') || lowerPrompt.includes('system-level')) {
    return OPTIMIZATION_LEVELS.system;
  }
  
  if (lowerPrompt.includes('mastery level') || lowerPrompt.includes('master level') || lowerPrompt.includes('master-level')) {
    return OPTIMIZATION_LEVELS.mastery;
  }
  
  if (lowerPrompt.includes('structured level') || lowerPrompt.includes('structured-level') || lowerPrompt.includes('struct')) {
    return OPTIMIZATION_LEVELS.structured;
  }
  
  // Default to basic
  return OPTIMIZATION_LEVELS.basic;
}

/**
 * Checks if a user has permission for a specific optimization level
 * Based on package permissions:
 * - Admin: Full access to all levels (no restrictions)
 * - Free: Only BASIC_OPT (5 queries/day)
 * - Essential: BASIC_OPT (unlimited) + STRUCT_OPT (unlimited)
 * - Pro: All levels (MASTER_OPT has 50/day limit, others unlimited)
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
  
  // Basic level is available to all plans
  if (level === 'basic') {
    return true;
  }
  
  // Structured level is available to Essential and Pro
  if (level === 'structured') {
    return normalizedPackage !== 'free';
  }
  
  // Mastery and System levels are only available to Pro
  if (level === 'mastery' || level === 'system') {
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


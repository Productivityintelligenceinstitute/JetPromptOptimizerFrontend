/**
 * Utility functions for formatting chat messages
 */

/**
 * Checks if a value is empty or null
 */
const isEmpty = (value: string): boolean => {
    if (!value) return true;
    const trimmed = value.trim();
    return trimmed === '' || 
           trimmed === 'null' || 
           trimmed === 'None' || 
           trimmed === '[]' ||
           trimmed.match(/^\s*\[\s*\]\s*$/) !== null;
};

/**
 * Parses assistant message content and formats it nicely
 * Only includes sections that have actual data
 */
export const formatAssistantMessage = (content: string): string => {
    if (!content || typeof content !== 'string') {
        return content || '';
    }

    // Try to parse structured format (from basic level optimization)
    // Format: "Optimized Prompt:\n {prompt}\n\n Changes made:\n {changes}\n\n Share message:\n {share}"
    
    const sections: string[] = [];
    
    // Split content by section headers to handle empty sections
    // Extract Optimized Prompt
    const optimizedPromptIndex = content.indexOf('Optimized Prompt:');
    if (optimizedPromptIndex !== -1) {
        const afterOptimized = content.substring(optimizedPromptIndex + 'Optimized Prompt:'.length);
        const changesIndex = afterOptimized.indexOf('Changes made:');
        const shareIndex = afterOptimized.indexOf('Share message:');
        
        let promptEnd = afterOptimized.length;
        if (changesIndex !== -1 && (shareIndex === -1 || changesIndex < shareIndex)) {
            promptEnd = changesIndex;
        } else if (shareIndex !== -1) {
            promptEnd = shareIndex;
        }
        
        const prompt = afterOptimized.substring(0, promptEnd).trim();
        if (!isEmpty(prompt)) {
            sections.push(`**Optimized Prompt:**\n${prompt}`);
        }
    }
    
    // Extract Changes made
    const changesIndex = content.indexOf('Changes made:');
    if (changesIndex !== -1) {
        const afterChanges = content.substring(changesIndex + 'Changes made:'.length);
        const shareIndex = afterChanges.indexOf('Share message:');
        
        const changesEnd = shareIndex !== -1 ? shareIndex : afterChanges.length;
        const changes = afterChanges.substring(0, changesEnd).trim();
        
        if (!isEmpty(changes)) {
            // Try to parse as array or keep as is
            let formattedChanges = changes;
            
            // Check if it looks like an array (starts with [ and ends with ])
            if (changes.trim().startsWith('[') && changes.trim().endsWith(']')) {
                // Extract array content - handle Python-style arrays with single quotes
                const arrayContent = changes.trim().slice(1, -1).trim();
                
                if (arrayContent.length > 0) {
                    // Split by comma, but be careful with commas inside quotes
                    const items: string[] = [];
                    let currentItem = '';
                    let inQuotes = false;
                    let quoteChar = '';
                    
                    for (let i = 0; i < arrayContent.length; i++) {
                        const char = arrayContent[i];
                        
                        if ((char === '"' || char === "'") && (i === 0 || arrayContent[i - 1] !== '\\')) {
                            if (!inQuotes) {
                                inQuotes = true;
                                quoteChar = char;
                            } else if (char === quoteChar) {
                                inQuotes = false;
                                quoteChar = '';
                            }
                            currentItem += char;
                        } else if (char === ',' && !inQuotes) {
                            // End of item
                            const trimmed = currentItem.trim();
                            if (trimmed.length > 0) {
                                // Remove surrounding quotes
                                const cleaned = trimmed.replace(/^['"]|['"]$/g, '').trim();
                                if (cleaned.length > 0) {
                                    items.push(cleaned);
                                }
                            }
                            currentItem = '';
                        } else {
                            currentItem += char;
                        }
                    }
                    
                    // Add last item
                    if (currentItem.trim().length > 0) {
                        const trimmed = currentItem.trim();
                        const cleaned = trimmed.replace(/^['"]|['"]$/g, '').trim();
                        if (cleaned.length > 0) {
                            items.push(cleaned);
                        }
                    }
                    
                    if (items.length > 0) {
                        formattedChanges = items.map((change: string) => `• ${change}`).join('\n');
                        sections.push(`**Changes Made:**\n${formattedChanges}`);
                    }
                }
            } else {
                // If it's not an array format, use as is
                sections.push(`**Changes Made:**\n${formattedChanges}`);
            }
        }
    }
    
    // Extract Share message
    const shareIndex = content.indexOf('Share message:');
    if (shareIndex !== -1) {
        const shareMessage = content.substring(shareIndex + 'Share message:'.length).trim();
        if (!isEmpty(shareMessage)) {
            sections.push(shareMessage);
        }
    }
    
    // If no sections were found, check for other formats (system level, structured level, etc.)
    if (sections.length === 0) {
        // Try system level format - use [\s\S] instead of . with s flag
        const systemPromptIndex = content.indexOf('System Prompt:');
        if (systemPromptIndex !== -1) {
            const afterSystem = content.substring(systemPromptIndex + 'System Prompt:'.length);
            const nextSection = Math.min(
                afterSystem.indexOf('\n\n') !== -1 ? afterSystem.indexOf('\n\n') : afterSystem.length,
                afterSystem.length
            );
            const systemPrompt = afterSystem.substring(0, nextSection).trim();
            if (!isEmpty(systemPrompt)) {
                sections.push(`**System Prompt:**\n${systemPrompt}`);
            }
        }
        
        const enhancementsIndex = content.indexOf('Key Enhancements:');
        if (enhancementsIndex !== -1) {
            const afterEnhancements = content.substring(enhancementsIndex + 'Key Enhancements:'.length);
            const platformIndex = afterEnhancements.indexOf('Platform Tip:');
            const nextSection = platformIndex !== -1 ? platformIndex : afterEnhancements.indexOf('\n\n');
            const enhancementsEnd = nextSection !== -1 ? nextSection : afterEnhancements.length;
            const enhancements = afterEnhancements.substring(0, enhancementsEnd).trim();
            if (!isEmpty(enhancements)) {
                sections.push(`**Key Enhancements:**\n${enhancements}`);
            }
        }
        
        const platformTipIndex = content.indexOf('Platform Tip:');
        if (platformTipIndex !== -1) {
            const afterPlatform = content.substring(platformTipIndex + 'Platform Tip:'.length);
            const complianceIndex = afterPlatform.indexOf('Compliance Statement:');
            const nextSection = complianceIndex !== -1 ? complianceIndex : afterPlatform.indexOf('\n\n');
            const platformEnd = nextSection !== -1 ? nextSection : afterPlatform.length;
            const platformTip = afterPlatform.substring(0, platformEnd).trim();
            if (!isEmpty(platformTip)) {
                sections.push(`**Platform Tip:**\n${platformTip}`);
            }
        }
        
        const complianceIndex = content.indexOf('Compliance Statement:');
        if (complianceIndex !== -1) {
            const compliance = content.substring(complianceIndex + 'Compliance Statement:'.length).trim();
            if (!isEmpty(compliance)) {
                sections.push(`**Compliance Statement:**\n${compliance}`);
            }
        }
        
        // Try structured level format
        const techniquesIndex = content.indexOf('Techniques Applied:');
        if (techniquesIndex !== -1) {
            const afterTechniques = content.substring(techniquesIndex + 'Techniques Applied:'.length);
            const proTipIndex = afterTechniques.indexOf('Pro Tip:');
            const nextSection = proTipIndex !== -1 ? proTipIndex : afterTechniques.indexOf('\n\n');
            const techniquesEnd = nextSection !== -1 ? nextSection : afterTechniques.length;
            const techniques = afterTechniques.substring(0, techniquesEnd).trim();
            if (!isEmpty(techniques)) {
                sections.push(`**Techniques Applied:**\n${techniques}`);
            }
        }
        
        const proTipIndex = content.indexOf('Pro Tip:');
        if (proTipIndex !== -1) {
            const afterProTip = content.substring(proTipIndex + 'Pro Tip:'.length);
            const shareIndex = afterProTip.indexOf('Share message:');
            const nextSection = shareIndex !== -1 ? shareIndex : afterProTip.indexOf('\n\n');
            const proTipEnd = nextSection !== -1 ? nextSection : afterProTip.length;
            const proTip = afterProTip.substring(0, proTipEnd).trim();
            if (!isEmpty(proTip)) {
                sections.push(`**Pro Tip:**\n${proTip}`);
            }
        }
    }
    
    // If still no sections found, return original content (might be plain text or different format)
    if (sections.length === 0) {
        return content.trim();
    }
    
    return sections.join('\n\n');
};

/**
 * Formats a message based on its role
 */
export const formatMessage = (role: string, content: string): string => {
    if (role === 'assistant') {
        return formatAssistantMessage(content);
    }
    return content; // User messages are returned as-is
};


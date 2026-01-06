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
/**
 * Formats master level response - handles questions and final answers
 */
function formatMasterLevelResponse(content: string): string {
    const finalAnswerMatch = content.match(/Final Answer:\s*(\{[\s\S]*\})/);
    if (finalAnswerMatch) {
        try {
            const jsonStr = finalAnswerMatch[1];
            const parsed = JSON.parse(jsonStr);
            
            if (parsed.questions && Array.isArray(parsed.questions)) {
                const formattedQuestions = parsed.questions
                    .map((q: string, index: number) => `${index + 1}. ${q}`)
                    .join('\n');
                
                let formatted = '**Clarification Questions:**\n\n';
                formatted += formattedQuestions;
                formatted += '\n\n';
                
                if (parsed.note) {
                    formatted += `*${parsed.note}*`;
                }
                
                return formatted;
            }
            
            if (parsed.summary && parsed.updated_prompt) {
                let formatted = '';
                if (parsed.summary) {
                    formatted += '**Summary:**\n';
                    formatted += parsed.summary;
                    formatted += '\n\n';
                }
                if (parsed.updated_prompt) {
                    formatted += '**Updated Prompt:**\n';
                    formatted += parsed.updated_prompt;
                    formatted += '\n\n';
                }
                if (parsed.request) {
                    formatted += `*${parsed.request}*`;
                }
                return formatted;
            }
            
            if (parsed.master_prompt) {
                let formatted = '**Master-Level Optimized Prompt:**\n\n';
                formatted += parsed.master_prompt;
                if (parsed.evaluation) {
                    formatted += '\n\n**Evaluation:**\n';
                    formatted += parsed.evaluation;
                }
                if (parsed.note) {
                    formatted += '\n\n';
                    formatted += `*${parsed.note}*`;
                }
                return formatted;
            }
            
            return `**Response:**\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
        } catch (e) {
            return content;
        }
    }
    
    return content;
}

export const formatAssistantMessage = (content: string): string => {
    if (!content || typeof content !== 'string') {
        return content || '';
    }

    if (content.includes('Final Answer:')) {
        return formatMasterLevelResponse(content);
    }

    const systemPromptHeaders = ['ROLE:', 'OBJECTIVE:', 'CONTEXT:', 'CONSTRAINTS:', 'TASK:', 
                                 'OUTPUT_FORMAT:', 'QUALITY_RUBRIC:', 'COST_GUARDRAILS:', 'ACCEPTANCE_CRITERIA:'];
    const hasSystemPromptHeaders = systemPromptHeaders.some(header => content.includes(header));

    try {
        const parsed = JSON.parse(content);
        if (typeof parsed === 'object' && parsed !== null) {
            const sections: string[] = [];
            
            if (parsed.system_prompt) {
                const systemPrompt = parsed.system_prompt;
                const parsedSections: Record<string, string> = {};
                
                const sectionHeaders = [
                    'ROLE:', 'OBJECTIVE:', 'CONTEXT:', 'CONSTRAINTS:', 'TASK:', 
                    'OUTPUT_FORMAT:', 'QUALITY_RUBRIC:', 'COST_GUARDRAILS:', 'ACCEPTANCE_CRITERIA:'
                ];
                
                for (let i = 0; i < sectionHeaders.length; i++) {
                    const header = sectionHeaders[i];
                    const nextHeader = i < sectionHeaders.length - 1 ? sectionHeaders[i + 1] : null;
                    
                    const headerIndex = systemPrompt.indexOf(header);
                    if (headerIndex !== -1) {
                        const afterHeader = systemPrompt.substring(headerIndex + header.length).trim();
                        const nextIndex = nextHeader ? systemPrompt.indexOf(nextHeader, headerIndex + header.length) : -1;
                        const content = nextIndex !== -1 
                            ? afterHeader.substring(0, systemPrompt.indexOf(nextHeader, headerIndex + header.length) - (headerIndex + header.length)).trim()
                            : afterHeader.trim();
                        
                        if (content) {
                            parsedSections[header.replace(':', '')] = content;
                        }
                    }
                }
                
                if (Object.keys(parsedSections).length > 0) {
                    sections.push('**System Prompt:**\n');
                    
                    const sectionOrder = ['ROLE', 'OBJECTIVE', 'CONTEXT', 'CONSTRAINTS', 'TASK', 
                                         'OUTPUT_FORMAT', 'QUALITY_RUBRIC', 'COST_GUARDRAILS', 'ACCEPTANCE_CRITERIA'];
                    
                    const formatSectionName = (name: string): string => {
                        return name
                            .split('_')
                            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
                            .join(' ');
                    };
                    
                    sectionOrder.forEach(sectionName => {
                        if (parsedSections[sectionName]) {
                            const humanReadableName = formatSectionName(sectionName);
                            sections.push(`**${humanReadableName}:**\n${parsedSections[sectionName]}\n`);
                        }
                    });
                } else {
                    let formattedPrompt = parsed.system_prompt;
                    
                    const headerMap: Record<string, string> = {
                        'ROLE:': '**Role:**',
                        'OBJECTIVE:': '**Objective:**',
                        'CONTEXT:': '**Context:**',
                        'CONSTRAINTS:': '**Constraints:**',
                        'TASK:': '**Task:**',
                        'OUTPUT_FORMAT:': '**Output Format:**',
                        'QUALITY_RUBRIC:': '**Quality Rubric:**',
                        'COST_GUARDRAILS:': '**Cost Guardrails:**',
                        'ACCEPTANCE_CRITERIA:': '**Acceptance Criteria:**'
                    };
                    
                    Object.keys(headerMap).forEach(oldHeader => {
                        formattedPrompt = formattedPrompt.replace(
                            new RegExp(`(^|\\n)\\s*${oldHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'gm'),
                            `$1${headerMap[oldHeader]} `
                        );
                        formattedPrompt = formattedPrompt.replace(
                            new RegExp(oldHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                            headerMap[oldHeader]
                        );
                    });
                    
                    sections.push(`**System Prompt:**\n${formattedPrompt}`);
                }
                
                if (parsed.key_enhancements) {
                    let enhancements: string[] = [];
                    if (Array.isArray(parsed.key_enhancements)) {
                        enhancements = parsed.key_enhancements;
                    } else if (typeof parsed.key_enhancements === 'string') {
                        try {
                            const parsedEnh = JSON.parse(parsed.key_enhancements);
                            if (Array.isArray(parsedEnh)) {
                                enhancements = parsedEnh;
                            }
                        } catch (e) {
                            const trimmed = parsed.key_enhancements.trim();
                            if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                                const arrayContent = trimmed.slice(1, -1).trim();
                                if (arrayContent.length > 0) {
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
                                            const trimmedItem = currentItem.trim();
                                            if (trimmedItem.length > 0) {
                                                const cleaned = trimmedItem.replace(/^['"]|['"]$/g, '').trim();
                                                if (cleaned.length > 0) {
                                                    enhancements.push(cleaned);
                                                }
                                            }
                                            currentItem = '';
                                        } else {
                                            currentItem += char;
                                        }
                            }
                            
                            if (currentItem.trim().length > 0) {
                                        const trimmedItem = currentItem.trim();
                                        const cleaned = trimmedItem.replace(/^['"]|['"]$/g, '').trim();
                                        if (cleaned.length > 0) {
                                            enhancements.push(cleaned);
                                        }
                                    }
                                }
                            }
                        }
                    }
                    if (enhancements.length > 0) {
                        sections.push(`**Key Enhancements:**\n${enhancements.map((enhancement: string) => `• ${enhancement}`).join('\n')}`);
                    }
                }
                
                if (parsed.platform_tip) {
                    sections.push(`**Platform Tip:**\n${parsed.platform_tip}`);
                }
                
                if (parsed.compliance_statement) {
                    sections.push(`**Compliance Statement:**\n${parsed.compliance_statement}`);
                }
                
                if (sections.length > 0) {
                    return sections.join('\n\n');
                }
            }
            
            if (parsed.optimized_prompt) {
                sections.push(`**Optimized Prompt:**\n${parsed.optimized_prompt}`);
            }
            
            if (parsed.changes_made && Array.isArray(parsed.changes_made) && parsed.changes_made.length > 0) {
                sections.push(`**Changes Made:**\n${parsed.changes_made.map((change: string) => `• ${change}`).join('\n')}`);
            }
            
            if (parsed.techniques_applied && Array.isArray(parsed.techniques_applied) && parsed.techniques_applied.length > 0) {
                sections.push(`**Techniques Applied:**\n${parsed.techniques_applied.map((tech: string) => `• ${tech}`).join('\n')}`);
            }
            
            if (parsed.pro_tip) {
                sections.push(`**Pro Tip:**\n${parsed.pro_tip}`);
            }
            
            if (parsed.share_message) {
                sections.push(parsed.share_message);
            }
            
            if (sections.length > 0) {
                return sections.join('\n\n');
            }
        }
    } catch (e) {
        if (hasSystemPromptHeaders && !content.trim().startsWith('{')) {
            let formattedContent = content;
            const headerMap: Record<string, string> = {
                'ROLE:': '**Role:**',
                'OBJECTIVE:': '**Objective:**',
                'CONTEXT:': '**Context:**',
                'CONSTRAINTS:': '**Constraints:**',
                'TASK:': '**Task:**',
                'OUTPUT_FORMAT:': '**Output Format:**',
                'QUALITY_RUBRIC:': '**Quality Rubric:**',
                'COST_GUARDRAILS:': '**Cost Guardrails:**',
                'ACCEPTANCE_CRITERIA:': '**Acceptance Criteria:**'
            };
            
            Object.keys(headerMap).forEach(oldHeader => {
                formattedContent = formattedContent.replace(
                    new RegExp(`(^|\\n)\\s*${oldHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'gm'),
                    `$1${headerMap[oldHeader]} `
                );
                formattedContent = formattedContent.replace(
                    new RegExp(oldHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g'),
                    headerMap[oldHeader]
                );
            });
            
            const keyEnhancementsMatch = formattedContent.match(/Key Enhancements:\s*(\[[^\]]+\])/i);
            if (keyEnhancementsMatch) {
                const arrayString = keyEnhancementsMatch[1];
                let enhancements: string[] = [];
                
                try {
                    const parsed = JSON.parse(arrayString);
                    if (Array.isArray(parsed)) {
                        enhancements = parsed;
                    }
                } catch (e) {
                    const trimmed = arrayString.trim();
                    if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
                        const arrayContent = trimmed.slice(1, -1).trim();
                        if (arrayContent.length > 0) {
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
                                    const trimmedItem = currentItem.trim();
                                    if (trimmedItem.length > 0) {
                                        const cleaned = trimmedItem.replace(/^['"]|['"]$/g, '').trim();
                                        if (cleaned.length > 0) {
                                            enhancements.push(cleaned);
                                        }
                                    }
                                    currentItem = '';
                                } else {
                                    currentItem += char;
                                }
                            }
                            
                            if (currentItem.trim().length > 0) {
                                const trimmedItem = currentItem.trim();
                                const cleaned = trimmedItem.replace(/^['"]|['"]$/g, '').trim();
                                if (cleaned.length > 0) {
                                    enhancements.push(cleaned);
                                }
                            }
                        }
                    }
                }
                
                if (enhancements.length > 0) {
                    const formattedEnhancements = enhancements.map((enhancement: string) => `• ${enhancement}`).join('\n');
                    formattedContent = formattedContent.replace(
                        /Key Enhancements:\s*\[[^\]]+\]/i,
                        `**Key Enhancements:**\n${formattedEnhancements}`
                    );
                }
            }
            
            return formattedContent;
        }
    }

    const sections: string[] = [];
    
    const optimizedPromptIndex = content.indexOf('Optimized Prompt:');
    if (optimizedPromptIndex !== -1) {
        const afterOptimized = content.substring(optimizedPromptIndex + 'Optimized Prompt:'.length);
        // Backend uses "Changes Made:" and "Share Message:"
        const changesIndex = afterOptimized.indexOf('Changes Made:');
        const techniquesIndex = afterOptimized.indexOf('Techniques Applied:');
        const proTipIndex = afterOptimized.indexOf('Pro Tip:');
        const shareIndex = afterOptimized.indexOf('Share Message:');
        
        const nextSectionIndices = [changesIndex, techniquesIndex, proTipIndex, shareIndex].filter(idx => idx !== -1);
        const promptEnd = nextSectionIndices.length > 0 ? Math.min(...nextSectionIndices) : afterOptimized.length;
        
        const rawPrompt = afterOptimized.substring(0, promptEnd).trim();
        if (!isEmpty(rawPrompt)) {
            let formattedPrompt = rawPrompt;

            // Special handling for unified prompt-schema style optimized prompts
            // Example: [{'role': '...', 'objective': '...', 'context': '...', 'task': '...', 'constraints': '...'}]
            const unifiedLike = rawPrompt.trim().startsWith('[{') && rawPrompt.trim().endsWith('}]');
            if (unifiedLike) {
                const extractField = (key: string): string | undefined => {
                    // Match `'key': 'value'` where value is up to the next `'some_other_key':` or end of object
                    const regex = new RegExp(`'${key}'\\s*:\\s*'([\\s\\S]*?)'(?=,\\s*'\\w+'\\s*:|'}\\])`);
                    const match = rawPrompt.match(regex);
                    return match ? match[1] : undefined;
                };

                const role = extractField('role');
                const objective = extractField('objective');
                const contextText = extractField('context');
                const task = extractField('task');
                const constraints = extractField('constraints');

                const parts: string[] = [];
                if (role) {
                    parts.push(`**Role:** ${role}`);
                }
                if (objective) {
                    parts.push(`**Objective:** ${objective}`);
                }
                if (contextText) {
                    parts.push(`**Context:** ${contextText}`);
                }
                if (task) {
                    parts.push(`**Task:** ${task}`);
                }
                if (constraints) {
                    parts.push(`**Constraints:** ${constraints}`);
                }

                if (parts.length > 0) {
                    formattedPrompt = parts.join('\n\n');
                }
            }

            sections.push(`**Optimized Prompt:**\n${formattedPrompt}`);
        }
    }
    
    const changesIndex = content.indexOf('Changes Made:');
    if (changesIndex !== -1) {
        const afterChanges = content.substring(changesIndex + 'Changes Made:'.length);
        const techniquesIndex = afterChanges.indexOf('Techniques Applied:');
        const proTipIndex = afterChanges.indexOf('Pro Tip:');
        const shareIndex = afterChanges.indexOf('Share Message:');
        
        const nextSectionIndices = [techniquesIndex, proTipIndex, shareIndex].filter(idx => idx !== -1);
        const changesEnd = nextSectionIndices.length > 0 ? Math.min(...nextSectionIndices) : afterChanges.length;
        
        const changes = afterChanges.substring(0, changesEnd).trim();
        
        if (!isEmpty(changes)) {
            let formattedChanges = changes;
            
            if (changes.trim().startsWith('[') && changes.trim().endsWith(']')) {
                const arrayContent = changes.trim().slice(1, -1).trim();
                
                if (arrayContent.length > 0) {
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
    
    const techniquesIndex = content.indexOf('Techniques Applied:');
    if (techniquesIndex !== -1) {
        const afterTechniques = content.substring(techniquesIndex + 'Techniques Applied:'.length);
        const proTipIndex = afterTechniques.indexOf('Pro Tip:');
        const shareIndex = afterTechniques.indexOf('Share Message:');
        
        // Find the earliest next section
        const nextSectionIndices = [proTipIndex, shareIndex].filter(idx => idx !== -1);
        const techniquesEnd = nextSectionIndices.length > 0 ? Math.min(...nextSectionIndices) : afterTechniques.length;
        
        const techniques = afterTechniques.substring(0, techniquesEnd).trim();
        
        if (!isEmpty(techniques)) {
            let formattedTechniques = techniques;
            
            if (techniques.trim().startsWith('[') && techniques.trim().endsWith(']')) {
                const arrayContent = techniques.trim().slice(1, -1).trim();
                
                if (arrayContent.length > 0) {
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
                            const trimmed = currentItem.trim();
                            if (trimmed.length > 0) {
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
                            
                            if (currentItem.trim().length > 0) {
                        const trimmed = currentItem.trim();
                        const cleaned = trimmed.replace(/^['"]|['"]$/g, '').trim();
                        if (cleaned.length > 0) {
                            items.push(cleaned);
                        }
                    }
                    
                    if (items.length > 0) {
                        formattedTechniques = items.map((tech: string) => `• ${tech}`).join('\n');
                        sections.push(`**Techniques Applied:**\n${formattedTechniques}`);
                    }
                }
            } else {
                // If it's not an array format, use as is
                sections.push(`**Techniques Applied:**\n${formattedTechniques}`);
            }
        }
    }
    
    const proTipIndex = content.indexOf('Pro Tip:');
    if (proTipIndex !== -1) {
        const afterProTip = content.substring(proTipIndex + 'Pro Tip:'.length);
        const shareIndex = afterProTip.indexOf('Share Message:');
        
        const proTipEnd = shareIndex !== -1 ? shareIndex : afterProTip.length;
        const proTip = afterProTip.substring(0, proTipEnd).trim();
        
        if (!isEmpty(proTip)) {
            sections.push(`**Pro Tip:**\n${proTip}`);
        }
    }
    
    const shareIndex = content.indexOf('Share Message:');
    if (shareIndex !== -1) {
        const shareMessage = content.substring(shareIndex + 'Share Message:'.length).trim();
        if (!isEmpty(shareMessage)) {
            sections.push(shareMessage);
        }
    }
    
    if (sections.length === 0) {
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
            const complianceIndex = afterEnhancements.indexOf('Compliance Statement:');
            const nextSectionIndices = [platformIndex, complianceIndex].filter(idx => idx !== -1);
            const enhancementsEnd = nextSectionIndices.length > 0 ? Math.min(...nextSectionIndices) : afterEnhancements.length;
            const enhancements = afterEnhancements.substring(0, enhancementsEnd).trim();
            
            if (!isEmpty(enhancements)) {
                // Try to parse as array string
                let formattedEnhancements = enhancements;
                if (enhancements.trim().startsWith('[') && enhancements.trim().endsWith(']')) {
                    const arrayContent = enhancements.trim().slice(1, -1).trim();
                    if (arrayContent.length > 0) {
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
                                const trimmed = currentItem.trim();
                                if (trimmed.length > 0) {
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
                            
                            if (currentItem.trim().length > 0) {
                            const trimmed = currentItem.trim();
                            const cleaned = trimmed.replace(/^['"]|['"]$/g, '').trim();
                            if (cleaned.length > 0) {
                                items.push(cleaned);
                            }
                        }
                        
                        if (items.length > 0) {
                            formattedEnhancements = items.map((item: string) => `• ${item}`).join('\n');
                        }
                    }
                }
                
                sections.push(`**Key Enhancements:**\n${formattedEnhancements}`);
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
    }
    
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


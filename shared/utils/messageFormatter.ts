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
 * Dynamically formats any object or array structure recursively
 * Handles nested objects, arrays, and primitive values
 */
function formatDynamicValue(value: any, indent: number = 0): string {
    const indentStr = '  '.repeat(indent);
    
    if (value === null || value === undefined) {
        return 'null';
    }
    
    if (typeof value === 'string') {
        return value;
    }
    
    if (typeof value === 'number' || typeof value === 'boolean') {
        return String(value);
    }
    
    if (Array.isArray(value)) {
        if (value.length === 0) {
            return '';
        }
        
        // Check if array contains simple strings/numbers
        if (value.every(item => typeof item === 'string' || typeof item === 'number' || typeof item === 'boolean')) {
            return value.map(item => `${indentStr}• ${item}`).join('\n');
        }
        
        // Array contains objects or complex structures
        return value.map((item, index) => {
            const formatted = formatDynamicValue(item, indent + 1);
            return `${indentStr}${index + 1}. ${formatted}`;
        }).join('\n');
    }
    
    if (typeof value === 'object') {
        const entries = Object.entries(value);
        if (entries.length === 0) {
            return '';
        }
        
        return entries.map(([key, val]) => {
            const formattedKey = key.split('_').map(word => 
                word.charAt(0).toUpperCase() + word.slice(1)
            ).join(' ');
            
            if (Array.isArray(val)) {
                if (val.length === 0) {
                    return '';
                }
                // Special handling for arrays with [score, reason] format
                if (val.length === 2 && typeof val[0] === 'string' && typeof val[1] === 'string') {
                    return `${indentStr}**${formattedKey}:** ${val[0]} - ${val[1]}`;
                }
                // Array of strings
                if (val.every(item => typeof item === 'string')) {
                    const items = val.map(item => `${indentStr}  • ${item}`).join('\n');
                    return `${indentStr}**${formattedKey}:**\n${items}`;
                }
                // Complex array
                const items = val.map((item, idx) => {
                    const formatted = formatDynamicValue(item, indent + 1);
                    return `${indentStr}  ${idx + 1}. ${formatted}`;
                }).join('\n');
                return `${indentStr}**${formattedKey}:**\n${items}`;
            }
            
            if (typeof val === 'object' && val !== null) {
                const nested = formatDynamicValue(val, indent + 1);
                return `${indentStr}**${formattedKey}:**\n${nested}`;
            }
            
            // Primitive value (string, number, boolean)
            if (typeof val === 'string' && val.length > 100) {
                // For long strings (like exemplar_rewrite), preserve line breaks
                const lines = val.split('\n').map(line => line.trim()).filter(line => line);
                if (lines.length > 1) {
                    return `${indentStr}**${formattedKey}:**\n${lines.map(line => `${indentStr}  ${line}`).join('\n')}`;
                }
            }
            return `${indentStr}**${formattedKey}:** ${val}`;
        }).filter(line => line.trim()).join('\n');
    }
    
    return String(value);
}

/**
 * Parses assistant message content and formats it nicely
 * Only includes sections that have actual data
 */
/**
 * Formats master level response - handles questions and final answers
 * Can handle both string responses (with "Final Answer:") and direct JSON objects
 */
export function formatMasterLevelResponse(content: string | any): string {
    // If content is already an object, use it directly
    let parsed: any = null;
    let contentStr = '';
    
    if (typeof content === 'object' && content !== null) {
        // Direct JSON object from API
        parsed = content;
    } else {
        // String response - try to extract JSON from "Final Answer:" or parse as JSON
        contentStr = typeof content === 'string' ? content : String(content);
        
        const finalAnswerMatch = contentStr.match(/Final Answer:\s*(\{[\s\S]*\})/);
        if (finalAnswerMatch) {
            try {
                const jsonStr = finalAnswerMatch[1];
                parsed = JSON.parse(jsonStr);
            } catch (e) {
                // If parsing fails, try parsing the whole content as JSON
                try {
                    parsed = JSON.parse(contentStr);
                } catch {
                    return contentStr;
                }
            }
        } else {
            // No "Final Answer:" prefix - try parsing the whole content as JSON
            try {
                parsed = JSON.parse(contentStr);
            } catch {
                // Not valid JSON, return as-is
                return contentStr;
            }
        }
    }
    
    if (parsed) {
        try {
            
            if (parsed.questions && Array.isArray(parsed.questions)) {
                const formattedQuestions = parsed.questions
                    .map((q: string, index: number) => {
                        // Check if question already starts with a number pattern (e.g., "1. ", "2. ", etc.)
                        const numberPattern = /^\d+\.\s*/;
                        if (numberPattern.test(q.trim())) {
                            // Question already has a number, use it as-is
                            return q.trim();
                        }
                        // Question doesn't have a number, add one
                        return `${index + 1}. ${q.trim()}`;
                    })
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
                
                // Handle master_prompt as object or string
                if (typeof parsed.master_prompt === 'object' && parsed.master_prompt !== null) {
                    const mp = parsed.master_prompt;
                    if (mp.role) formatted += `**Role:**\n${mp.role}\n\n`;
                    if (mp.objective) formatted += `**Objective:**\n${mp.objective}\n\n`;
                    if (mp.context) formatted += `**Context:**\n${mp.context}\n\n`;
                    if (mp.constraints) {
                        // Format constraints with better readability
                        const constraints = mp.constraints;
                        // Check if it contains comma-separated items
                        if (constraints.includes(',') && constraints.split(',').length > 2) {
                            formatted += `**Constraints:**\n`;
                            constraints.split(',').forEach((constraint: string) => {
                                const trimmed = constraint.trim();
                                if (trimmed) formatted += `• ${trimmed}\n`;
                            });
                            formatted += '\n';
                        } else {
                            formatted += `**Constraints:**\n${constraints}\n\n`;
                        }
                    }
                    if (mp.task) formatted += `**Task:**\n${mp.task}\n\n`;
                    if (mp.output_format) formatted += `**Output Format:**\n${mp.output_format}\n\n`;
                    if (mp.quality_rubric) formatted += `**Quality Rubric:**\n${mp.quality_rubric}\n\n`;
                    if (mp.cost_guardrails) formatted += `**Cost Guardrails:**\n${mp.cost_guardrails}\n\n`;
                    if (mp.acceptance_criteria) formatted += `**Acceptance Criteria:**\n${mp.acceptance_criteria}\n\n`;
                } else if (typeof parsed.master_prompt === 'string') {
                    formatted += parsed.master_prompt;
                }
                
                if (parsed.evaluation) {
                    formatted += '\n\n**Evaluation:**\n\n';
                    
                    // Handle evaluation as object or string
                    if (typeof parsed.evaluation === 'object' && parsed.evaluation !== null) {
                        // Use dynamic formatter to handle any structure
                        const formattedEval = formatDynamicValue(parsed.evaluation, 0);
                        if (formattedEval) {
                            formatted += formattedEval;
                        } else {
                            // Fallback: if dynamic formatter returns empty, try to stringify
                            formatted += JSON.stringify(parsed.evaluation, null, 2);
                        }
                    } else if (typeof parsed.evaluation === 'string') {
                        // Check if string contains [object Object] - try to extract from raw content
                        if (parsed.evaluation.includes('[object Object]')) {
                            // Try to extract and parse evaluation JSON from the original content
                            const evalMatch = contentStr.match(/"evaluation"\s*:\s*(\{[\s\S]*?\})(?:\s*[,}])/);
                            if (evalMatch) {
                                try {
                                    const evalObj = JSON.parse(evalMatch[1]);
                                    const formattedEval = formatDynamicValue(evalObj, 0);
                                    if (formattedEval) {
                                        formatted += formattedEval;
                                    } else {
                                        formatted += parsed.evaluation;
                                    }
                                } catch {
                                    formatted += parsed.evaluation;
                                }
                            } else {
                                formatted += parsed.evaluation;
                            }
                        } else {
                            formatted += parsed.evaluation;
                        }
                    } else {
                        // Handle other types (number, boolean, etc.)
                        formatted += String(parsed.evaluation);
                    }
                }
                
                if (parsed.note) {
                    formatted += '\n\n';
                    formatted += `*${parsed.note}*`;
                }
                return formatted;
            }
            
            // Handle simple responses with just a note
            if (parsed.note && Object.keys(parsed).length === 1) {
                return `*${parsed.note}*`;
            }
            
            return `**Response:**\n\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``;
        } catch (e) {
            return contentStr || (typeof content === 'string' ? content : JSON.stringify(content));
        }
    }
    
    return contentStr || (typeof content === 'string' ? content : JSON.stringify(content));
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
            // Handle simple note-only responses
            if (parsed.note && Object.keys(parsed).length === 1) {
                return `*${parsed.note}*`;
            }
            
            // Handle master_prompt if present (even without "Final Answer:" prefix)
            if (parsed.master_prompt) {
                let formatted = '**Master-Level Optimized Prompt:**\n\n';
                
                // Handle master_prompt as object or string
                if (typeof parsed.master_prompt === 'object' && parsed.master_prompt !== null) {
                    const mp = parsed.master_prompt;
                    if (mp.role) formatted += `**Role:**\n${mp.role}\n\n`;
                    if (mp.objective) formatted += `**Objective:**\n${mp.objective}\n\n`;
                    if (mp.context) formatted += `**Context:**\n${mp.context}\n\n`;
                    if (mp.constraints) {
                        const constraints = mp.constraints;
                        if (constraints.includes(',') && constraints.split(',').length > 2) {
                            formatted += `**Constraints:**\n`;
                            constraints.split(',').forEach((constraint: string) => {
                                const trimmed = constraint.trim();
                                if (trimmed) formatted += `• ${trimmed}\n`;
                            });
                            formatted += '\n';
                        } else {
                            formatted += `**Constraints:**\n${constraints}\n\n`;
                        }
                    }
                    if (mp.task) formatted += `**Task:**\n${mp.task}\n\n`;
                    if (mp.output_format) formatted += `**Output Format:**\n${mp.output_format}\n\n`;
                    if (mp.quality_rubric) formatted += `**Quality Rubric:**\n${mp.quality_rubric}\n\n`;
                    if (mp.cost_guardrails) formatted += `**Cost Guardrails:**\n${mp.cost_guardrails}\n\n`;
                    if (mp.acceptance_criteria) formatted += `**Acceptance Criteria:**\n${mp.acceptance_criteria}\n\n`;
                } else if (typeof parsed.master_prompt === 'string') {
                    formatted += parsed.master_prompt;
                }
                
                if (parsed.evaluation) {
                    formatted += '\n\n**Evaluation:**\n\n';
                    
                    // Handle evaluation as object or string
                    if (typeof parsed.evaluation === 'object' && parsed.evaluation !== null) {
                        // Use dynamic formatter to handle any structure
                        const formattedEval = formatDynamicValue(parsed.evaluation, 0);
                        if (formattedEval) {
                            formatted += formattedEval;
                        } else {
                            // Fallback: if dynamic formatter returns empty, try to stringify
                            formatted += JSON.stringify(parsed.evaluation, null, 2);
                        }
                    } else if (typeof parsed.evaluation === 'string') {
                        // Check if string contains [object Object] - try to extract from raw content
                        if (parsed.evaluation.includes('[object Object]')) {
                            // Try to extract and parse evaluation JSON from the original content
                            const evalMatch = contentStr.match(/"evaluation"\s*:\s*(\{[\s\S]*?\})(?:\s*[,}])/);
                            if (evalMatch) {
                                try {
                                    const evalObj = JSON.parse(evalMatch[1]);
                                    const formattedEval = formatDynamicValue(evalObj, 0);
                                    if (formattedEval) {
                                        formatted += formattedEval;
                                    } else {
                                        formatted += parsed.evaluation;
                                    }
                                } catch {
                                    formatted += parsed.evaluation;
                                }
                            } else {
                                formatted += parsed.evaluation;
                            }
                        } else {
                            formatted += parsed.evaluation;
                        }
                    } else {
                        // Handle other types (number, boolean, etc.)
                        formatted += String(parsed.evaluation);
                    }
                }
                
                if (parsed.note) {
                    formatted += '\n\n';
                    formatted += `*${parsed.note}*`;
                }
                
                return formatted;
            }
            
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
 * Formats system level response - parses system prompt sections and formats them properly
 */
export const formatSystemLevelResponse = (response: any): string => {
    const sections: string[] = [];
    
    // Handle case where response might be a string or an object
    let systemPrompt: string = '';
    let keyEnhancements: any = null;
    let platformTip: string = '';
    let complianceStatement: string = '';
    
    if (typeof response === 'string') {
        // Try to parse as JSON
        try {
            const parsed = JSON.parse(response);
            systemPrompt = parsed.system_prompt || '';
            keyEnhancements = parsed.key_enhancements;
            platformTip = parsed.platform_tip || '';
            complianceStatement = parsed.compliance_statement || '';
        } catch {
            // If not JSON, treat as system_prompt string
            systemPrompt = response;
        }
    } else if (response && typeof response === 'object') {
        systemPrompt = response.system_prompt || '';
        keyEnhancements = response.key_enhancements;
        platformTip = response.platform_tip || '';
        complianceStatement = response.compliance_statement || '';
    }
    
    if (systemPrompt) {
        const parsedSections: Record<string, string> = {};
        
        const sectionHeaders = [
            'ROLE:', 'OBJECTIVE:', 'CONTEXT:', 'CONSTRAINTS:', 'TASK:', 
            'OUTPUT_FORMAT:', 'QUALITY_RUBRIC:', 'COST_GUARDRAILS:', 'ACCEPTANCE_CRITERIA:'
        ];
        
        // Check if system_prompt already has markdown headers (like **Role:**)
        // Also check for plain headers (like ROLE:) that might be in the text
        const hasMarkdownHeaders = systemPrompt.includes('**Role:**') || systemPrompt.includes('**Objective:**') || 
                                   systemPrompt.match(/\*\*[A-Z][a-z]+(?: [A-Z][a-z]+)?:\*\*/);
        const hasPlainHeaders = systemPrompt.match(/\b(ROLE|OBJECTIVE|CONTEXT|CONSTRAINTS|TASK|OUTPUT_FORMAT|QUALITY_RUBRIC|COST_GUARDRAILS|ACCEPTANCE_CRITERIA):/i);
        
        if (hasMarkdownHeaders || hasPlainHeaders) {
            // Parse markdown-formatted sections using regex to split by all headers at once
            const markdownHeaderMap: Record<string, string> = {
                '**Role:**': 'ROLE',
                '**Objective:**': 'OBJECTIVE',
                '**Context:**': 'CONTEXT',
                '**Constraints:**': 'CONSTRAINTS',
                '**Task:**': 'TASK',
                '**Output Format:**': 'OUTPUT_FORMAT',
                '**Quality Rubric:**': 'QUALITY_RUBRIC',
                '**Cost Guardrails:**': 'COST_GUARDRAILS',
                '**Acceptance Criteria:**': 'ACCEPTANCE_CRITERIA'
            };
            
            // Create a regex pattern to match all headers
            const headerPattern = new RegExp(
                `(${Object.keys(markdownHeaderMap).map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
                'g'
            );
            
            // Find all header positions
            const matches: Array<{ header: string; index: number }> = [];
            let match;
            while ((match = headerPattern.exec(systemPrompt)) !== null) {
                matches.push({ header: match[0], index: match.index });
            }
            
            // Extract content for each section
            for (let i = 0; i < matches.length; i++) {
                const currentMatch = matches[i];
                const nextMatch = matches[i + 1];
                
                const contentStart = currentMatch.index + currentMatch.header.length;
                let contentEnd = nextMatch ? nextMatch.index : systemPrompt.length;
                
                // Also check for Key Enhancements, Platform Tip, or Compliance Statement
                const remainingText = systemPrompt.substring(contentStart);
                const keyEnhancementsIndex = remainingText.toLowerCase().indexOf('**key enhancements:**');
                const platformTipIndex = remainingText.toLowerCase().indexOf('**platform tip:**');
                const complianceIndex = remainingText.toLowerCase().indexOf('**compliance statement:**');
                
                const endIndex = Math.min(
                    keyEnhancementsIndex !== -1 ? contentStart + keyEnhancementsIndex : Infinity,
                    platformTipIndex !== -1 ? contentStart + platformTipIndex : Infinity,
                    complianceIndex !== -1 ? contentStart + complianceIndex : Infinity,
                    contentEnd
                );
                
                let content = systemPrompt.substring(contentStart, endIndex).trim();
                
                // Remove any markdown headers that might be at the start or end
                content = content.replace(/^\*\*[^*]+\*\*:\s*/, '').trim();
                content = content.replace(/\s*\*\*[^*]+\*\*:\s*$/, '').trim();
                // Remove any markdown headers embedded in the middle
                content = content.replace(/\*\*[^*]+\*\*:\s*/g, '').trim();
                
                if (content && markdownHeaderMap[currentMatch.header]) {
                    const sectionKey = markdownHeaderMap[currentMatch.header];
                    parsedSections[sectionKey] = content;
                }
            }
        } else {
            // Parse plain text headers
            for (let i = 0; i < sectionHeaders.length; i++) {
                const header = sectionHeaders[i];
                const nextHeader = i < sectionHeaders.length - 1 ? sectionHeaders[i + 1] : null;
                
                const headerRegex = new RegExp(`\\b${header.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
                const headerMatch = systemPrompt.match(headerRegex);
                
                if (headerMatch && headerMatch.index !== undefined) {
                    const headerIndex = headerMatch.index;
                    const afterHeader = systemPrompt.substring(headerIndex + headerMatch[0].length).trim();
                    let content = '';
                    
                    if (nextHeader) {
                        const nextHeaderRegex = new RegExp(`\\b${nextHeader.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*`, 'i');
                        const nextMatch = systemPrompt.substring(headerIndex + headerMatch[0].length).match(nextHeaderRegex);
                        if (nextMatch && nextMatch.index !== undefined) {
                            content = systemPrompt.substring(headerIndex + headerMatch[0].length, headerIndex + headerMatch[0].length + nextMatch.index).trim();
                        } else {
                            content = afterHeader;
                        }
                    } else {
                        // For the last section, look for common ending markers
                        const keyEnhancementsIndex = systemPrompt.toLowerCase().indexOf('key enhancements:', headerIndex);
                        const platformTipIndex = systemPrompt.toLowerCase().indexOf('platform tip:', headerIndex);
                        const complianceIndex = systemPrompt.toLowerCase().indexOf('compliance statement:', headerIndex);
                        
                        const endIndex = Math.min(
                            keyEnhancementsIndex !== -1 ? keyEnhancementsIndex : Infinity,
                            platformTipIndex !== -1 ? platformTipIndex : Infinity,
                            complianceIndex !== -1 ? complianceIndex : Infinity
                        );
                        
                        if (endIndex !== Infinity) {
                            content = systemPrompt.substring(headerIndex + headerMatch[0].length, endIndex).trim();
                        } else {
                            content = afterHeader;
                        }
                    }
                    
                    if (content) {
                        parsedSections[header.replace(':', '')] = content;
                    }
                }
            }
        }
        
        // If we didn't parse any sections, try a more aggressive approach
        // Split by markdown headers directly
        if (Object.keys(parsedSections).length === 0 && hasMarkdownHeaders) {
            const markdownHeaderMap: Record<string, string> = {
                '**Role:**': 'ROLE',
                '**Objective:**': 'OBJECTIVE',
                '**Context:**': 'CONTEXT',
                '**Constraints:**': 'CONSTRAINTS',
                '**Task:**': 'TASK',
                '**Output Format:**': 'OUTPUT_FORMAT',
                '**Quality Rubric:**': 'QUALITY_RUBRIC',
                '**Cost Guardrails:**': 'COST_GUARDRAILS',
                '**Acceptance Criteria:**': 'ACCEPTANCE_CRITERIA'
            };
            
            // Try splitting by headers more aggressively
            const headerPattern = new RegExp(
                `(${Object.keys(markdownHeaderMap).map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')).join('|')})`,
                'gi'
            );
            
            const parts = systemPrompt.split(headerPattern).filter(p => p.trim().length > 0);
            
            for (let i = 0; i < parts.length; i += 2) {
                const header = parts[i];
                const content = parts[i + 1] || '';
                
                if (markdownHeaderMap[header] && content.trim()) {
                    parsedSections[markdownHeaderMap[header]] = content.trim();
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
            
            sectionOrder.forEach((sectionName, index) => {
                if (parsedSections[sectionName]) {
                    const humanReadableName = formatSectionName(sectionName);
                    let content = parsedSections[sectionName].trim();
                    
                    // Remove any existing markdown formatting from content
                    content = content.replace(/^\*\*[^*]+\*\*:\s*/, '');
                    // Remove any trailing markdown headers that might have been captured
                    content = content.replace(/\s*\*\*[^*]+\*\*:\s*$/, '');
                    // Remove any markdown headers that might be embedded in the content
                    content = content.replace(/\*\*[^*]+\*\*:\s*/g, '');
                    
                    // Format content with proper line breaks and indentation
                    let formattedContent = '';
                    
                    // Check if content contains semicolons (likely a list)
                    const hasSemicolons = content.includes(';');
                    
                    if (hasSemicolons) {
                        // Split by semicolons and format as bulleted list
                        const parts = content
                            .split(';')
                            .map(p => p.trim())
                            .filter(p => p.length > 0 && !p.match(/^\*\*/)); // Filter out any stray headers
                        
                        if (parts.length > 1) {
                            formattedContent = parts
                                .map((part: string) => {
                                    let trimmed = part.trim();
                                    // Remove leading "and" or "or" if present
                                    trimmed = trimmed.replace(/^(and|or)\s+/i, '');
                                    // Remove any markdown headers that might be in the content
                                    trimmed = trimmed.replace(/\*\*[^*]+\*\*:\s*/g, '');
                                    // Capitalize first letter if needed
                                    if (trimmed.length > 0 && !trimmed[0].match(/[A-Z]/)) {
                                        trimmed = trimmed.charAt(0).toUpperCase() + trimmed.slice(1);
                                    }
                                    // Ensure it ends with proper punctuation
                                    if (!trimmed.match(/[.!?]$/)) {
                                        trimmed = trimmed + '.';
                                    }
                                    return `  • ${trimmed}`;
                                })
                                .join('\n');
                        } else {
                            formattedContent = content;
                        }
                    } else {
                        // Single paragraph - use as is
                        formattedContent = content;
                    }
                    
                    // Header on one line, content on the next line
                    // Add double newline before each section except the first one for proper paragraph separation
                    if (index > 0) {
                        sections.push(`\n\n**${humanReadableName}:**\n${formattedContent}`);
                    } else {
                        sections.push(`**${humanReadableName}:**\n${formattedContent}`);
                    }
                }
            });
        }
    }
    
    // Handle key enhancements
    if (keyEnhancements) {
        let enhancements: string[] = [];
        
        if (Array.isArray(keyEnhancements)) {
            enhancements = keyEnhancements;
        } else if (typeof keyEnhancements === 'string') {
            try {
                const parsed = JSON.parse(keyEnhancements);
                if (Array.isArray(parsed)) {
                    enhancements = parsed;
                }
            } catch (e) {
                const trimmed = keyEnhancements.trim();
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
            sections.push('**Key Enhancements:**\n');
            sections.push(enhancements.map((enhancement: string) => `  • ${enhancement}`).join('\n'));
            sections.push('');
        }
    }
    
    if (platformTip) {
        sections.push('**Platform Tip:**\n');
        sections.push(`  ${platformTip}`);
        sections.push('');
    }
    
    if (complianceStatement) {
        sections.push('**Compliance Statement:**\n');
        sections.push(`  ${complianceStatement}`);
    }
    
    // Join sections with newlines - blank lines are already added between sections
    return sections.join('\n');
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


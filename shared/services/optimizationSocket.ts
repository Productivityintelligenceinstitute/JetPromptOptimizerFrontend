import { Message } from '@/shared/types/chat';
import { formatMessage, formatAssistantMessage, formatMasterLevelResponse, formatSystemLevelResponse } from '@/shared/utils/messageFormatter';
import { logError } from '@/shared/utils/errorHandler';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL;

/**
 * Generates the standard share message for all optimization levels
 */
function getShareMessage(): string {
  return `---

**💡 Want to share or reuse this prompt?**

👉 **[Share this Prompt →](https://www.jetpromptoptimizer.ai)**

*Jet helps professionals write, reason, and communicate better with AI.*`;
}

/**
 * Formats JSON according to backend's expected structure for each optimization level.
 * Matches the backend formatters: format_basic_opt_response, format_structure_opt_response, format_system_opt_response
 */
export function formatOptimizationResponse(parsed: any, level: OptimizationLevelKey): string {
  if (!parsed || typeof parsed !== 'object') {
    return formatAssistantMessage(JSON.stringify(parsed));
  }

  let formatted = '';

  // Basic Level Format (matches format_basic_opt_response)
  if (level === 'basic') {
    const sections: string[] = [];
    
    if (parsed.optimized_prompt && String(parsed.optimized_prompt).trim()) {
      sections.push(`**Optimized Prompt:**\n${parsed.optimized_prompt}`);
    }
    if (parsed.changes_made && Array.isArray(parsed.changes_made) && parsed.changes_made.length > 0) {
      const changes = parsed.changes_made.filter((c: any) => c && String(c).trim()).map((change: string) => `• ${change}`).join('\n');
      if (changes) {
        sections.push(`**Changes Made:**\n${changes}`);
      }
    }
    if (parsed.share_message && String(parsed.share_message).trim()) {
      sections.push(`**Share Message:**\n${parsed.share_message}`);
    }
    
    // If no sections, return fallback
    if (sections.length === 0) {
      return formatAssistantMessage(JSON.stringify(parsed));
    }
    
    return sections.join('\n\n');
  }

  // Structured Level Format (matches format_structure_opt_response)
  if (level === 'structured') {
    const sections: string[] = [];
    
    if (parsed.optimized_prompt) {
      let optContent = '';
      
      // Handle array of objects (backend format)
      if (Array.isArray(parsed.optimized_prompt) && parsed.optimized_prompt.length > 0) {
        const optParts: string[] = [];
        // Process each object in the array
        parsed.optimized_prompt.forEach((opt: any, index: number) => {
          if (typeof opt === 'object' && opt !== null) {
            // Add separator if multiple prompts
            if (index > 0) optParts.push('');
            
            if (opt.role && String(opt.role).trim()) optParts.push(`**Role:** ${opt.role}`);
            if (opt.objective && String(opt.objective).trim()) optParts.push(`**Objective:** ${opt.objective}`);
            if (opt.context && String(opt.context).trim()) optParts.push(`**Context:** ${opt.context}`);
            if (opt.task && Array.isArray(opt.task) && opt.task.length > 0) {
              const tasks = opt.task.filter((t: any) => t && String(t).trim()).map((t: string) => `• ${t}`).join('\n');
              if (tasks) optParts.push(`**Task:**\n${tasks}`);
            } else if (opt.task && String(opt.task).trim()) {
              optParts.push(`**Task:** ${opt.task}`);
            }
            if (opt.constraints && Array.isArray(opt.constraints) && opt.constraints.length > 0) {
              const constraints = opt.constraints.filter((c: any) => c && String(c).trim()).map((c: string) => `• ${c}`).join('\n');
              if (constraints) optParts.push(`**Constraints:**\n${constraints}`);
            } else if (opt.constraints && String(opt.constraints).trim()) {
              optParts.push(`**Constraints:** ${opt.constraints}`);
            }
          }
        });
        optContent = optParts.join('\n');
      } 
      // Handle single object
      else if (typeof parsed.optimized_prompt === 'object' && parsed.optimized_prompt !== null && !Array.isArray(parsed.optimized_prompt)) {
        const opt = parsed.optimized_prompt;
        const optParts: string[] = [];
        if (opt.role && String(opt.role).trim()) optParts.push(`**Role:** ${opt.role}`);
        if (opt.objective && String(opt.objective).trim()) optParts.push(`**Objective:** ${opt.objective}`);
        if (opt.context && String(opt.context).trim()) optParts.push(`**Context:** ${opt.context}`);
        if (opt.task && Array.isArray(opt.task) && opt.task.length > 0) {
          const tasks = opt.task.filter((t: any) => t && String(t).trim()).map((t: string) => `• ${t}`).join('\n');
          if (tasks) optParts.push(`**Task:**\n${tasks}`);
        } else if (opt.task && String(opt.task).trim()) {
          optParts.push(`**Task:** ${opt.task}`);
        }
        if (opt.constraints && Array.isArray(opt.constraints) && opt.constraints.length > 0) {
          const constraints = opt.constraints.filter((c: any) => c && String(c).trim()).map((c: string) => `• ${c}`).join('\n');
          if (constraints) optParts.push(`**Constraints:**\n${constraints}`);
        } else if (opt.constraints && String(opt.constraints).trim()) {
          optParts.push(`**Constraints:** ${opt.constraints}`);
        }
        optContent = optParts.join('\n');
      } 
      // Handle string
      else if (String(parsed.optimized_prompt).trim()) {
        optContent = String(parsed.optimized_prompt);
      }
      
      if (optContent) {
        sections.push(`**Optimized Prompt:**\n${optContent}`);
      }
    }
    
    if (parsed.changes_made && Array.isArray(parsed.changes_made) && parsed.changes_made.length > 0) {
      const changes = parsed.changes_made.filter((c: any) => c && String(c).trim()).map((change: string) => `• ${change}`).join('\n');
      if (changes) {
        sections.push(`**Changes Made:**\n${changes}`);
      }
    }
    
    if (parsed.techniques_applied && Array.isArray(parsed.techniques_applied) && parsed.techniques_applied.length > 0) {
      const techniques = parsed.techniques_applied.filter((t: any) => t && String(t).trim()).map((tech: string) => `• ${tech}`).join('\n');
      if (techniques) {
        sections.push(`**Techniques Applied:**\n${techniques}`);
      }
    }
    
    // Pro Tip - if it's the only content, show without header
    if (parsed.pro_tip && String(parsed.pro_tip).trim()) {
      if (sections.length === 0) {
        // Only pro tip exists, show content without header, then add share message
        return `${String(parsed.pro_tip).trim()}\n\n${getShareMessage()}`;
      } else {
        sections.push(`**Pro Tip:**\n${parsed.pro_tip}`);
      }
    }
    
    // Add share message if provided, otherwise add default share message
    if (parsed.share_message && String(parsed.share_message).trim()) {
      sections.push(`**Share Message:**\n${parsed.share_message}`);
    } else {
      // Add default share message to all responses
      sections.push(getShareMessage());
    }
    
    // If no sections, return fallback
    if (sections.length === 0) {
      return formatAssistantMessage(JSON.stringify(parsed));
    }
    
    return sections.join('\n\n');
  }

  // System Level Format - use existing formatSystemLevelResponse
  if (level === 'system') {
    return formatSystemLevelResponse(parsed);
  }

  // Master Level - use existing formatMasterLevelResponse logic
  if (level === 'mastery') {
    // formatMasterLevelResponse can handle both string and object
    // Pass the parsed object directly so it can detect the new structure (overview, deconstruct, etc.)
    return formatMasterLevelResponse(parsed);
  }

  // Fallback to general formatter
  return formatAssistantMessage(JSON.stringify(parsed));
}

/**
 * Tries to format partial JSON by extracting and formatting complete key-value pairs
 * Shows formatted content progressively as fields complete
 * Returns null if no meaningful content can be extracted (to prevent showing raw JSON)
 * 
 * This function processes the ENTIRE partial text and formats it as a complete unit,
 * ensuring no duplicates appear as new tokens arrive.
 */
function formatPartialJSON(text: string, level?: OptimizationLevelKey): string | null {
  const trimmed = text.trim();
  if (!trimmed.startsWith('{')) {
    return null; // Not JSON, return null to show loading
  }
  
  // If JSON is very incomplete (just opening brace or very short), don't try to format
  if (trimmed.length < 10 || trimmed === '{' || trimmed === '{\n') {
    return null;
  }
  
  let formatted = '';
  const seenKeys = new Set<string>();
  
  // Use a more sophisticated approach: find the last occurrence of each key
  // This ensures we always use the latest value as JSON streams in
  const keyPositions = new Map<string, { start: number; end: number; key: string; value: string }>();
  
  // Extract all key-value pairs and track their positions
  // Pattern matches: "key": "value" or "key": ["array"] or "key": {object}
  const keyValueRegex = /"([^"]+)":\s*("(?:[^"\\]|\\.)*"|\[[^\]]*\]|\{[^}]*\}|[^,}\]]+)/g;
  let match;
  
  while ((match = keyValueRegex.exec(trimmed)) !== null) {
    const key = match[1];
    const value = match[2].trim();
    const start = match.index;
    const end = match.index + match[0].length;
    
    // Always update to the latest occurrence of this key
    // This handles cases where the same key appears multiple times as JSON streams
    keyPositions.set(key, { start, end, key, value });
  }
  
  // Process keys in order of their appearance in the JSON (sorted by position)
  const sortedKeys = Array.from(keyPositions.values()).sort((a, b) => a.start - b.start);
  
  for (const { key, value: rawValue } of sortedKeys) {
    // Skip if we've already processed this key (shouldn't happen, but safety check)
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    
    // Remove quotes from string values
    let value = rawValue;
    if (value.startsWith('"') && value.endsWith('"')) {
      value = value.slice(1, -1).replace(/\\"/g, '"').replace(/\\n/g, '\n');
    }
    
    // Format based on level and key
    // Each section is formatted only once per call, using the latest value
    if (level === 'basic') {
      if (key === 'optimized_prompt' && value && value !== '""') {
        formatted += `**Optimized Prompt:**\n${value}\n\n`;
      } else if (key === 'changes_made') {
        if (value.startsWith('[')) {
          try {
            // Try to parse complete array first
            const arr = JSON.parse(value);
            if (Array.isArray(arr) && arr.length > 0) {
              formatted += `**Changes Made:**\n`;
              // Use Set to ensure no duplicate items
              const uniqueChanges = Array.from(new Set(arr.filter((c: string) => c)));
              uniqueChanges.forEach((change: string) => {
                formatted += `• ${change}\n`;
              });
              formatted += '\n';
            }
          } catch {
            // Partial array - extract items carefully
            // Remove brackets and split, but be careful with nested structures
            const arrayContent = value.replace(/^\[/, '').replace(/\]$/, '');
            if (arrayContent.trim()) {
              // Split by comma, but only if not inside nested quotes/braces
              const items: string[] = [];
              let currentItem = '';
              let depth = 0;
              let inQuotes = false;
              
              for (let i = 0; i < arrayContent.length; i++) {
                const char = arrayContent[i];
                if (char === '"' && (i === 0 || arrayContent[i - 1] !== '\\')) {
                  inQuotes = !inQuotes;
                }
                if (!inQuotes) {
                  if (char === '[' || char === '{') depth++;
                  if (char === ']' || char === '}') depth--;
                  if (char === ',' && depth === 0) {
                    const item = currentItem.trim().replace(/^"|"$/g, '').replace(/\\"/g, '"');
                    if (item) items.push(item);
                    currentItem = '';
                    continue;
                  }
                }
                currentItem += char;
              }
              // Add the last item
              if (currentItem.trim()) {
                const item = currentItem.trim().replace(/^"|"$/g, '').replace(/\\"/g, '"');
                if (item) items.push(item);
              }
              
              if (items.length > 0) {
                formatted += `**Changes Made:**\n`;
                // Use Set to ensure no duplicates
                const uniqueItems = Array.from(new Set(items));
                uniqueItems.forEach((item: string) => {
                  formatted += `• ${item}\n`;
                });
                formatted += '\n';
              }
            }
          }
        }
      } else if (key === 'share_message' && value && value !== '""') {
        formatted += `**Share Message:**\n${value}`;
      }
    } else if (level === 'structured') {
      if (key === 'optimized_prompt') {
        formatted += `**Optimized Prompt:**\n`;
        if (value.startsWith('{')) {
          try {
            const opt = JSON.parse(value);
            if (opt.role) formatted += `**Role:** ${opt.role}\n`;
            if (opt.objective) formatted += `**Objective:** ${opt.objective}\n`;
            if (opt.context) formatted += `**Context:** ${opt.context}\n`;
            if (opt.task) {
              if (Array.isArray(opt.task)) {
                formatted += `**Task:**\n`;
                opt.task.forEach((t: string) => formatted += `• ${t}\n`);
              } else {
                formatted += `**Task:** ${opt.task}\n`;
              }
            }
            if (opt.constraints) {
              if (Array.isArray(opt.constraints)) {
                formatted += `**Constraints:**\n`;
                opt.constraints.forEach((c: string) => formatted += `• ${c}\n`);
              } else {
                formatted += `**Constraints:** ${opt.constraints}\n`;
              }
            }
          } catch {
            formatted += `${value}\n`;
          }
        } else {
          formatted += `${value}\n`;
        }
        formatted += '\n';
      } else if (key === 'changes_made' && value.startsWith('[')) {
        try {
          const arr = JSON.parse(value);
          if (Array.isArray(arr) && arr.length > 0) {
            formatted += `**Changes Made:**\n`;
            // Use Set to ensure no duplicate items
            const uniqueChanges = Array.from(new Set(arr.filter((c: string) => c)));
            uniqueChanges.forEach((change: string) => {
              formatted += `• ${change}\n`;
            });
            formatted += '\n';
          }
        } catch {
          // Partial array - use same careful extraction logic
          const arrayContent = value.replace(/^\[/, '').replace(/\]$/, '');
          if (arrayContent.trim()) {
            const items: string[] = [];
            let currentItem = '';
            let depth = 0;
            let inQuotes = false;
            
            for (let i = 0; i < arrayContent.length; i++) {
              const char = arrayContent[i];
              if (char === '"' && (i === 0 || arrayContent[i - 1] !== '\\')) {
                inQuotes = !inQuotes;
              }
              if (!inQuotes) {
                if (char === '[' || char === '{') depth++;
                if (char === ']' || char === '}') depth--;
                if (char === ',' && depth === 0) {
                  const item = currentItem.trim().replace(/^"|"$/g, '').replace(/\\"/g, '"');
                  if (item) items.push(item);
                  currentItem = '';
                  continue;
                }
              }
              currentItem += char;
            }
            if (currentItem.trim()) {
              const item = currentItem.trim().replace(/^"|"$/g, '').replace(/\\"/g, '"');
              if (item) items.push(item);
            }
            
            if (items.length > 0) {
              formatted += `**Changes Made:**\n`;
              const uniqueItems = Array.from(new Set(items));
              uniqueItems.forEach((item: string) => {
                formatted += `• ${item}\n`;
              });
              formatted += '\n';
            }
          }
        }
      } else if (key === 'techniques_applied' && value.startsWith('[')) {
        try {
          const arr = JSON.parse(value);
          if (Array.isArray(arr) && arr.length > 0) {
            formatted += `**Techniques Applied:**\n`;
            // Use Set to ensure no duplicate items
            const uniqueTechs = Array.from(new Set(arr.filter((t: string) => t)));
            uniqueTechs.forEach((tech: string) => {
              formatted += `• ${tech}\n`;
            });
            formatted += '\n';
          }
        } catch {
          // Partial array - use same careful extraction logic
          const arrayContent = value.replace(/^\[/, '').replace(/\]$/, '');
          if (arrayContent.trim()) {
            const items: string[] = [];
            let currentItem = '';
            let depth = 0;
            let inQuotes = false;
            
            for (let i = 0; i < arrayContent.length; i++) {
              const char = arrayContent[i];
              if (char === '"' && (i === 0 || arrayContent[i - 1] !== '\\')) {
                inQuotes = !inQuotes;
              }
              if (!inQuotes) {
                if (char === '[' || char === '{') depth++;
                if (char === ']' || char === '}') depth--;
                if (char === ',' && depth === 0) {
                  const item = currentItem.trim().replace(/^"|"$/g, '').replace(/\\"/g, '"');
                  if (item) items.push(item);
                  currentItem = '';
                  continue;
                }
              }
              currentItem += char;
            }
            if (currentItem.trim()) {
              const item = currentItem.trim().replace(/^"|"$/g, '').replace(/\\"/g, '"');
              if (item) items.push(item);
            }
            
            if (items.length > 0) {
              formatted += `**Techniques Applied:**\n`;
              const uniqueItems = Array.from(new Set(items));
              uniqueItems.forEach((item: string) => {
                formatted += `• ${item}\n`;
              });
              formatted += '\n';
            }
          }
        }
      } else if (key === 'pro_tip' && value && value !== '""') {
        formatted += `**Pro Tip:**\n${value}\n\n`;
      } else if (key === 'share_message' && value && value !== '""') {
        formatted += `**Share Message:**\n${value}`;
      }
    }
  }
  
  // If we couldn't extract any meaningful formatted content, return null
  // This prevents raw JSON from being shown
  if (!formatted || formatted.trim() === '') {
    return null;
  }
  
  // Add loading indicator if JSON is incomplete
  if (!trimmed.endsWith('}')) {
    formatted += '\n\n*Generating...*';
  }
  
  return formatted;
}

/**
 * Checks if text contains raw JSON that hasn't been formatted yet
 */
function containsRawJSON(text: string): boolean {
  const trimmed = text.trim();
  // Check for JSON-like patterns that indicate raw JSON
  if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
    return false;
  }
  
  // If it starts with { but contains unformatted JSON patterns
  // Look for patterns like: "key": "value" or "key": [ or "key": {
  const jsonPattern = /"[\w_]+"\s*:\s*("|\[|\{)/;
  if (jsonPattern.test(trimmed)) {
    // Check if it's already formatted (contains markdown headers)
    if (trimmed.includes('**') || trimmed.includes('•') || trimmed.includes('Optimized Prompt')) {
      return false; // Already formatted
    }
    return true; // Raw JSON detected
  }
  
  return false;
}

/**
 * Detects and formats JSON content in streaming tokens.
 * Shows formatted content progressively as it becomes available.
 * For partial JSON, formats complete fields and shows loading indicator.
 * Never shows raw JSON - always formats or shows loading.
 */
function formatStreamingToken(partialText: string, level?: OptimizationLevelKey): string {
  if (!partialText || typeof partialText !== 'string') {
    return '';
  }

  const trimmed = partialText.trim();
  
  // If text contains raw JSON patterns, we need to format it or hide it
  if (containsRawJSON(trimmed)) {
    // Try to parse as complete JSON first
    if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
      try {
        const parsed = JSON.parse(trimmed);
        // If successful, format it according to backend structure
        if (level) {
          return formatOptimizationResponse(parsed, level);
        }
        return formatAssistantMessage(JSON.stringify(parsed));
      } catch {
        // Not complete JSON yet - try to format partial content
        if (level) {
          const formatted = formatPartialJSON(trimmed, level);
          // Only return formatted content if we actually extracted something meaningful
          // If null, it means we couldn't format anything - show loading instead
          if (formatted !== null && formatted.trim() !== '') {
            return formatted;
          }
          // If we couldn't format anything meaningful, show loading to prevent raw JSON
          return '*Generating optimized prompt...*';
        }
        // For non-level-specific, show loading indicator instead of raw JSON
        return '*Generating...*';
      }
    }
  }
  
  // If text looks like JSON (starts with { or [), try to parse and format it
  if (trimmed.startsWith('{') || trimmed.startsWith('[')) {
    try {
      // Try to parse as complete JSON
      const parsed = JSON.parse(trimmed);
      // If successful, format it according to backend structure
      if (level) {
        return formatOptimizationResponse(parsed, level);
      }
      return formatAssistantMessage(JSON.stringify(parsed));
    } catch {
      // Not complete JSON yet (still streaming) - format partial content
      if (level) {
        const formatted = formatPartialJSON(trimmed, level);
        // Only return if we have meaningful formatted content
        // If null, it means we couldn't format anything - show loading instead
        if (formatted !== null && formatted.trim() !== '') {
          return formatted;
        }
        return '*Generating optimized prompt...*';
      }
      // For non-level-specific, show loading indicator instead of raw JSON
      return '*Generating...*';
    }
  }
  
  // Check if text contains Python dict-like structures (single quotes)
  // formatAssistantMessage handles Python dict parsing
  if (trimmed.includes("'") && (trimmed.includes('{') || trimmed.includes('['))) {
    try {
      // Try using formatAssistantMessage which handles Python dict parsing
      const formatted = formatAssistantMessage(trimmed);
      // If we have a level and the formatted result looks like JSON, try to parse and format it
      if (level && formatted.includes('{')) {
        try {
          const parsed = JSON.parse(formatted);
          return formatOptimizationResponse(parsed, level);
        } catch {
          // Partial JSON - format what we can
          const partialFormatted = formatPartialJSON(trimmed, level);
          if (partialFormatted !== null && partialFormatted.trim() !== '') {
            return partialFormatted;
          }
          return '*Generating optimized prompt...*';
        }
      }
      return formatted;
    } catch {
      // If formatting fails, try partial formatting
      if (level && trimmed.startsWith('{')) {
        const partialFormatted = formatPartialJSON(trimmed, level);
        if (partialFormatted !== null && partialFormatted.trim() !== '') {
          return partialFormatted;
        }
        return '*Generating optimized prompt...*';
      }
      return '*Generating...*';
    }
  }
  
  // No JSON detected, return text as-is (regular text content)
  // But check if it might be part of JSON that's being streamed
  if (trimmed.includes('"') && (trimmed.includes(':') || trimmed.includes(','))) {
    // Might be part of JSON - show loading instead
    return '*Generating...*';
  }
  
  return partialText;
}

function getWebSocketBaseUrl() {
  if (!API_BASE_URL) return '';
  if (API_BASE_URL.startsWith('https')) {
    return API_BASE_URL.replace('https', 'wss');
  }
  if (API_BASE_URL.startsWith('http')) {
    return API_BASE_URL.replace('http', 'ws');
  }
  return `ws://${API_BASE_URL.replace(/^\/+/, '')}`;
}

export type OptimizationLevelKey = 'basic' | 'structured' | 'mastery' | 'system';

export interface OptimizationSocketCallbacks {
  onToken?: (partialText: string) => void;
  onCompleted?: (chatId: string, messageId?: string) => void;
  onError?: (message: string) => void;
  onCancelled?: () => void;
  onFinalText?: (finalText: string) => void;
}

export interface OptimizationSocketOptions {
  level: OptimizationLevelKey;
  userId: string;
  chatId?: string | null;
  userPrompt: string;
  callbacks: OptimizationSocketCallbacks;
}

function getOptimizationWebSocketPath(level: OptimizationLevelKey): string {
  if (level === 'structured') return '/optimize-prompt/ws/structure-level-optimization';
  if (level === 'mastery') return '/optimize-prompt/ws/master-level-optimization';
  if (level === 'system') return '/optimize-prompt/ws/system-level-optimization';
  return '/optimize-prompt/ws/basic-level-optimization';
}

/**
 * Creates and opens a WebSocket connection for prompt optimization.
 * Returns the WebSocket instance so callers can manage its lifecycle (close, send stop, etc.).
 */
export function createOptimizationSocket(options: OptimizationSocketOptions): WebSocket | null {
  const wsBase = getWebSocketBaseUrl();
  if (!wsBase) {
    options.callbacks.onError?.('WebSocket endpoint is not configured. Please contact support.');
    return null;
  }

  const wsUrl = `${wsBase}${getOptimizationWebSocketPath(options.level)}`;
  const socket = new WebSocket(wsUrl);

  socket.onopen = () => {
    socket.send(
      JSON.stringify({
        user_prompt: options.userPrompt,
        chat_id: options.chatId ?? null,
        user_id: options.userId,
      }),
    );
  };

  socket.onmessage = async (event) => {
    try {
      const data = JSON.parse(event.data);
      const eventType = data.event;

      // Handle "processing" event silently (backend is starting to process)
      if (eventType === 'processing') {
        return; // Ignore silently, no UI update needed
      }

      if (eventType === 'token' && data.data) {
        const rawPartialText: string =
          data.data.partial_text ??
          data.data.token ??
          '';
        
        // Format JSON progressively - shows formatted content as it streams
        const formattedText = formatStreamingToken(rawPartialText, options.level);
        
        // Always update UI with formatted content (even if partial)
        if (formattedText) {
          options.callbacks.onToken?.(formattedText);
        }
        return;
      }

      if (eventType === 'completed') {
        const newChatId = data.chat_id;
        const messageId = data.message_id;
        if (newChatId && newChatId !== 'undefined' && newChatId !== 'null') {
          options.callbacks.onCompleted?.(newChatId, messageId);
        }
        return;
      }

      if (eventType === 'optimization_complete') {
        const payload = data.data || {};
        const newChatId = payload.chat_id;
        const messageId = payload.message_id;
        if (newChatId && newChatId !== 'undefined' && newChatId !== 'null') {
          options.callbacks.onCompleted?.(newChatId, messageId);
        }
        return;
      }

      if (eventType === 'model_end' && data.data) {
        const rawFinalText: string = data.data.final_text ?? '';
        if (rawFinalText) {
          // Format final text according to backend structure
          const formattedFinalText = formatStreamingToken(rawFinalText, options.level);
          if (formattedFinalText) {
            options.callbacks.onFinalText?.(formattedFinalText);
          } else {
            // Fallback: if final text couldn't be formatted, try formatAssistantMessage
            options.callbacks.onFinalText?.(formatAssistantMessage(rawFinalText));
          }
        }
        return;
      }

      if (eventType === 'error') {
        const messageText: string =
          data.message ||
          data.data?.error ||
          data.data ||
          'Sorry, something went wrong while optimizing your prompt. Please try again.';
        options.callbacks.onError?.(messageText);
        return;
      }

      if (eventType === 'cancelled') {
        options.callbacks.onCancelled?.();
        return;
      }
    } catch (err) {
      logError(err, 'createOptimizationSocket.onmessage');
    }
  };

  socket.onerror = (event) => {
    logError(event, 'createOptimizationSocket.onerror');
    options.callbacks.onError?.('WebSocket connection error. Please try again.');
  };

  return socket;
}


